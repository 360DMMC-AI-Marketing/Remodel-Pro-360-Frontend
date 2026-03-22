import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getProjectById } from "@/api/porject";
import { bidService, type BidRecord } from "@/api/bid";
import { contractService, type ContractRecord } from "@/api/contract";
import { milestoneService, type MilestoneRecord, type CreateMilestonePayload } from "@/api/milestone";
import type { HomeownerProject } from "@/types/project";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";
const BID_STEPS: Array<"submitted" | "shortlisted" | "accepted"> = [
  "submitted",
  "shortlisted",
  "accepted",
];

const getBidProgress = (status: BidRecord["status"]) => {
  switch (status) {
    case "submitted": return { width: "34%", colorClass: "bg-primary", label: "Submitted" };
    case "shortlisted": return { width: "67%", colorClass: "bg-secondary", label: "Shortlisted" };
    case "accepted": return { width: "100%", colorClass: "bg-success", label: "Accepted" };
    case "rejected": return { width: "100%", colorClass: "bg-error", label: "Rejected" };
    case "withdrawn": return { width: "100%", colorClass: "bg-neutral-500", label: "Withdrawn" };
    default: return { width: "10%", colorClass: "bg-neutral-400", label: "Draft" };
  }
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  disputed: "bg-red-100 text-red-700",
};

// ─── Milestone Templates ───────────────────────────────────────────────────────

type MilestoneTemplate = Omit<CreateMilestonePayload, "deliverables"> & { deliverables: string[] };

