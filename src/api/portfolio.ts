import api from "@/api/interceptor";

export interface PortfolioItem {
  _id: string;
  contractorId: string;
  projectId?: string;
  title: string;
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

  getMyPortfolio: async (): Promise<PortfolioItem[]> => {
    const response = await api.get("/portfolio/me");
    return (response.data as { items: PortfolioItem[] }).items;
  },

  create: async (payload: {
    title: string;
    description: string;
    tags?: string[];
    images: File[];
  }): Promise<PortfolioItem> => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    if (payload.tags && payload.tags.length > 0) {
      formData.append("tags", JSON.stringify(payload.tags));
    }
    for (const file of payload.images) {
      formData.append("images", file);
    }
    const response = await api.post("/portfolio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (response.data as { item: PortfolioItem }).item;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/portfolio/${id}`);
  },
};
