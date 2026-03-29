import api from "@/api/interceptor";

export interface EscrowPaymentResponse {
  clientSecret: string;
  paymentId: string;
  amount: number;
  homeownerFee: number;
  contractTotal: number;
}

export interface PaymentRecord {
  _id: string;
  projectId: string | { _id: string; title?: string };
  milestoneId?: string | { _id: string; name?: string };
  type: "escrow_deposit" | "escrow_release" | "milestone_payout" | "fee";
  amount: number;
  status: "pending" | "succeeded" | "failed";
  stripePaymentIntentId?: string;
  description?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalInEscrow: number;
}

export interface MyPaymentsResponse {
  payments: PaymentRecord[];
  summary: PaymentSummary;
  total: number;
  page: number;
  totalPages: number;
}

export interface EscrowStatus {
  totalDeposited: number;
  released: number;
  held: number;
  funded: boolean;
  payments: PaymentRecord[];
}

export const paymentService = {
  createEscrowPayment: async (projectId: string) => {
    const response = await api.post(`/payments/escrow/${projectId}`);
    return response.data.data as EscrowPaymentResponse;
  },

  confirmEscrowPayment: async (paymentIntentId: string) => {
    const response = await api.post("/payments/confirm", { paymentIntentId });
    return response.data.data;
  },

  releaseMilestonePayment: async (milestoneId: string) => {
    const response = await api.post(`/payments/release/${milestoneId}`);
    return response.data.data;
  },

  getEscrowStatus: async (projectId: string) => {
    const response = await api.get(`/payments/escrow-status/${projectId}`);
    const raw = response.data.data;
    const escrow = raw.escrow ?? { totalDeposited: 0, released: 0, held: 0 };
    return {
      totalDeposited: escrow.totalDeposited,
      released: escrow.released,
      held: escrow.held,
      funded: escrow.totalDeposited > 0,
      payments: raw.payments ?? [],
    } as EscrowStatus;
  },

  getMyPayments: async (page = 1, limit = 20) => {
    const response = await api.get("/payments/my", { params: { page, limit } });
    return response.data as MyPaymentsResponse;
  },

  getContractorEarnings: async (page = 1, limit = 20) => {
    const response = await api.get("/payments/contractor/earnings", { params: { page, limit } });
    return response.data as {
      payments: PaymentRecord[];
      summary: { totalEarned: number; totalPending: number; totalFees: number };
      total: number;
      page: number;
      totalPages: number;
    };
  },

  downloadReceipt: async (milestoneId: string) => {
    const response = await api.get(`/payments/receipt/${milestoneId}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${milestoneId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
