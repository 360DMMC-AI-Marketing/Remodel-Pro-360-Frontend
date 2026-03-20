import SideBar from "@/components/organisms/SideBar";
import NotificationBell from "@/components/organisms/NotificationBell";
// import FloatingMessageBubble from "@/components/organisms/FloatingMessageBubble";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

const SIDEBAR_COLLAPSED_SESSION_KEY = "rp360.sidebar.collapsed";

const HomeownerLayout = () => {
  const [isCollapsed, setIscollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const persisted = window.sessionStorage.getItem(
      SIDEBAR_COLLAPSED_SESSION_KEY,
    );
    return persisted === "true";
  });

  useEffect(() => {
    window.sessionStorage.setItem(
      SIDEBAR_COLLAPSED_SESSION_KEY,
      String(isCollapsed),
    );
  }, [isCollapsed]);

  return (
    <div className="flex overflow-hidden">
      <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIscollapsed} />
      <div className="flex overflow-hidden">
        <div
          className={`bg-neutral-100 w-screen min-h-screen transition-all duration-300 ${isCollapsed ? "ml-sidebar-collapsed" : "ml-sidebar"}`}
        >
          <div className="absolute right-4 top-4">
            <NotificationBell />
          </div>
          <Outlet />
          {/* <FloatingMessageBubble /> */}
        </div>
      </div>
    </div>
  );
};

export default HomeownerLayout;
