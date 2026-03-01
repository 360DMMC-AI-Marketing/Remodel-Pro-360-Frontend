import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import SideBar from "@/components/organisms/SideBar";
import {
  FolderOpen,
  TrendingUp,
  Palette,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
    const [isCollapsed, setIscollapsed] = useState(false);
  return (
    <div className="flex overflow-hidden">
      <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIscollapsed}/>
      <div className={`bg-neutral-100 transition-all duration-300 ${isCollapsed ? "ml-sidebar-collapsed" : "ml-sidebar"} w-full min-h-screen p-8`}>
        <div className="mb-10 text-center md:text-left">
          <h4>Welcome back, Ahmed!</h4>
          <p className="text-neutral-500">
            Here's what's happening with your projects.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 shadow-none">
            <div className="w-full flex justify-between items-center">
              <div className="space-y-2 flex flex-col">
                <span className="text-sm text-neutral-500 font-normal">
                  Active Projects
                </span>
                <span className="text-2xl font-bold">1</span>
              </div>
              <div className="bg-primary-50 rounded-xl p-3">
                <FolderOpen className="text-primary-500" />
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="w-full flex justify-between items-center">
              <div className="space-y-2 flex flex-col">
                <span className="text-sm text-neutral-500 font-normal">
                  Total Budget
                </span>
                <span className="text-2xl font-bold">$82,000</span>
              </div>
              <div className="bg-secondary-50 rounded-xl p-3">
                <TrendingUp className="text-secondary-500" />
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="w-full flex justify-between items-center">
              <div className="space-y-2 flex flex-col">
                <span className="text-sm text-neutral-500 font-normal">
                  Designs Created
                </span>
                <span className="text-2xl font-bold">12</span>
              </div>
              <div className="bg-success/10 rounded-xl p-3">
                <Palette className="text-success" />
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="w-full flex justify-between items-center">
              <div className="space-y-2 flex flex-col">
                <span className="text-sm text-neutral-500 font-normal">
                  Unread Messages
                </span>
                <span className="text-2xl font-bold">3</span>
              </div>
              <div className="bg-warning/15 rounded-xl p-3">
                <MessageSquare className="text-warning" />
              </div>
            </div>
          </Card>
        </div>
        <div className="mt-15">
          <div className="flex justify-between items-center mb-5">
            <h6 className="text-neutral-800">Your Projects</h6>
            <span className="flex items-center space-x-2 cursor-pointer">
              <span className="font-semibold">View All</span> <ArrowRight size={22}/>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="p-5 cursor-pointer" hoverable>
              <div className="flex justify-between mb-3">
                <h6 className="font-light text-base">Modern Kitchen Remodel</h6>
                <Badge variant="warning">in progress</Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-3">
                Complete kitchen renovation with marble countertop and smart
                appliances
              </p>
              <div className="flex justify-between">
                <span>$45,000</span>
                <span className="text-sm text-neutral-400">5 bids</span>
              </div>
            </Card>
            <Card className="p-5 cursor-pointer" hoverable>
              <div className="flex justify-between mb-3">
                <h6 className="font-light text-base">Master Bathroom Renovation</h6>
                <Badge variant="primary">open</Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-3">
                Luxury bathroom with walk-in shower and dual vanity
              </p>
              <div className="flex justify-between">
                <span>$25,000</span>
                <span className="text-sm text-neutral-400">3 bids</span>
              </div>
            </Card>
            <Card className="p-5 cursor-pointer flex flex-col" hoverable>
              <div className="flex justify-between mb-3">
                <h6 className="font-light text-base">Living Room Refresh</h6>
                <Badge variant="draft">draft</Badge>
              </div>
              <p className="text-sm text-neutral-500 mb-3 flex-1">
                New flooring, built-in shelving and accent wall
              </p>
              <div className="flex justify-between">
                <span>$12,000</span>
                <span className="text-sm text-neutral-400">0 bids</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

