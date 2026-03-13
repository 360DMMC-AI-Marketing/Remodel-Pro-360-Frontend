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

export const adminService = {
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
};
