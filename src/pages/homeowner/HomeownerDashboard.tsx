import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Button } from "@/components/atoms/Button";
import {
  FolderOpen,
  DollarSign,
  Gavel,
  MessageSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useAuth } from "@/stores/useAuth";
import { getProjects } from "@/api/project";
import { messageService } from "@/api/message";
import type { HomeownerProject } from "@/types/project";
import { toast } from "sonner";
import { OnboardingChecklist, buildHomeownerSteps } from "@/components/OnboardingChecklist";

const statusVariant = (s?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (s) {
    case "bidding": return "primary";
    case "in_progress": case "contracted": return "warning";
    case "completed": return "success";
    case "cancelled": return "error";
    default: return "draft";
  }
};

const HomeownerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<HomeownerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, msgRes] = await Promise.all([
          getProjects(),
          messageService.getUnreadCounts().catch(() => ({ total: 0 })),
        ]);
        setProjects(projRes.projects ?? projRes.data ?? []);
        setUnread(msgRes.total);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeProjects = projects.filter((p) =>
    !["draft", "completed", "cancelled"].includes(p.status ?? ""),
  );
  const totalBudget = projects.reduce((sum, p) => {
    return sum + (p.customBudget ?? p.budgetRange?.max ?? 0);
  }, 0);

  const kpis = [
    { label: "Active Projects", value: activeProjects.length, icon: FolderOpen, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: "text-secondary-600", bg: "bg-secondary-50" },
    { label: "Total Projects", value: projects.length, icon: Gavel, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Unread Messages", value: unread, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8 p-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName || "there"}!</h1>
          <p className="text-neutral-500 text-sm mt-1">Here's what's happening with your projects.</p>
        </div>
        <Link to="/homeowner/projects/new">
          <Button variant="primary" size="sm"><Plus size={16} className="mr-1" /> New Project</Button>
        </Link>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        steps={buildHomeownerSteps({
          emailVerified: user?.isVerified ?? false,
          isLocal: user?.authProvider === "local",
        })}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="space-y-1 sm:space-y-2 min-w-0">
                <span className="text-xs sm:text-sm text-neutral-500">{label}</span>
                {loading ? (
                  <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                ) : (
                  <p className={`text-lg sm:text-2xl font-bold ${color} truncate`}>{value}</p>
                )}
              </div>
              <div className={`${bg} rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0`}>
                <Icon className={`${color} size-4 sm:size-[22px]`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <Link to="/homeowner/projects" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <Card className="p-8 text-center shadow-none">
            <FolderOpen className="mx-auto text-neutral-300 mb-3" size={32} />
            <p className="text-neutral-500 text-sm">No projects yet. Create your first renovation project.</p>
            <Link to="/homeowner/projects/new">
              <Button variant="primary" size="sm" className="mt-3">Create Project</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link key={project._id} to={`/homeowner/projects/${project._id}`}>
                <Card className="p-4 shadow-none hover:bg-neutral-50 transition-colors cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm truncate">{project.title}</h3>
                    <Badge variant={statusVariant(project.status)} className="shrink-0 capitalize text-[11px]">
                      {project.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 flex-1">{project.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">
                      ${(project.customBudget ?? project.budgetRange?.max ?? 0).toLocaleString()}
                    </span>
                    <span className="capitalize">{project.roomType}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeownerDashboard;
