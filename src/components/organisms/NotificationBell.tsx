import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { notificationService, type AppNotification } from "@/api/notification";
import { bidService } from "@/api/bid";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/stores/useAuth";

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const { token, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(1, 20);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!token) return;

    const apiBase =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:3000/api";
    const socketUrl = apiBase.replace(/\/api\/?$/, "");

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("new_notification", (notification: AppNotification) => {
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }
        return [notification, ...current];
      });
      toast(notification.title, { description: notification.message });
      setLoading(false);
    });

    socket.on("connect_error", () => {
      // Keep polling as fallback when websocket auth/connection fails.
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((item) =>
        item._id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
  };

  const handleDelete = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    setNotifications((current) =>
      current.filter((item) => item._id !== notificationId),
    );
  };

  const resolveNotificationRoute = async (
    notification: AppNotification,
  ): Promise<string | null> => {
    if (notification.type === "BID_RECEIVED" && notification.relatedId) {
      return `/homeowner/projects/${notification.relatedId}`;
    }

    if (notification.type === "VETTING_STATUS") {
      return "/contractor/profile";
    }

    if (
      (notification.type === "BID_ACCEPTED" ||
        notification.type === "BID_REJECTED" ||
        notification.type === "PROJECT_UPDATE") &&
      role === "contractor"
    ) {
      if (!notification.relatedId) {
        return "/contractor/projects";
      }

      try {
        const bid = await bidService.getBidById(notification.relatedId);
        const projectId =
          typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;

        if (projectId) {
          return `/contractor/projects/${projectId}`;
        }
      } catch {
        return "/contractor/projects";
      }

      return "/contractor/projects";
    }

    if (role === "homeowner") return "/homeowner/projects";
    if (role === "contractor") return "/contractor/projects";
    return "/admin/dashboard";
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    const route = await resolveNotificationRoute(notification);
    setOpen(false);
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative rounded-full border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-50 cursor-pointer"
        aria-label="Toggle notifications"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-60 mt-3 w-[min(26rem,90vw)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between px-2">
            <h6>Notifications</h6>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>

          {loading ? (
            <p className="p-2 text-sm text-neutral-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="p-2 text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`rounded-xl border p-3 cursor-pointer ${
                    item.isRead ? "border-neutral-200 bg-white" : "border-primary-200 bg-primary-50"
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleNotificationClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void handleNotificationClick(item);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{item.title}</p>
                      <p className="text-sm text-neutral-600">{item.message}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatNotificationTime(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!item.isRead && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleMarkAsRead(item._id);
                          }}
                          title="Mark as read"
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(item._id);
                        }}
                        title="Delete notification"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
