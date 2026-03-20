import api from "@/api/interceptor";

export type ContractParty = "homeowner" | "contractor";

export interface ContractSignature {
  party: ContractParty;
  userId: string;
  signedAt: string;
  ip?: string;
}

export interface ContractRecord {
  _id: string;
  projectId: string;
  bidId: string;
  homeownerId: string;
  contractorId: string;
  status: "draft" | "pending_signatures" | "signed" | "cancelled";
  terms: string;
  totalAmount: number;
  currency: string;
  startDate?: string;
  estimatedEndDate?: string;
  signatures?: ContractSignature[];
  signedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const contractService = {
  getProjectContract: async (projectId: string) => {
    const response = await api.get(`/contracts/project/${projectId}`);
    return (response.data.data ?? null) as ContractRecord | null;
  },

  getContractById: async (contractId: string) => {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data.data as ContractRecord;
  },

  startSignatureFlow: async (contractId: string) => {
    const response = await api.patch(`/contracts/${contractId}/start-signature`);
    return response.data.data as ContractRecord;
  },

  signContract: async (contractId: string) => {
    const response = await api.patch(`/contracts/${contractId}/sign`);
    return response.data.data as ContractRecord;
  },
};
