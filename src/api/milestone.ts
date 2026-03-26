import api from "@/api/interceptor";

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "approved"
  | "paid"
  | "disputed";

export interface MilestoneRecord {
  _id: string;
  projectId: string;
  order: number;
  name: string;
  description?: string;
  percentOfTotal: number;
  paymentAmount: number;
  estimatedDurationDays?: number;
  deliverables: string[];
  status: MilestoneStatus;
  proofImages?: string[];
  disputeReason?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestonePayload {
  name: string;
  description?: string;
  percentOfTotal: number;
  estimatedDurationDays?: number;
  deliverables?: string[];
}

export const milestoneService = {
  setMilestones: async (projectId: string, milestones: CreateMilestonePayload[]) => {
    const response = await api.post(`/milestones/project/${projectId}`, { milestones });
    return response.data.data as MilestoneRecord[];
  },

  getProjectMilestones: async (projectId: string) => {
    const response = await api.get(`/milestones/project/${projectId}`);
    return response.data.data as MilestoneRecord[];
  },

  updateMilestoneStatus: async (
    milestoneId: string,
    status: string,
    options?: { proofImages?: File[]; disputeReason?: string },
  ) => {
    if (status === "submitted" && options?.proofImages && options.proofImages.length > 0) {
      const formData = new FormData();
      formData.append("status", status);
      for (const file of options.proofImages) {
        formData.append("proofImages", file);
      }
      const response = await api.patch(`/milestones/${milestoneId}/status`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data as MilestoneRecord;
    }
    const body: Record<string, string> = { status };
    if (options?.disputeReason) body.disputeReason = options.disputeReason;
    const response = await api.patch(`/milestones/${milestoneId}/status`, body);
    return response.data.data as MilestoneRecord;
  },
};
