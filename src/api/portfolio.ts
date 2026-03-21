import api from "@/api/interceptor";

export interface PortfolioItem {
  _id: string;
  contractorId: string;
  projectId: string;
  images: string[];
  description: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const portfolioService = {
  getContractorPortfolio: async (contractorId: string): Promise<PortfolioItem[]> => {
    const response = await api.get(`/portfolio/contractor/${contractorId}`);
    return (response.data as { items: PortfolioItem[] }).items;
  },
};