const TEMPLATES: Record<string, MilestoneTemplate[]> = {
  kitchen: [
    { name: "Demolition & Site Prep", description: "Remove existing fixtures and prepare work area.", percentOfTotal: 15, estimatedDurationDays: 3, deliverables: ["Old fixtures removed", "Site protected", "Debris disposed"] },
    { name: "Rough-In Work", description: "Plumbing, electrical, and framing rough-in.", percentOfTotal: 25, estimatedDurationDays: 7, deliverables: ["Plumbing rough-in complete", "Electrical rough-in complete", "Framing complete"] },
    { name: "Cabinets & Countertops", description: "Install cabinetry, countertops, and backsplash.", percentOfTotal: 30, estimatedDurationDays: 7, deliverables: ["Cabinets installed", "Countertops installed", "Backsplash installed"] },
    { name: "Fixtures & Appliances", description: "Install sink, appliances, and lighting.", percentOfTotal: 20, estimatedDurationDays: 5, deliverables: ["Sink & faucet installed", "Appliances installed", "Lighting installed"] },
    { name: "Final Cleanup & Inspection", description: "Touch-ups, punch list, and client handover.", percentOfTotal: 10, estimatedDurationDays: 2, deliverables: ["Punch list completed", "Site cleaned", "Final walkthrough done"] },
  ],
  bathroom: [
    { name: "Demolition", description: "Remove existing fixtures, tile, and drywall.", percentOfTotal: 15, estimatedDurationDays: 2, deliverables: ["Demo complete", "Debris removed"] },
    { name: "Plumbing & Rough-In", description: "Rough-in plumbing and waterproofing.", percentOfTotal: 25, estimatedDurationDays: 5, deliverables: ["Plumbing rough-in", "Waterproofing applied", "Inspection passed"] },
    { name: "Tiling & Walls", description: "Install tile on floors and walls.", percentOfTotal: 30, estimatedDurationDays: 7, deliverables: ["Floor tile installed", "Wall tile installed", "Grout sealed"] },
    { name: "Fixtures & Vanity", description: "Install toilet, vanity, shower, and accessories.", percentOfTotal: 20, estimatedDurationDays: 4, deliverables: ["Toilet installed", "Vanity installed", "Shower fixtures installed"] },
    { name: "Final Finish & Cleanup", description: "Accessories, touch-ups, final inspection.", percentOfTotal: 10, estimatedDurationDays: 2, deliverables: ["Accessories installed", "Touch-ups complete", "Site cleaned"] },
  ],
  roofing: [
    { name: "Inspection & Material Delivery", description: "Inspect existing roof and deliver materials.", percentOfTotal: 10, estimatedDurationDays: 2, deliverables: ["Inspection report", "Materials on-site"] },
    { name: "Tear-Off & Deck Prep", description: "Remove old roofing and prepare deck.", percentOfTotal: 30, estimatedDurationDays: 3, deliverables: ["Old roof removed", "Deck inspected", "Repairs made"] },
    { name: "Underlayment & Flashing", description: "Install underlayment, ice barrier, and flashing.", percentOfTotal: 25, estimatedDurationDays: 2, deliverables: ["Underlayment installed", "Flashing installed"] },
    { name: "Shingles & Ridge Cap", description: "Install shingles and ridge cap.", percentOfTotal: 25, estimatedDurationDays: 3, deliverables: ["Shingles installed", "Ridge cap installed", "Penetrations sealed"] },
    { name: "Final Inspection & Cleanup", description: "Nail sweep, cleanup, and final inspection.", percentOfTotal: 10, estimatedDurationDays: 1, deliverables: ["Nail sweep done", "Site cleaned", "Inspection complete"] },
  ],
  painting: [
    { name: "Surface Prep", description: "Patch walls, sand, prime, and tape.", percentOfTotal: 20, estimatedDurationDays: 3, deliverables: ["Holes patched", "Surface sanded", "Primer applied"] },
    { name: "First Coat", description: "Apply first coat of paint to all surfaces.", percentOfTotal: 35, estimatedDurationDays: 3, deliverables: ["First coat applied", "Even coverage verified"] },
    { name: "Second Coat & Trim", description: "Apply second coat and paint all trim.", percentOfTotal: 30, estimatedDurationDays: 3, deliverables: ["Second coat applied", "Trim painted"] },
    { name: "Final Walkthrough & Cleanup", description: "Remove tape, touch-ups, and cleanup.", percentOfTotal: 15, estimatedDurationDays: 1, deliverables: ["Tape removed", "Touch-ups done", "Site cleaned"] },
  ],
  flooring: [
    { name: "Subfloor Prep & Material Delivery", description: "Prepare subfloor and deliver materials.", percentOfTotal: 20, estimatedDurationDays: 2, deliverables: ["Subfloor leveled", "Old flooring removed", "Materials delivered"] },
    { name: "Installation", description: "Install new flooring throughout.", percentOfTotal: 55, estimatedDurationDays: 5, deliverables: ["Flooring installed", "Transitions installed"] },
    { name: "Trim & Finishing", description: "Install baseboards and quarter round.", percentOfTotal: 15, estimatedDurationDays: 2, deliverables: ["Baseboards installed", "Quarter round installed"] },
    { name: "Final Cleanup & Inspection", description: "Final inspection and cleanup.", percentOfTotal: 10, estimatedDurationDays: 1, deliverables: ["Site cleaned", "Client walkthrough done"] },
  ],
  general: [
    { name: "Mobilization & Planning", description: "Site setup, material procurement, and planning.", percentOfTotal: 10, estimatedDurationDays: 3, deliverables: ["Site setup complete", "Materials ordered", "Schedule confirmed"] },
    { name: "Phase 1 — Core Work", description: "Primary scope of work, first half.", percentOfTotal: 40, estimatedDurationDays: 14, deliverables: ["Core work complete"] },
    { name: "Phase 2 — Completion", description: "Remaining scope of work.", percentOfTotal: 30, estimatedDurationDays: 10, deliverables: ["All work complete", "Inspections passed"] },
    { name: "Finishing & Punch List", description: "Touch-ups, final details, and client walkthrough.", percentOfTotal: 20, estimatedDurationDays: 3, deliverables: ["Punch list complete", "Site cleaned", "Final sign-off"] },
  ],
};

