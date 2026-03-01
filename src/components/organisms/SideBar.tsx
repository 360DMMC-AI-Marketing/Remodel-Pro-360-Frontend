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
} from "lucide-react";

const SideBar = ({isCollapsed, setIsCollapsed}: {isCollapsed: boolean, setIsCollapsed: (isCollapsed: boolean) => void}) => {
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
            <div className={"flex items-center space-x-2 p-3 rounded-xl bg-primary-100 cursor-pointer"}>
              <LayoutDashboard size={22} className="text-primary-600" />
              {!isCollapsed && (
                <span className="text-base text-primary-600">Dashboard</span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <Palette
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Design Studio
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <FolderOpen
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Projects
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <Search
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Find Contractors
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <MessageSquare
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Messages
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <CreditCard
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Payment
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl cursor-pointer group hover:bg-neutral-100">
              <Settings
                size={22}
                className="text-neutral-500 group-hover:text-neutral-800"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-neutral-800">
                  Settings
                </span>
              )}
            </div>
          </div>
          {/* Log Out Button */}
          <div className="border-t border-t-neutral-200 py-2">
            <div className="w-full flex items-center space-x-2 p-3 rounded-xl group hover:bg-red-100 cursor-pointer">
              <LogOut
                size={22}
                className="text-neutral-500 group-hover:text-red-400"
              />
              {!isCollapsed && (
                <span className="text-base text-neutral-500 group-hover:text-red-400">
                  Log Out
                </span>
              )}
            </div>
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
  )
}

export default SideBar