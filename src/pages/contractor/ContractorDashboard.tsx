import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/stores/useAuth";
import { bidService, type BidRecord } from "@/api/bid";
import { connectService, type ContractorConnectStatus } from "@/api/connect";
import { messageService } from "@/api/message";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Button } from "@/components/atoms/Button";
import {
  Briefcase,
  DollarSign,
  MessageSquare,
  Clock,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [connectStatus, setConnectStatus] = useState<ContractorConnectStatus | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bidsRes, msgRes, connect] = await Promise.all([
          bidService.getMyBids(),
          messageService.getUnreadCounts().catch(() => ({ total: 0 })),
          connectService.getMyStatus().catch(() => null),
        ]);
        setBids(bidsRes);
        setUnread(msgRes.total);
        setConnectStatus(connect);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const { url } = await connectService.createOnboardingLink();
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to create onboarding link");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const activeBids = bids.filter((b) => ["submitted", "shortlisted"].includes(b.status));
  const acceptedBids = bids.filter((b) => b.status === "accepted");
  const totalEarnings = acceptedBids.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const kpis = [
    { label: "Active Bids", value: activeBids.length, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Won Projects", value: acceptedBids.length, icon: Clock, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Unread Messages", value: unread, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const bidStatusVariant = (status: string): "primary" | "success" | "warning" | "error" | "draft" => {
    switch (status) {
      case "submitted": return "primary";
      case "shortlisted": return "warning";
      case "accepted": return "success";
      case "rejected": return "error";
      default: return "draft";
    }
  };

  const recentBids = bids.slice(0, 5);

  return (
    <div className="space-y-6 p-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || "Contractor"}!</h1>
        <p className="text-neutral-500 text-sm mt-1">Here's an overview of your activity.</p>
      </div>

      {/* Stripe Connect Banner */}
      {connectStatus && !connectStatus.onboardingComplete && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-800">Complete your payment setup</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Set up your Stripe account to receive payouts for completed milestones.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={onboardingLoading}
            onClick={handleOnboarding}
          >
            {onboardingLoading ? "Loading..." : <>Set Up Payments <ExternalLink size={14} className="ml-1" /></>}
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <span className="text-sm text-neutral-500">{label}</span>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                )}
              </div>
              <div className={`${bg} rounded-xl p-3 shrink-0`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bids */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bids</h2>
          <Link to="/contractor/projects" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentBids.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <Briefcase className="mx-auto text-neutral-300 mb-3" size={32} />
            <p className="text-neutral-500 text-sm">No bids yet. Browse available projects to get started.</p>
            <Link to="/contractor/projects">
              <Button variant="primary" size="sm" className="mt-3">Browse Projects</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBids.map((bid) => {
              const project = typeof bid.projectId === "object" ? bid.projectId : null;
              return (
                <Link
                  key={bid._id}
                  to={project ? `/contractor/projects/${project._id}` : "#"}
                  className="block"
                >
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{project?.title ?? "Project"}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          ${bid.amount?.toLocaleString()} &middot; {bid.estimatedDurationDays ?? "—"} days
                        </p>
                      </div>
                      <Badge variant={bidStatusVariant(bid.status)} className="shrink-0 capitalize">
                        {bid.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/contractor/projects">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 transition-colors text-center cursor-pointer">
              <Briefcase className="mx-auto text-primary-500 mb-2" size={24} />
              <p className="text-sm font-medium">Browse Projects</p>
            </div>
          </Link>
          <Link to="/contractor/messages">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 transition-colors text-center cursor-pointer">
              <MessageSquare className="mx-auto text-teal-500 mb-2" size={24} />
              <p className="text-sm font-medium">Messages</p>
            </div>
          </Link>
          <Link to="/contractor/profile">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 transition-colors text-center cursor-pointer">
              <DollarSign className="mx-auto text-emerald-500 mb-2" size={24} />
              <p className="text-sm font-medium">My Profile</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
