import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Card } from "@/components/molecules/Card";
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

type ProjectStatusFilter =
  | "all"
  | "bidding"
  | "contracted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

const PROJECT_STATUS_FILTERS: Array<{ key: ProjectStatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "bidding", label: "Bidding" },
  { key: "contracted", label: "Contracted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "disputed", label: "Disputed" },
];

const initialFormState: BidFormState = {
  amount: "",
  message: "",
  estimatedStartDate: "",
  estimatedDurationDays: "",
};

const ContractorProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [myBids, setMyBids] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(
    null,
  );
  const [dialogProject, setDialogProject] = useState<ContractorProject | null>(
    null,
  );
  const [form, setForm] = useState<BidFormState>(initialFormState);
  
  const urlStatus = searchParams.get("status");
  const isValidStatus = (value: string): value is ProjectStatusFilter => {
    return ["all", "bidding", "contracted", "in_progress", "completed", "cancelled", "disputed"].includes(value);
  };
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>(
    urlStatus && isValidStatus(urlStatus) ? urlStatus : "all"
  );

  const dialogOpen = Boolean(dialogProject);

  const myBidsByProject = useMemo(() => {
    const map = new Map<string, BidRecord>();
    for (const bid of myBids) {
      const projectId =
        typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
      if (projectId) {
        map.set(projectId, bid);
      }
    }
    return map;
  }, [myBids]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((project) => (project.status ?? "bidding") === statusFilter);
  }, [projects, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatusFilter, number> = {
      all: projects.length,
      bidding: 0,
      contracted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0,
    };

    for (const project of projects) {
      const status = (project.status ?? "bidding") as ProjectStatusFilter;
      if (status in counts) {
        counts[status] += 1;
      }
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

      const biddingProjectIds = new Set(biddingProjects.map((project) => project._id));
      const myBidProjectIds = Array.from(
        new Set(
          bidList
            .map((bid) =>
              typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id,
            )
            .filter((projectId): projectId is string => Boolean(projectId)),
        ),
      );

      const missingProjectIds = myBidProjectIds.filter(
        (projectId) => !biddingProjectIds.has(projectId),
      );

      const myBidProjectsResults = await Promise.allSettled(
        missingProjectIds.map((projectId) => getProjectById(projectId)),
      );

      const myBidProjects = myBidProjectsResults
        .filter(
          (result): result is PromiseFulfilledResult<{ project: ContractorProject }> =>
            result.status === "fulfilled" && Boolean(result.value?.project?._id),
        )
        .map((result) => result.value.project);

      const mergedProjectsMap = new Map<string, ContractorProject>();
      for (const project of [...biddingProjects, ...myBidProjects]) {
        mergedProjectsMap.set(project._id, project);
      }

      setProjects(Array.from(mergedProjectsMap.values()));
      setMyBids(bidList);
    } catch {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjectsData();
  }, []);

  useEffect(() => {
    if (statusFilter !== "all") {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter, setSearchParams]);

  useEffect(() => {
    if (!dialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialogProject(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dialogOpen]);

  const handleSubmitBid = async (projectId: string) => {
    const amount = Number(form.amount);
    const estimatedDurationDays = form.estimatedDurationDays
      ? Number(form.estimatedDurationDays)
      : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount.");
      return;
    }

    if (
      estimatedDurationDays !== undefined &&
      (!Number.isFinite(estimatedDurationDays) || estimatedDurationDays <= 0)
    ) {
      toast.error("Estimated duration must be a positive number.");
      return;
    }

    try {
      setSubmittingProjectId(projectId);
      await bidService.submitBid({
        projectId,
        amount,
        message: form.message.trim() || undefined,
        estimatedStartDate: form.estimatedStartDate || undefined,
        estimatedDurationDays,
      });
      toast.success("Bid submitted successfully.");
      setForm(initialFormState);
      setDialogProject(null);
      await loadProjectsData();
    } catch {
      toast.error("Could not submit bid. You may already have a bid on this project.");
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const getBudgetText = (project: ContractorProject) => {
    if (project.budgetRange) {
      return `$${project.budgetRange.min.toLocaleString()} - $${project.budgetRange.max.toLocaleString()}`;
    }
    if (typeof project.customBudget === "number" && project.customBudget > 0) {
      return `$${project.customBudget.toLocaleString()}`;
    }
    return "Not specified";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3>Projects</h3>
        <p className="text-neutral-500">
          Browse open projects and track your accepted and contracted projects.
        </p>
      </div>

      {!loading && (
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.key;
            return (
              <Button
                key={filter.key}
                variant={active ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.key)}
                
              >
                {filter.label} ({statusCounts[filter.key]})
              </Button>
            );
          })}
        </div>
      )}

      {loading && (
        <Card>
          <p className="text-neutral-600">Loading projects...</p>
        </Card>
      )}

      {!loading && filteredProjects.length === 0 && (
        <Card>
          <p className="text-neutral-700">
            No projects found for this status.
          </p>
        </Card>
      )}

      {!loading &&
        filteredProjects.map((project) => {
          const existingBid = myBidsByProject.get(project._id);
          const canSubmitBid = (project.status ?? "") === "bidding" && !existingBid;

          return (
            <Card key={project._id} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h6 className="font-semibold">{project.title}</h6>
                    <Badge variant="primary">{project.status ?? "bidding"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {project.description || "No description provided."}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">
                    <span className="font-medium">Budget:</span>{" "}
                    {getBudgetText(project)}
                  </p>
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium">Location:</span>{" "}
                    {[project.address?.city, project.address?.state]
                      .filter(Boolean)
                      .join(", ") || "Not specified"}
                  </p>
                </div>

                {existingBid ? (
                  <div className="rounded-xl border border-neutral-200 p-3 text-sm">
                    <p className="font-medium text-neutral-800">Your Bid</p>
                    <p className="text-neutral-600">
                      Amount: ${existingBid.amount.toLocaleString()}
                    </p>
                    <p className="text-neutral-600 capitalize">
                      Status: {existingBid.status}
                    </p>
                    <Link
                      to={`/contractor/projects/${project._id}`}
                      className="mt-2 inline-flex items-center text-primary text-xs font-medium"
                    >
                      <Eye className="mr-1 size-3" /> View details
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to={`/contractor/projects/${project._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 size-4" /> Details
                      </Button>
                    </Link>
                    {canSubmitBid && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setDialogProject(project);
                          setForm(initialFormState);
                        }}
                      >
                        Submit Bid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

      {dialogOpen &&
        dialogProject &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-neutral-950/55"
              aria-label="Close bid dialog"
              onClick={() => setDialogProject(null)}
            />

            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close bid dialog"
                onClick={() => setDialogProject(null)}
              >
                <X className="size-4" />
              </button>

              <h5 className="font-semibold">Submit Bid</h5>
              <p className="mt-1 text-sm text-neutral-600">
                {dialogProject.title}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="bid-amount">Bid Amount *</label>
                  <Input
                    id="bid-amount"
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    placeholder="ex: 4500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bid-start-date">Estimated Start Date</label>
                  <Input
                    id="bid-start-date"
                    type="date"
                    value={form.estimatedStartDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedStartDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bid-duration">Estimated Duration (days)</label>
                  <Input
                    id="bid-duration"
                    type="number"
                    min="1"
                    value={form.estimatedDurationDays}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedDurationDays: event.target.value,
                      }))
                    }
                    placeholder="ex: 14"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label htmlFor="bid-message">Message</label>
                  <Textarea
                    id="bid-message"
                    rows={4}
                    value={form.message}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, message: event.target.value }))
                    }
                    placeholder="Add a short note to your bid..."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
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
                  disabled={submittingProjectId === dialogProject._id}
                  onClick={() => void handleSubmitBid(dialogProject._id)}
                >
                  {submittingProjectId === dialogProject._id
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

export default ContractorProjects;