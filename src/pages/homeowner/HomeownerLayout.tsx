import SideBar from "@/components/organisms/SideBar";
import NotificationBell from "@/components/organisms/NotificationBell";
import { useState } from "react";
import { Outlet } from "react-router-dom";

const HomeownerLayout = () => {
  const [isCollapsed, setIscollapsed] = useState(false);
  return (
    <div className="flex overflow-hidden">
      <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIscollapsed} />
      <div className="flex overflow-hidden">
        <div
          className={`bg-neutral-100 w-screen min-h-screen p-8 transition-all duration-300 ${isCollapsed ? "ml-sidebar-collapsed" : "ml-sidebar"}`}
        >
          <div className="mb-6 flex justify-end">
            <NotificationBell />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HomeownerLayout;
