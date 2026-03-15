import api from "@/api/interceptor";

export interface ContractorProject {
  _id: string;
  title: string;
  roomType?: string;
  description?: string;
  status?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  customBudget?: number;
  address?: {
    city?: string;
    state?: string;
  };
}

export interface BidRecord {
  _id: string;
  projectId:
    | string
    | {
        _id: string;
        title?: string;
        status?: string;
      };
  contractorId: string;
  amount: number;
  status:
    | "draft"
    | "submitted"
    | "shortlisted"
    | "accepted"
    | "rejected"
    | "withdrawn";
  message?: string;
  estimatedStartDate?: string;
  estimatedDurationDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeownerBid extends Omit<BidRecord, "contractorId"> {
  contractorId:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
      };
}

export interface SubmitBidPayload {
  projectId: string;
  amount: number;
  message?: string;
  estimatedStartDate?: string;
  estimatedDurationDays?: number;
}

export const bidService = {
  getBiddingProjects: async () => {
    const response = await api.get("/projects/search/by-status", {
      params: { status: "bidding", page: 1, limit: 100 },
    });
    return (response.data.projects ?? []) as ContractorProject[];
  },

  getMyBids: async () => {
    const response = await api.get("/bids/contractor/my-bids");
    return (response.data.data ?? []) as BidRecord[];
  },

  getProjectBids: async (projectId: string) => {
    const response = await api.get(`/bids/project/${projectId}`);
    return (response.data.data ?? []) as HomeownerBid[];
  },

  getBidById: async (bidId: string) => {
    const response = await api.get(`/bids/${bidId}`);
    return response.data.data as BidRecord;
  },

  submitBid: async (payload: SubmitBidPayload) => {
    const response = await api.post("/bids", payload);
    return response.data.data as BidRecord;
  },

  acceptBid: async (bidId: string) => {
    const response = await api.patch(`/bids/${bidId}/accept`);
    return response.data.data as HomeownerBid;
  },

  rejectBid: async (bidId: string, message?: string) => {
    const response = await api.patch(`/bids/${bidId}/reject`, {
      message,
    });
    return response.data.data as HomeownerBid;
  },
};
