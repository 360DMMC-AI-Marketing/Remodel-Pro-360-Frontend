import api from "./interceptor";

export interface GeneratedImage {
  url: string;
  resolution: string;
  signedUrl?: string;
  createdAt: string;
}

export interface DesignSession {
  _id: string;
  userId: string;
  projectId?: string;
  roomPhoto: { url: string; signedUrl?: string; uploadedAt: string };
  style: { id: string; prompt?: string };
  generatedImages: GeneratedImage[];
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

export const designService = {
  async generate(
    image: File,
    roomType: string,
    designStyle: string,
    prompt?: string,
    projectId?: string,
  ): Promise<DesignSession> {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("roomType", roomType);
    formData.append("designStyle", designStyle);
    if (prompt) formData.append("prompt", prompt);
    if (projectId) formData.append("projectId", projectId);

    const res = await api.post("/designs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180_000, // 3 min — AI generation can be slow
    });
    return res.data.data as DesignSession;
  },

  async getMyDesigns(
    page = 1,
    limit = 20,
  ): Promise<{ data: DesignSession[]; page: number; totalPages: number; total: number }> {
    const res = await api.get("/designs", { params: { page, limit } });
    return res.data;
  },

  async getDesign(id: string): Promise<DesignSession> {
    const res = await api.get(`/designs/${id}`);
    return res.data.data as DesignSession;
  },

  async deleteDesign(id: string): Promise<void> {
    await api.delete(`/designs/${id}`);
  },
};
