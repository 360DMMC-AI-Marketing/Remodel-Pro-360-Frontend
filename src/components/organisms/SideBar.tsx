import { useEffect, useState } from "react";
import { useAuth } from "@/stores/useAuth";
import { messageService } from "@/api/message";
import {
  LayoutDashboard,
  Palette,
  FolderOpen,
  Search,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  DollarSign,
  User,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import favicon from "@/assets/favicon.png";
import horizontalLogo from "@/assets/horizontal-logo.png";

const homeownerLinks = [
  { to: "/homeowner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/homeowner/design-studio", label: "Design Studio", icon: Palette },
  { to: "/homeowner/projects", label: "Projects", icon: FolderOpen },
  { to: "/homeowner/contractors", label: "Find Contractors", icon: Search },
  { to: "/homeowner/messages", label: "Messages", icon: MessageSquare },
  { to: "/homeowner/payments", label: "Payment", icon: CreditCard },
  { to: "/homeowner/settings", label: "Settings", icon: Settings },
];

const contractorLinks = [
  { to: '/contractor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contractor/leads', label: 'Leads', icon: Briefcase },
  { to: '/contractor/projects', label: 'Projects', icon: FolderOpen },
  { to: '/contractor/messages', label: 'Messages', icon: MessageSquare },
  { to: '/contractor/earnings', label: 'Earnings', icon: DollarSign },
  { to: '/contractor/profile', label: 'Profile', icon: User },
  { to: '/contractor/settings', label: 'Settings', icon: Settings },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/vetting', label: 'Contractor Vetting', icon: ShieldCheck },
  { to: '/admin/users', label: 'Users', icon: User },
]

const SideBar = ({
  isCollapsed,
  setIsCollapsed,
  onNavigate,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  onNavigate?: () => void;
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = user?.role === 'homeowner' ? homeownerLinks : user?.role === 'contractor' ? contractorLinks : adminLinks;
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    const load = () => {
      messageService.getUnreadCounts().then((d) => setUnreadTotal(d.total)).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);
  return (
    <div
      className={`fixed top-0 left-0 h-screen ${isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"} transition-all duration-300 bg-white border-r border-r-neutral-200 flex flex-col`}
    >
      {/* Logo */}
      <div className="h-14 px-3 border-b border-b-neutral-200 flex items-center gap-2 shrink-0 overflow-hidden">
        <img src={favicon} alt="RP360" className="h-8 w-8 shrink-0" />
        <img
          src={horizontalLogo}
          alt="Remodel Pro 360"
          className={`h-6 w-auto transition-all duration-300 ${isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}
        />
      </div>
      <div className="px-3 flex flex-col flex-1">
        {/* Navigation Bar */}
        <div className="pt-2 w-full flex flex-col space-y-1 flex-1">
          {links.map((l, i) => {
            const active = location.pathname === l.to
            return(
            <Link
            key={i}
            to={l.to}
            onClick={onNavigate}
              className={
                `flex items-center space-x-2 p-3 rounded-xl cursor-pointer ${active ? 'bg-primary-100' : 'group hover:bg-neutral-100 transition-colors duration-200'}`
              }
            >
              <l.icon size={22} className={`shrink-0 ${active ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-800 transition-colors duration-200'}`} />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-base ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} ${active ? 'text-primary-500' : 'text-neutral-500 group-hover:text-neutral-800'}`}>{l.label}</span>
              {l.label === "Messages" && unreadTotal > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-semibold text-white">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              )}
            </Link>
          )})}
        </div>
        {/* Log Out Button */}
        <div className="border-t border-t-neutral-200 py-2">
          <button
            className="w-full flex items-center space-x-2 p-3 rounded-xl group hover:bg-red-100 cursor-pointer"
            onClick={() => { onNavigate?.(); logout(); }}
          >
            <LogOut
              size={22}
              className="shrink-0 text-neutral-500 group-hover:text-red-400"
            />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-base text-neutral-500 group-hover:text-red-400 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              Log Out
            </span>
          </button>
        </div>
      </div>
      <button
        className={`absolute top-1/8 ${isCollapsed ? "left-92/100" : "left-98/100"} cursor-pointer hidden lg:flex justify-center items-center bg-white size-6 rounded-full border border-neutral-200`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight size={16} className="text-neutral-400" />
        ) : (
          <ChevronLeft size={16} className="text-neutral-400" />
        )}
      </button>
    </div>
  );
};

export default SideBar;
