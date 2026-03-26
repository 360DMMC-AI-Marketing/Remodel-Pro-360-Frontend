import SideBar from "@/components/organisms/SideBar";
import NotificationBell from "@/components/organisms/NotificationBell";
import { useAuth } from "@/stores/useAuth";
import { getImageUrl } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { notificationService } from "@/api/notification";

const SIDEBAR_COLLAPSED_SESSION_KEY = "rp360.sidebar.collapsed";

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const persisted = window.sessionStorage.getItem(SIDEBAR_COLLAPSED_SESSION_KEY);
    return persisted === "true";
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileUnread, setMobileUnread] = useState(0);

  useEffect(() => {
    window.sessionStorage.setItem(SIDEBAR_COLLAPSED_SESSION_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch unread count for mobile bell badge
  useEffect(() => {
    const load = () => {
      notificationService
        .getNotifications(1, 1)
        .then((data) => setMobileUnread(data.filter((n) => !n.isRead).length))
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const profileLink =
    user?.role === "contractor"
      ? "/contractor/profile"
      : user?.role === "admin"
        ? "/admin/dashboard"
        : "/homeowner/profile";

  const notificationsPath = useMemo(() => {
    if (user?.role === "contractor") return "/contractor/notifications";
    if (user?.role === "admin") return "/admin/notifications";
    return "/homeowner/notifications";
  }, [user?.role]);

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`relative z-10 h-full w-70 transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SideBar
            isCollapsed={false}
            setIsCollapsed={() => {}}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      {/* Main area */}
      <div
        className={`flex flex-1 flex-col min-h-screen transition-all duration-300 ${isCollapsed ? "lg:ml-sidebar-collapsed" : "lg:ml-sidebar"}`}
      >
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
          {/* Left side: hamburger (mobile) */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Spacer for desktop (sidebar already visible) */}
          <div className="hidden lg:block" />

          {/* Right side: notification bell + profile */}
          <div className="flex items-center gap-3">
            {/* Desktop: dropdown bell */}
            <div className="hidden md:block">
              <NotificationBell />
            </div>

            {/* Mobile: link to notifications page */}
            <button
              type="button"
              className="relative rounded-full border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-50 md:hidden"
              onClick={() => navigate(notificationsPath)}
            >
              <Bell size={20} />
              {mobileUnread > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {mobileUnread > 9 ? "9+" : mobileUnread}
                </span>
              )}
            </button>

            <Link
              to={profileLink}
              className="flex items-center gap-2 rounded-full p-0.5 hover:bg-neutral-100 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith("http") ? user.avatar : getImageUrl(user.avatar)}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="size-8 rounded-full object-cover ring-2 ring-neutral-100"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 ring-2 ring-neutral-100">
                  {initials || "?"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-neutral-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
