import { useAuth } from "@/stores/useAuth";
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
  Sparkles,
  Briefcase,
  DollarSign,
  User,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const homeownerLinks = [
  { to: "/homeowner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Design Studio", icon: Palette },
  { to: "/homeowner/projects", label: "Projects", icon: FolderOpen },
  { to: "/", label: "Find Contractors", icon: Search },
  { to: "/", label: "Messages", icon: MessageSquare },
  { to: "/", label: "Payment", icon: CreditCard },
  { to: "/", label: "Settings", icon: Settings },
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
}: {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = user?.role === 'homeowner' ? homeownerLinks : user?.role === 'contractor' ? contractorLinks : adminLinks;
  return (
    <div
      className={`fixed top-0 left-0 h-screen ${isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"} transition-all duration-300 bg-white border-r border-r-neutral-200 flex flex-col`}
    >
      {/* Logo */}
      <div className="p-3 border-b border-b-neutral-200 flex items-center space-x-2">
        <div className="bg-linear-to-br from-primary-500 to-primary-900 p-3 rounded-xl">
          <Sparkles size={22} className="text-white" />
        </div>
        {!isCollapsed && <h4>RP360</h4>}
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
              className={
                `flex items-center space-x-2 p-3 rounded-xl cursor-pointer ${active ? 'bg-primary-100' : 'group hover:bg-neutral-100 transition-colors duration-200'}`
              }
            >
              <l.icon size={22} className={active ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-800 transition-colors duration-200'} />
              {!isCollapsed && (
                <span className={`text-base ${active ? 'text-primary-500' : 'text-neutral-500 group-hover:text-neutral-800 transition-colors duration-200'}`}>{l.label}</span>
              )}
            </Link>
          )})}
        </div>
        {/* Log Out Button */}
        <div className="border-t border-t-neutral-200 py-2">
          <button
            className="w-full flex items-center space-x-2 p-3 rounded-xl group hover:bg-red-100 cursor-pointer"
            onClick={logout}
          >
            <LogOut
              size={22}
              className="text-neutral-500 group-hover:text-red-400"
            />
            {!isCollapsed && (
              <span className="text-base text-neutral-500 group-hover:text-red-400">
                Log Out
              </span>
            )}
          </button>
        </div>
      </div>
      <button
        className={`absolute top-1/8 ${isCollapsed ? "left-92/100" : "left-98/100"} cursor-pointer flex justify-center items-center bg-white size-6 rounded-full border border-neutral-200`}
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
