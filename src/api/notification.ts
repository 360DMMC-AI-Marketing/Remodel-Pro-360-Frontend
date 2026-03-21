import api from "@/api/interceptor";

export interface AppNotification {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type:
    | "BID_RECEIVED"
    | "BID_ACCEPTED"
    | "BID_REJECTED"
    | "MESSAGE_RECEIVED"
    | "PROJECT_UPDATE"
    | "VETTING_STATUS";
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const notificationService = {
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get("/notifications", { params: { page, limit } });
    return (response.data.notifications ?? []) as AppNotification[];
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.notification as AppNotification;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};