const getTemplate = (roomType = ""): MilestoneTemplate[] => {
  const r = roomType.toLowerCase();
  if (r.includes("kitchen")) return TEMPLATES.kitchen;
  if (r.includes("bath")) return TEMPLATES.bathroom;
  if (r.includes("roof")) return TEMPLATES.roofing;
  if (r.includes("paint")) return TEMPLATES.painting;
  if (r.includes("floor")) return TEMPLATES.flooring;
  return TEMPLATES.general;
};

// ─── Milestone Editor ──────────────────────────────────────────────────────────

interface MilestoneDraft extends CreateMilestonePayload {
  deliverables: string[];
  deliverableInput: string;
}

const emptyDraft = (): MilestoneDraft => ({
  name: "",
  description: "",
  percentOfTotal: 0,
  estimatedDurationDays: undefined,
  deliverables: [],
  deliverableInput: "",
});

interface MilestoneEditorProps {
  projectId: string;
  roomType?: string;
  onSaved: (milestones: MilestoneRecord[]) => void;
}

const MilestoneEditor = ({ projectId, roomType, onSaved }: MilestoneEditorProps) => {
  const template = getTemplate(roomType);
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [drafts, setDrafts] = useState<MilestoneDraft[]>(
    template.map((t) => ({ ...t, deliverableInput: "" })),
  );
  const [saving, setSaving] = useState(false);

  const loadTemplate = () => {
    setDrafts(template.map((t) => ({ ...t, deliverableInput: "" })));
  };

  const percentSum = drafts.reduce((s, d) => s + (Number(d.percentOfTotal) || 0), 0);

  const update = (idx: number, patch: Partial<MilestoneDraft>) =>
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const addDeliverable = (idx: number) => {
    const val = drafts[idx].deliverableInput.trim();
    if (!val) return;
    update(idx, {
      deliverables: [...drafts[idx].deliverables, val],
      deliverableInput: "",
    });
  };

  const removeDeliverable = (mIdx: number, dIdx: number) =>
    update(mIdx, { deliverables: drafts[mIdx].deliverables.filter((_, i) => i !== dIdx) });

  const addMilestone = () => {
    if (drafts.length >= 5) return;
    setDrafts((prev) => [...prev, emptyDraft()]);
  };

  const removeMilestone = (idx: number) => {
    if (drafts.length <= 2) return;
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (percentSum !== 100) {
      toast.error(`Percentages must sum to 100% (currently ${percentSum}%)`);
      return;
    }
    if (drafts.some((d) => !d.name.trim())) {
      toast.error("All milestones must have a name.");
      return;
    }
    try {
      setSaving(true);
      const payload = drafts.map(({ deliverableInput: _di, ...rest }) => rest);
      const saved = await milestoneService.setMilestones(projectId, payload);
      toast.success("Milestones saved.");
      onSaved(saved);
    } catch {
      toast.error("Failed to save milestones.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div>
        <h6 className="font-semibold mb-1">Set Project Milestones</h6>
        <p className="text-sm text-neutral-500">
          Define 2–5 milestones that will be included in the contract. Percentages must sum to 100%.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("template"); loadTemplate(); }}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === "template" ? "bg-primary-600 text-white" : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}
        >
          Use Template
        </button>
        <button
          type="button"
          onClick={() => { setMode("custom"); setDrafts([emptyDraft(), emptyDraft()]); }}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === "custom" ? "bg-primary-600 text-white" : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}
        >
          Custom
        </button>
      </div>

      {/* Milestone list */}
      <div className="space-y-4">
        {drafts.map((draft, idx) => (
          <div key={idx} className="rounded-xl border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Milestone {idx + 1}
              </span>
              {drafts.length > 2 && (
                <button type="button" onClick={() => removeMilestone(idx)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Name *</label>
                <Input
                  value={draft.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="e.g. Foundation & Demo"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Description</label>
                <Textarea
                  rows={2}
                  value={draft.description ?? ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  placeholder="What work is covered in this milestone?"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">% of Total *</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.percentOfTotal || ""}
                  onChange={(e) => update(idx, { percentOfTotal: Number(e.target.value) })}
                  placeholder="e.g. 25"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Est. Duration (days)</label>
                <Input
                  type="number"
                  min={1}
                  value={draft.estimatedDurationDays ?? ""}
                  onChange={(e) => update(idx, { estimatedDurationDays: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Deliverables</label>
              <div className="min-h-9 flex flex-wrap gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                {draft.deliverables.map((d, di) => (
                  <span key={di} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {d}
                    <button type="button" onClick={() => removeDeliverable(idx, di)} className="ml-0.5 hover:text-primary-900">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={draft.deliverableInput}
                  onChange={(e) => update(idx, { deliverableInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addDeliverable(idx); }
                    if (e.key === "Backspace" && !draft.deliverableInput && draft.deliverables.length > 0) {
                      removeDeliverable(idx, draft.deliverables.length - 1);
                    }
                  }}
                  placeholder={draft.deliverables.length === 0 ? "Type and press Enter..." : ""}
                  className="min-w-28 flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {drafts.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="flex items-center gap-1">
              <Plus size={14} /> Add Milestone
            </Button>
          )}
          <span className={`text-sm font-medium ${percentSum === 100 ? "text-green-600" : "text-red-500"}`}>
            Total: {percentSum}% {percentSum === 100 ? "✓" : `(need ${100 - percentSum}% more)`}
          </span>
        </div>
        <Button variant="primary" size="sm" disabled={saving || percentSum !== 100} onClick={() => void handleSave()}>
          {saving ? "Saving..." : "Save Milestones"}
        </Button>
      </div>
    </Card>
  );
};

// ─── Milestone Status Manager (contractor updates progress) ────────────────────

interface MilestoneStatusManagerProps {
  milestones: MilestoneRecord[];
  onUpdated: (updated: MilestoneRecord) => void;
}

const MilestoneStatusManager = ({ milestones, onUpdated }: MilestoneStatusManagerProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const updated = await milestoneService.updateMilestoneStatus(id, status);
      onUpdated(updated);
      toast.success(`Milestone marked as ${status.replace(/_/g, " ")}.`);
    } catch {
      toast.error("Failed to update milestone status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const contractorActions: Record<string, { label: string; next: string }> = {
    pending: { label: "Start Work", next: "in_progress" },
    in_progress: { label: "Submit for Review", next: "submitted" },
    disputed: { label: "Restart Work", next: "in_progress" },
  };

  const completedCount = milestones.filter((m) => ["approved", "paid"].includes(m.status)).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h6 className="font-semibold">Project Milestones</h6>
        <span className="text-sm text-neutral-500">{completedCount}/{milestones.length} complete</span>
      </div>

      <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {milestones.map((m) => {
          const action = contractorActions[m.status];
          const busy = updatingId === m._id;
          return (
            <div key={m._id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-neutral-900">{m.order}. {m.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {m.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {m.description && <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{m.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400">
                    <span>{m.percentOfTotal}% · ${m.paymentAmount.toLocaleString()}</span>
                    {m.estimatedDurationDays && <span>{m.estimatedDurationDays} days</span>}
                  </div>
                  {m.deliverables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.deliverables.map((d, i) => (
                        <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
                {action && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => void handleUpdate(m._id, action.next)}>
                    {busy ? "..." : action.label}
                  </Button>
                )}
              </div>
              {m.status === "disputed" && (
                <p className="mt-2 text-xs text-red-500">This milestone was disputed by the homeowner. Please address the issues and restart.</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ContractorProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<HomeownerProject | null>(null);
  const [projectBid, setProjectBid] = useState<BidRecord | null>(null);
  const [projectContract, setProjectContract] = useState<ContractRecord | null>(null);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loadingContract, setLoadingContract] = useState(true);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [projectResponse, myBids, contractData] = await Promise.all([
          getProjectById(id),
          bidService.getMyBids(),
          contractService.getProjectContract(id).catch(() => null),
        ]);
        setProject(projectResponse.project);
        setProjectContract(contractData);
        setLoadingContract(false);

        const currentProjectBid = myBids.find((bid) => {
          const bidProjectId = typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
          return bidProjectId === id;
        });
        setProjectBid(currentProjectBid ?? null);

        // Load milestones if contract exists
        if (contractData) {
          milestoneService.getProjectMilestones(id).then(setMilestones).catch(() => {});
        }
      } catch {
        toast.error("Failed to load project details.");
        navigate("/contractor/projects");
      } finally {
        setLoadingContract(false);
        setLoading(false);
      }
    };
    void loadProject();
  }, [id, navigate]);

  const images = project?.images ?? [];
  const bidProgress = projectBid ? getBidProgress(projectBid.status) : null;

  useEffect(() => {
    if (activeImageIndex === null || images.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImageIndex(null);
      if (event.key === "ArrowRight") setActiveImageIndex((c) => c === null ? c : (c + 1) % images.length);
      if (event.key === "ArrowLeft") setActiveImageIndex((c) => c === null ? c : (c - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImageIndex, images.length]);

  const hasContractorSigned = Boolean(projectContract?.signatures?.some((s) => s.party === "contractor"));
  const hasHomeownerSigned = Boolean(projectContract?.signatures?.some((s) => s.party === "homeowner"));

  const handleSignContract = async () => {
    if (!id || !projectContract?._id) return;
    try {
      setIsSigningContract(true);
      const updated = await contractService.signContract(projectContract._id);
      setProjectContract(updated);
      toast.success("Contract signed successfully.");
      const refreshed = await contractService.getProjectContract(id);
      setProjectContract(refreshed);
    } catch {
      toast.error("Failed to sign contract.");
    } finally {
      setIsSigningContract(false);
    }
  };

  const showMilestoneEditor =
    projectBid?.status === "accepted" &&
    projectContract &&
    (projectContract.status === "draft" || projectContract.status === "pending_signatures");

  const showMilestoneManager = projectContract?.status === "signed";

  const budget = project?.budgetRange
    ? `$${project.budgetRange.min.toLocaleString()} - $${project.budgetRange.max.toLocaleString()}`
    : project?.customBudget ? `$${project.customBudget.toLocaleString()}` : "Not specified";

  const location = project?.address
    ? `${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zipCode}`
    : "Not specified";

  return (
    <div className="space-y-6">
      <Link to="/contractor/projects">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="size-4" /> Back to Projects
        </Button>
      </Link>

      {/* Bid Status */}
      {projectBid && (
        <Card className="my-10">
          <h6 className="mb-3">Your Bid Status</h6>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Current status</span>
            <span className="font-semibold text-neutral-800 capitalize">{bidProgress?.label}</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${bidProgress?.colorClass}`} style={{ width: bidProgress?.width }} />
          </div>
          {projectBid.status === "rejected" || projectBid.status === "withdrawn" ? (
            <>
              <p className="mt-3 text-sm text-neutral-600">This bid is in a terminal state.</p>
              {projectBid.status === "rejected" && projectBid.reply?.trim() && (
                <p className="mt-2 text-sm text-neutral-700"><span className="font-medium">Reply:</span> {projectBid.reply}</p>
              )}
            </>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {BID_STEPS.map((step) => {
                const currentIndex = BID_STEPS.indexOf(projectBid.status as "submitted" | "shortlisted" | "accepted");
                const stepIndex = BID_STEPS.indexOf(step);
                const done = stepIndex < currentIndex;
                const active = stepIndex === currentIndex;
                return (
                  <div key={step} className={`rounded-lg border px-2 py-2 text-center capitalize ${active ? "border-primary text-primary bg-primary-50" : done ? "border-success text-success bg-success/10" : "border-neutral-200 text-neutral-500"}`}>
                    {step}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Milestone Editor */}
      {showMilestoneEditor && id && (
        <MilestoneEditor
          projectId={id}
          roomType={project?.roomType}
          onSaved={(saved) => setMilestones(saved)}
        />
      )}

      {/* Contract Signature */}
      <Card>
        <h6 className="mb-3">Contract Signature</h6>
        {loadingContract ? (
          <Skeleton variant="text" className="w-full h-12" />
        ) : !projectContract ? (
          <p className="text-sm text-neutral-600">No contract found for this project yet.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-700">Status: <span className="font-semibold capitalize">{projectContract.status.split("_").join(" ")}</span></p>
            <p className="text-sm text-neutral-700">Homeowner signed: {hasHomeownerSigned ? "Yes" : "No"}</p>
            <p className="text-sm text-neutral-700">Contractor signed: {hasContractorSigned ? "Yes" : "No"}</p>
            <p className="text-sm text-neutral-700">Start date: {projectContract.startDate ? new Date(projectContract.startDate).toLocaleDateString() : "Not set"}</p>
            <p className="text-sm text-neutral-700">Estimated end date: {projectContract.estimatedEndDate ? new Date(projectContract.estimatedEndDate).toLocaleDateString() : "Not set"}</p>
            {milestones.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-neutral-700 mb-2">Milestones included ({milestones.length}):</p>
                <div className="space-y-1">
                  {milestones.map((m) => (
                    <div key={m._id} className="flex items-center justify-between text-xs text-neutral-600 rounded-lg bg-neutral-50 px-3 py-2">
                      <span>{m.order}. {m.name}</span>
                      <span className="text-neutral-400">{m.percentOfTotal}% · ${m.paymentAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {projectContract.status === "pending_signatures" && !hasContractorSigned && (
              <Button size="xs" variant="primary" disabled={isSigningContract} onClick={() => void handleSignContract()}>
                {isSigningContract ? "Signing..." : "Sign Contract"}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Milestone Progress Manager (after signing) */}
      {showMilestoneManager && milestones.length > 0 && (
        <MilestoneStatusManager
          milestones={milestones}
          onUpdated={(updated) => setMilestones((prev) => prev.map((m) => (m._id === updated._id ? updated : m)))}
        />
      )}

      {/* Project Details */}
      {loading ? (
        <Card>
          <Skeleton variant="title" className="h-8 w-72" />
          <Skeleton variant="text" className="mt-2 h-5 w-full" />
        </Card>
      ) : (
        <>
          <Card className="space-y-4 mt-10">
            <div className="flex items-center gap-3">
              <h4>{project?.title}</h4>
              <Badge variant="primary">{project?.status ?? "bidding"}</Badge>
            </div>
            <p className="text-neutral-700">{project?.description || "No description provided."}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <span className="text-sm text-neutral-500">Room Type</span>
                <p className="font-semibold text-primary">{project?.roomType?.split("_").join(" ") || "Not specified"}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Budget</span>
                <p className="font-semibold text-primary">{budget}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Location</span>
                <p className="font-semibold text-primary">{location}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h6 className="mb-4">Project Images</h6>
            {images.length === 0 ? (
              <p className="text-neutral-600">No images uploaded for this project.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <img
                    key={`${image.url}-${index}`}
                    src={`${BASE_IMAGE_URL}${image.url}`}
                    alt={`Project image ${index + 1}`}
                    className="h-48 w-full rounded-lg object-cover cursor-pointer"
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Image Lightbox */}
      {activeImageIndex !== null && images[activeImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveImageIndex(null)}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndex(null); }} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" aria-label="Close">
            <X className="size-5" />
          </button>
          {images.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndex((c) => c === null ? c : (c - 1 + images.length) % images.length); }} className="absolute left-4 md:left-8 text-white bg-black/50 rounded-full p-2" aria-label="Previous">
              <ChevronLeft className="size-6" />
            </button>
          )}
          <img src={`${BASE_IMAGE_URL}${images[activeImageIndex].url}`} alt={`Project image ${activeImageIndex + 1}`} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndex((c) => c === null ? c : (c + 1) % images.length); }} className="absolute right-4 md:right-8 text-white bg-black/50 rounded-full p-2" aria-label="Next">
              <ChevronRight className="size-6" />
            </button>
          )}
          <span className="absolute bottom-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">{activeImageIndex + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
};

export default ContractorProjectDetails;
