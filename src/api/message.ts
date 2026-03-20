import api from "./interceptor";

export interface MessageSender {
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface MessageRecord {
  _id: string;
  projectId: string;
  senderId: string | MessageSender;
  receiverId: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const messageService = {
  /**
   * Send a new message to a project room
   */
  async sendMessage(
    projectId: string,
    content: string,
    receiverId?: string,
    attachmentFiles?: File[]
  ): Promise<MessageRecord> {
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("content", content);

    if (receiverId) {
      formData.append("receiverId", receiverId);
    }

    for (const file of attachmentFiles ?? []) {
      formData.append("attachments", file);
    }

    const response = await api.post("/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.message;
  },

  /**
   * Get messages for a specific project with pagination
   */
  async getProjectMessages(
    projectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<MessageRecord[]> {
    const response = await api.get(`/messages/project/${projectId}`, {
      params: { page, limit },
    });
    return (response.data.messages ?? []) as MessageRecord[];
  },

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<MessageRecord> {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data.message;
  },

  /**
   * Edit an existing message
   */
  async editMessage(messageId: string, content: string): Promise<MessageRecord> {
    const response = await api.patch(`/messages/${messageId}`, { content });
    return response.data.message;
  },

  /**
   * Delete an existing message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; messageId: string }> {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data as { success: boolean; messageId: string };
  },
};
