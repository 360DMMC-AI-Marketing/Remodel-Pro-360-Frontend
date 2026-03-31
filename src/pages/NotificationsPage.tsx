import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService, type AppNotification } from "@/api/notification";
import { bidService } from "@/api/bid";
import { contractService } from "@/api/contract";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/stores/useAuth";
import { Skeleton } from "@/components/atoms/Skeleton";

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

const NotificationsPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  useEffect(() => {
    notificationService
      .getNotifications(1, 50)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const resolveRoute = async (notification: AppNotification): Promise<string | null> => {
    if (notification.type === "BID_RECEIVED" && notification.relatedId) {
      return `/homeowner/projects/${notification.relatedId}`;
    }
    if (notification.type === "VETTING_STATUS") return "/contractor/profile";
    if (
      (notification.type === "BID_ACCEPTED" || notification.type === "BID_REJECTED") &&
      role === "contractor"
    ) {
      if (!notification.relatedId) return "/contractor/projects";
      try {
        const bid = await bidService.getBidById(notification.relatedId);
        const projectId = typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
        if (projectId) return `/contractor/projects/${projectId}`;
      } catch {
        return "/contractor/projects";
      }
      return "/contractor/projects";
    }
    if (notification.type === "PROJECT_UPDATE" && role === "contractor") {
      if (!notification.relatedId) return "/contractor/projects";
      try {
        // relatedId may be a contract ID (from contract notifications) or a bid ID
        const contract = await contractService.getContractById(notification.relatedId);
        if (contract?.projectId) return `/contractor/projects/${contract.projectId}`;
      } catch {
        // Not a contract ID — try as bid ID
        try {
          const bid = await bidService.getBidById(notification.relatedId);
          const projectId = typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
          if (projectId) return `/contractor/projects/${projectId}`;
        } catch {
          return "/contractor/projects";
        }
      }
      return "/contractor/projects";
    }
    if (notification.type === "PROJECT_UPDATE" && role === "homeowner") {
      if (!notification.relatedId) return "/homeowner/projects";
      try {
        const contract = await contractService.getContractById(notification.relatedId);
        if (contract?.projectId) return `/homeowner/projects/${contract.projectId}`;
      } catch {
        return "/homeowner/projects";
      }
      return "/homeowner/projects";
    }
    if (role === "homeowner") return "/homeowner/projects";
    if (role === "contractor") return "/contractor/projects";
    return "/admin/dashboard";
  };

  const handleClick = async (notification: AppNotification) => {
    if (!notification.isRead) await handleMarkAsRead(notification._id);
    const route = await resolveRoute(notification);
    if (route) navigate(route);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell size={22} className="text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => void handleMarkAllAsRead()}
            className="flex items-center gap-1 text-xs font-medium text-primary-600"
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Bell size={48} className="mb-3" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                item.isRead
                  ? "border-neutral-200 bg-white hover:bg-neutral-50"
                  : "border-primary-200 bg-primary-50 hover:bg-primary-100"
              }`}
              role="button"
              tabIndex={0}
              onClick={() => void handleClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void handleClick(item);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">{item.title}</p>
                  <p className="text-sm text-neutral-600 mt-0.5">{item.message}</p>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    {formatNotificationTime(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkAsRead(item._id);
                      }}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(item._id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
