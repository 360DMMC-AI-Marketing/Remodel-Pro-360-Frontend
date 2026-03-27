import api from "@/api/interceptor";
import type { VettingRequestData } from "@/api/contractor";

export type VettingStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "more_info_needed";

export type VettingAction = "approved" | "rejected" | "more_info_needed";

type ContractorSummary = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  contractor?: { companyName?: string };
};

export type PopulatedVettingRequest = Omit<VettingRequestData, "contractorId"> & {
  contractorId: ContractorSummary;
};

export interface AdminStats {
  totalUsers: number;
  totalContractors: number;
  totalHomeowners: number;
  totalProjects: number;
  pendingVetting: number;
  disputedMilestones: number;
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  contractor?: { isVerified?: boolean; companyName?: string };
  createdAt: string;
}

export interface DisputedMilestone {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  paymentAmount: number;
  status: string;
  disputeReason?: string;
  proofImages?: string[];
  deliverables?: string[];
  updatedAt: string;
  project?: {
    title: string;
    homeownerId: { firstName: string; lastName: string; email: string };
  };
}

export interface ChartData {
  signupSeries: { month: string; homeowners: number; contractors: number }[];
  projectsByStatus: { status: string; count: number }[];
  revenueSeries: { month: string; revenue: number; platformFees: number }[];
  projectsByRoom: { roomType: string; count: number }[];
  bidSeries: { month: string; submitted: number; accepted: number }[];
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/admin/stats");
    return response.data as AdminStats;
  },

  getChartData: async (): Promise<ChartData> => {
    const response = await api.get("/admin/charts");
    return response.data as ChartData;
  },

  getUsers: async (params: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ users: AdminUser[]; total: number }> => {
    const response = await api.get("/admin/users", { params });
    return response.data as { users: AdminUser[]; total: number };
  },

  getVettingRequests: async (
    status: VettingStatus = "all",
  ): Promise<PopulatedVettingRequest[]> => {
    const params = status !== "all" ? { status } : {};
    const response = await api.get("/admin/vetting", { params });
    return response.data.requests as PopulatedVettingRequest[];
  },

  reviewVettingRequest: async (
    id: string,
    action: VettingAction,
    adminNotes?: string,
  ): Promise<void> => {
    await api.patch(`/admin/vetting/${id}`, { action, adminNotes });
  },

  getDisputes: async (): Promise<DisputedMilestone[]> => {
    const response = await api.get("/admin/disputes");
    return (response.data as { disputes: DisputedMilestone[] }).disputes;
  },

  resolveDispute: async (milestoneId: string, resolution: "approved" | "in_progress"): Promise<void> => {
    await api.patch(`/admin/disputes/${milestoneId}/resolve`, { resolution });
  },
};
