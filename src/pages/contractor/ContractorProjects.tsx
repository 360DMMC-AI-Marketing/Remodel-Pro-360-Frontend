import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Eye,
  X,
  MapPin,
  DollarSign,
  Calendar,
  Search,
  Briefcase,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Skeleton } from "@/components/atoms/Skeleton";
import { getProjectById } from "@/api/project";
import {
  bidService,
  type BidRecord,
  type ContractorProject,
} from "@/api/bid";

interface BidFormState {
  amount: string;
  message: string;
  estimatedStartDate: string;
  estimatedDurationDays: string;
}

type StatusFilter = "all" | "bidding" | "contracted" | "in_progress" | "completed" | "cancelled";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "bidding", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "contracted", label: "Contracted" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const initialFormState: BidFormState = {
  amount: "",
  message: "",
  estimatedStartDate: "",
  estimatedDurationDays: "",
};

const statusBadgeVariant = (s?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (s) {
    case "bidding": return "primary";
    case "in_progress": case "contracted": return "warning";
    case "completed": return "success";
    case "cancelled": return "error";
    default: return "draft";
  }
};

const bidBadgeVariant = (s: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (s) {
    case "submitted": return "primary";
    case "shortlisted": return "warning";
    case "accepted": return "success";
    case "rejected": return "error";
    default: return "draft";
  }
};

const ContractorProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [myBids, setMyBids] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null);
  const [dialogProject, setDialogProject] = useState<ContractorProject | null>(null);
  const [form, setForm] = useState<BidFormState>(initialFormState);
  const [search, setSearch] = useState("");

  const urlStatus = searchParams.get("status");
  const isValidStatus = (v: string): v is StatusFilter =>
    ["all", "bidding", "contracted", "in_progress", "completed", "cancelled"].includes(v);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    urlStatus && isValidStatus(urlStatus) ? urlStatus : "all",
  );

  const myBidsByProject = useMemo(() => {
    const map = new Map<string, BidRecord>();
    for (const bid of myBids) {
      const pid = typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
      if (pid) map.set(pid, bid);
    }
    return map;
  }, [myBids]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (statusFilter !== "all") {
      list = list.filter((p) => (p.status ?? "bidding") === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.roomType?.toLowerCase().includes(q) ||
          p.address?.city?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [projects, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    for (const p of projects) {
      const s = p.status ?? "bidding";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const loadProjectsData = async () => {
    try {
      setLoading(true);
      const [biddingProjects, bidList] = await Promise.all([
        bidService.getBiddingProjects(),
        bidService.getMyBids(),
      ]);

      const biddingIds = new Set(biddingProjects.map((p) => p._id));
      const myBidProjectIds = Array.from(
        new Set(
          bidList
            .map((b) => (typeof b.projectId === "string" ? b.projectId : b.projectId?._id))
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const missingIds = myBidProjectIds.filter((id) => !biddingIds.has(id));
      const extraResults = await Promise.allSettled(
        missingIds.map((id) => getProjectById(id)),
      );
      const extraProjects = extraResults
        .filter(
          (r): r is PromiseFulfilledResult<{ project: ContractorProject }> =>
            r.status === "fulfilled" && Boolean(r.value?.project?._id),
        )
        .map((r) => r.value.project);

      const merged = new Map<string, ContractorProject>();
      for (const p of [...biddingProjects, ...extraProjects]) merged.set(p._id, p);

      setProjects(Array.from(merged.values()));
      setMyBids(bidList);
    } catch {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProjectsData(); }, []);

  useEffect(() => {
    if (statusFilter !== "all") setSearchParams({ status: statusFilter });
    else setSearchParams({});
  }, [statusFilter, setSearchParams]);

  useEffect(() => {
    if (!dialogProject) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDialogProject(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [dialogProject]);

  const handleSubmitBid = async (projectId: string) => {
    const amount = Number(form.amount);
    const duration = form.estimatedDurationDays ? Number(form.estimatedDurationDays) : undefined;
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a valid bid amount."); return; }
    if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0)) { toast.error("Duration must be positive."); return; }
    try {
      setSubmittingProjectId(projectId);
      await bidService.submitBid({
        projectId,
        amount,
        message: form.message.trim() || undefined,
        estimatedStartDate: form.estimatedStartDate || undefined,
        estimatedDurationDays: duration,
      });
      toast.success("Bid submitted successfully.");
      setForm(initialFormState);
      setDialogProject(null);
      await loadProjectsData();
    } catch {
      toast.error("Could not submit bid.");
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const getBudgetText = (p: ContractorProject) => {
    if (p.budgetRange) return `$${p.budgetRange.min.toLocaleString()} – $${p.budgetRange.max.toLocaleString()}`;
    if (typeof p.customBudget === "number" && p.customBudget > 0) return `$${p.customBudget.toLocaleString()}`;
    return "Not specified";
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-neutral-500 mt-1">Browse open projects and track your bids.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by title, room type, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status Tabs */}
      {!loading && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map(({ key, label }) => {
            const active = statusFilter === key;
            const count = statusCounts[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <Briefcase className="mx-auto text-neutral-300 mb-3" size={36} />
          <p className="text-neutral-500">No projects found{search ? " matching your search" : " for this status"}.</p>
        </div>
      )}

      {/* Project Cards */}
      {!loading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const existingBid = myBidsByProject.get(project._id);
            const canBid = (project.status ?? "") === "bidding" && !existingBid;

            return (
              <div
                key={project._id}
                className="rounded-xl border border-neutral-200 bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{project.title}</h3>
                      <Badge variant={statusBadgeVariant(project.status)} className="capitalize text-[11px]">
                        {(project.status ?? "bidding").replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {project.roomType && (
                      <span className="text-[11px] text-neutral-400 capitalize">{project.roomType}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-500 line-clamp-2">
                  {project.description || "No description provided."}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    <DollarSign size={12} className="text-neutral-400" />
                    {getBudgetText(project)}
                  </span>
                  {(project.address?.city || project.address?.state) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-neutral-400" />
                      {[project.address.city, project.address.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                {/* Bid info or actions */}
                {existingBid ? (
                  <div className="mt-auto flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5 border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-neutral-500">Your bid</p>
                        <p className="text-sm font-semibold text-neutral-800">
                          ${existingBid.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={bidBadgeVariant(existingBid.status)} className="capitalize text-[10px]">
                        {existingBid.status}
                      </Badge>
                    </div>
                    <Link to={`/contractor/projects/${project._id}`}>
                      <Button variant="ghost" size="xs">
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Link to={`/contractor/projects/${project._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye size={14} className="mr-1" /> Details
                      </Button>
                    </Link>
                    {canBid && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setDialogProject(project); setForm(initialFormState); }}
                      >
                        Submit Bid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bid Dialog */}
      {dialogProject &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close"
              onClick={() => setDialogProject(null)}
            />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                onClick={() => setDialogProject(null)}
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-semibold">Submit Bid</h3>
              <p className="text-sm text-neutral-500 mt-0.5">{dialogProject.title}</p>
              <p className="text-xs text-neutral-400 mt-1">
                Budget: {getBudgetText(dialogProject)}
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      <DollarSign size={12} className="inline mr-0.5" /> Bid Amount *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 4500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      <Clock size={12} className="inline mr-0.5" /> Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.estimatedDurationDays}
                      onChange={(e) => setForm((f) => ({ ...f, estimatedDurationDays: e.target.value }))}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 mb-1 block">
                    <Calendar size={12} className="inline mr-0.5" /> Start Date
                  </label>
                  <Input
                    type="date"
                    value={form.estimatedStartDate}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedStartDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 mb-1 block">Message</label>
                  <Textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your approach, experience, and timeline..."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogProject(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submittingProjectId === dialogProject._id}
                  onClick={() => void handleSubmitBid(dialogProject._id)}
                >
                  {submittingProjectId === dialogProject._id ? "Submitting..." : "Submit Bid"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ContractorProjects;
