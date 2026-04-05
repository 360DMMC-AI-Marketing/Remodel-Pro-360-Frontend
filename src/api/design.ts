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
  /**
   * Submit a design job — returns immediately with session ID (202).
   * The actual generation happens in a background worker.
   */
  async generate(
    image: File,
    roomType: string,
    designStyle: string,
    prompt?: string,
    projectId?: string,
    roomDimensions?: { length: number; width: number; height: number },
  ): Promise<DesignSession> {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("roomType", roomType);
    formData.append("designStyle", designStyle);
    if (prompt) formData.append("prompt", prompt);
    if (projectId) formData.append("projectId", projectId);
    if (roomDimensions) formData.append("roomDimensions", JSON.stringify(roomDimensions));

    const res = await api.post("/designs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as DesignSession;
  },

  /**
   * Poll for session status — lightweight endpoint.
   * Returns full data (signed URLs) only when status is "completed".
   */
  async getStatus(id: string): Promise<DesignSession> {
    const res = await api.get(`/designs/${id}/status`);
    return res.data.data as DesignSession;
  },

  /**
   * Poll until the session reaches a terminal state (completed or failed).
   * Calls onStatus on each poll so the UI can update.
   */
  async pollUntilDone(
    id: string,
    onStatus?: (session: DesignSession) => void,
    intervalMs = 3000,
    maxAttempts = 60,
  ): Promise<DesignSession> {
    for (let i = 0; i < maxAttempts; i++) {
      const session = await this.getStatus(id);
      onStatus?.(session);

      if (session.status === "completed" || session.status === "failed") {
        return session;
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Design generation timed out");
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

  // ── Favorites ──────────────────────────────────────────────

  async toggleFavorite(id: string): Promise<{ favorited: boolean }> {
    const res = await api.post(`/designs/${id}/favorite`);
    return res.data.data;
  },

  async getFavorites(
    page = 1,
    limit = 20,
  ): Promise<{ data: DesignSession[]; page: number; totalPages: number; total: number }> {
    const res = await api.get("/designs/favorites", { params: { page, limit } });
    return res.data;
  },

  // ── Share Link ─────────────────────────────────────────────

  async generateShareLink(id: string): Promise<string> {
    const res = await api.post(`/designs/${id}/share`);
    return res.data.data.shareToken;
  },

  async revokeShareLink(id: string): Promise<void> {
    await api.delete(`/designs/${id}/share`);
  },

  async getSharedDesign(token: string): Promise<DesignSession> {
    const res = await api.get(`/designs/shared/${token}`);
    return res.data.data as DesignSession;
  },

  // ── Attach to Project ──────────────────────────────────────

  async attachToProject(designId: string, projectId: string): Promise<void> {
    await api.post(`/designs/${designId}/attach`, { projectId });
  },

  async detachFromProject(designId: string): Promise<void> {
    await api.delete(`/designs/${designId}/attach`);
  },
};
