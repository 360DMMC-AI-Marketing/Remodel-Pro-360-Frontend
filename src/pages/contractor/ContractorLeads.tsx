import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Eye,
  X,
  SlidersHorizontal,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Skeleton } from "@/components/atoms/Skeleton";
import {
  bidService,
  type BidRecord,
  type ContractorProject,
} from "@/api/bid";

/* ── Types ── */

interface BidFormState {
  amount: string;
  message: string;
  estimatedStartDate: string;
  estimatedDurationDays: string;
}

interface LeadFilters {
  roomType: string;
  minBudget: string;
  maxBudget: string;
  city: string;
}

const ROOM_TYPES = [
  "Kitchen",
  "Bathroom",
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Home Office",
  "Basement",
  "Outdoor / Patio",
];

const initialForm: BidFormState = {
  amount: "",
  message: "",
  estimatedStartDate: "",
  estimatedDurationDays: "",
};

const initialFilters: LeadFilters = {
  roomType: "",
  minBudget: "",
  maxBudget: "",
  city: "",
};

/* ── Helper ── */

const getBudgetText = (p: ContractorProject) => {
  if (p.budgetRange)
    return `$${p.budgetRange.min.toLocaleString()} – $${p.budgetRange.max.toLocaleString()}`;
  if (typeof p.customBudget === "number" && p.customBudget > 0)
    return `$${p.customBudget.toLocaleString()}`;
  return "Not specified";
};

/* ── Component ── */

const ContractorLeads = () => {
  const [leads, setLeads] = useState<ContractorProject[]>([]);
  const [myBids, setMyBids] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LeadFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Bid dialog
  const [dialogProject, setDialogProject] = useState<ContractorProject | null>(null);
  const [form, setForm] = useState<BidFormState>(initialForm);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Set of project IDs the contractor already bid on
  const bidProjectIds = useMemo(() => {
    const set = new Set<string>();
    for (const bid of myBids) {
      const pid =
        typeof bid.projectId === "string"
          ? bid.projectId
          : bid.projectId?._id;
      if (pid) set.add(pid);
    }
    return set;
  }, [myBids]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const [projects, bidsRes] = await Promise.all([
        bidService.getBiddingProjects(),
        bidService.getMyBids(),
      ]);
      setLeads(projects);
      setMyBids(bidsRes);
    } catch {
      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleApplyFilters = () => {
    setShowFilters(false);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setShowFilters(false);
    setPage(1);
  };

  const activeFilterCount = [
    filters.roomType,
    filters.minBudget,
    filters.maxBudget,
    filters.city,
  ].filter(Boolean).length;

  // Client-side filtering: search + filters + exclude already-bid
  const filtered = useMemo(() => {
    let list = leads.filter((p) => !bidProjectIds.has(p._id));

    // Text search
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

    // Room type filter
    if (filters.roomType) {
      list = list.filter(
        (p) => p.roomType?.toLowerCase() === filters.roomType.toLowerCase(),
      );
    }

    // Budget filters
    if (filters.minBudget) {
      const min = Number(filters.minBudget);
      list = list.filter((p) => {
        const budget = p.budgetRange?.max ?? p.customBudget ?? 0;
        return budget >= min;
      });
    }
    if (filters.maxBudget) {
      const max = Number(filters.maxBudget);
      list = list.filter((p) => {
        const budget = p.budgetRange?.min ?? p.customBudget ?? 0;
        return budget <= max;
      });
    }

    // City filter
    if (filters.city) {
      const c = filters.city.toLowerCase();
      list = list.filter((p) =>
        p.address?.city?.toLowerCase().includes(c),
      );
    }

    return list;
  }, [leads, bidProjectIds, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const unbidLeads = filtered.slice((page - 1) * limit, page * limit);

  /* ── Bid submission ── */

  const handleSubmitBid = async (projectId: string) => {
    const amount = Number(form.amount);
    const duration = form.estimatedDurationDays
      ? Number(form.estimatedDurationDays)
      : undefined;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }
    if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0)) {
      toast.error("Duration must be positive.");
      return;
    }
    try {
      setSubmitting(projectId);
      await bidService.submitBid({
        projectId,
        amount,
        message: form.message.trim() || undefined,
        estimatedStartDate: form.estimatedStartDate || undefined,
        estimatedDurationDays: duration,
      });
      toast.success("Bid submitted!");
      setForm(initialForm);
      setDialogProject(null);
      await loadLeads();
    } catch {
      toast.error("Could not submit bid.");
    } finally {
      setSubmitting(null);
    }
  };

  // Lock body scroll when dialog open
  useEffect(() => {
    if (!dialogProject) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialogProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialogProject]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Discover new projects looking for contractors.
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder="Search by title, room type, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Room Type
              </label>
              <div className="relative">
                <select
                  value={filters.roomType}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, roomType: e.target.value }))
                  }
                  className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="">All</option>
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Min Budget
              </label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 5000"
                value={filters.minBudget}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minBudget: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Max Budget
              </label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={filters.maxBudget}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxBudget: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                City
              </label>
              <Input
                placeholder="e.g. Austin"
                value={filters.city}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && unbidLeads.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <Briefcase className="mx-auto text-neutral-300 mb-3" size={36} />
          <p className="text-neutral-500 text-sm">
            {search || activeFilterCount > 0
              ? "No leads match your filters."
              : "No open leads right now. Check back later!"}
          </p>
        </div>
      )}

      {/* Lead Cards */}
      {!loading && unbidLeads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unbidLeads.map((project) => (
            <div
              key={project._id}
              className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 flex flex-col gap-3 hover:shadow-md transition-shadow min-w-0"
            >
              {/* Title + Room Type */}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {project.title}
                </h3>
                {project.roomType && (
                  <Badge
                    variant="primary"
                    className="mt-1 capitalize text-[10px]"
                  >
                    {project.roomType}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-500 line-clamp-2 min-w-0">
                {project.description || "No description provided."}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 min-w-0">
                <span className="inline-flex items-center gap-1 truncate">
                  <DollarSign size={12} className="text-neutral-400 shrink-0" />
                  {getBudgetText(project)}
                </span>
                {(project.address?.city || project.address?.state) && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-neutral-400 shrink-0" />
                    {[project.address.city, project.address.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto flex items-center gap-2 pt-1">
                <Link
                  to={`/contractor/projects/${project._id}`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye size={14} className="mr-1" /> Details
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDialogProject(project);
                    setForm(initialForm);
                  }}
                >
                  Submit Bid
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
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
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                onClick={() => setDialogProject(null)}
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-semibold">Submit Bid</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                {dialogProject.title}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Budget: {getBudgetText(dialogProject)}
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      <DollarSign size={12} className="inline mr-0.5" /> Bid
                      Amount *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="e.g. 4500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-700 mb-1 block">
                      <Clock size={12} className="inline mr-0.5" /> Duration
                      (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.estimatedDurationDays}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          estimatedDurationDays: e.target.value,
                        }))
                      }
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
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimatedStartDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 mb-1 block">
                    Message
                  </label>
                  <Textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="Describe your approach, experience, and timeline..."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogProject(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submitting === dialogProject._id}
                  onClick={() => void handleSubmitBid(dialogProject._id)}
                >
                  {submitting === dialogProject._id
                    ? "Submitting..."
                    : "Submit Bid"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ContractorLeads;
