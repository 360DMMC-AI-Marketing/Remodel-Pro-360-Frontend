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

  updateMilestoneStatus: async (milestoneId: string, status: string) => {
    const response = await api.patch(`/milestones/${milestoneId}/status`, { status });
    return response.data.data as MilestoneRecord;
  },
};
