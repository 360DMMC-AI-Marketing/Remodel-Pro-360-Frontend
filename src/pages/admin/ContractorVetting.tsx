import { adminService } from "@/api/admin";
import type { PopulatedVettingRequest, VettingAction, VettingStatus } from "@/api/admin";
import { Button } from "@/components/atoms/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, FileText, Eye } from "lucide-react";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const statusBadge = (status: string) => {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";
  switch (status) {
    case "approved":
      return <span className={`${base} bg-green-100 text-green-700`}><CheckCircle className="h-3 w-3" />Approved</span>;
    case "rejected":
      return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="h-3 w-3" />Rejected</span>;
    case "more_info_needed":
      return <span className={`${base} bg-yellow-100 text-yellow-700`}><AlertCircle className="h-3 w-3" />More Info</span>;
    default:
      return <span className={`${base} bg-blue-100 text-blue-700`}><AlertCircle className="h-3 w-3" />Pending</span>;
  }
};

interface ReviewDialogProps {
  request: PopulatedVettingRequest;
  onClose: () => void;
  onReviewed: () => void;
}

const ReviewDialog = ({ request, onClose, onReviewed }: ReviewDialogProps) => {
  const [action, setAction] = useState<VettingAction>("approved");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contractor = request.contractorId;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await adminService.reviewVettingRequest(request._id, action, notes || undefined);
      toast.success(`Request marked as ${action.replace("_", " ")}.`);
      onReviewed();
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <h5 className="font-semibold">Review Vetting Request</h5>
          <p className="text-sm text-muted-foreground mt-1">
            {contractor.firstName} {contractor.lastName} &mdash; {contractor.email}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Submitted data */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
            <p><span className="font-medium">License #:</span> {request.submittedData.licenseNumber || "—"}</p>
            <p><span className="font-medium">License Expiry:</span> {request.submittedData.licenseExpiry ? new Date(request.submittedData.licenseExpiry).toLocaleDateString() : "—"}</p>
            <p><span className="font-medium">Insurance Provider:</span> {request.submittedData.insuranceProvider || "—"}</p>
            <p><span className="font-medium">Insurance Expiry:</span> {request.submittedData.insuranceExpiry ? new Date(request.submittedData.insuranceExpiry).toLocaleDateString() : "—"}</p>
          </div>

          {/* Document files */}
          {request.submittedData.files.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Documents</p>
              <div className="space-y-2">
                {request.submittedData.files.map((fileKey) => (
                  <a
                    key={fileKey}
                    href={BASE_IMAGE_URL + fileKey}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {fileKey.split("/").pop()}
                    </span>
                    <Eye className="h-4 w-4 ml-auto shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action selector */}
          <div>
            <p className="text-sm font-medium mb-2">Decision</p>
            <div className="flex gap-2 flex-wrap">
              {(["approved", "rejected", "more_info_needed"] as VettingAction[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAction(a)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    action === a
                      ? a === "approved"
                        ? "bg-green-600 text-white border-green-600"
                        : a === "rejected"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-yellow-500 text-white border-yellow-500"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {a === "more_info_needed" ? "More Info Needed" : a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Admin Notes{action !== "approved" && <span className="text-destructive ml-1">*</span>}
            </label>
            <textarea
              className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              rows={3}
              placeholder={action === "rejected" ? "Reason for rejection…" : action === "more_info_needed" ? "Specify what information is needed…" : "Optional notes…"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || (action !== "approved" && !notes.trim())}
          >
            {isSubmitting ? "Submitting…" : "Submit Decision"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const TABS: { label: string; value: VettingStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "More Info", value: "more_info_needed" },
];

const ContractorVetting = () => {
  const [filter, setFilter] = useState<VettingStatus>("all");
  const [requests, setRequests] = useState<PopulatedVettingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<PopulatedVettingRequest | null>(null);

  const fetchRequests = async (status: VettingStatus) => {
    setIsLoading(true);
    try {
      const data = await adminService.getVettingRequests(status);
      setRequests(data);
    } catch {
      toast.error("Failed to load vetting requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(filter);
  }, [filter]);

  return (
    <div>
      {selected && (
        <ReviewDialog
          request={selected}
          onClose={() => setSelected(null)}
          onReviewed={() => {
            setSelected(null);
            fetchRequests(filter);
          }}
        />
      )}

      <div>
        <h4>Contractor Vetting</h4>
        <p className="text-muted-foreground">
          Review and verify contractor license &amp; insurance submissions
        </p>
      </div>

      <div className="mt-5 flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "primary" : "ghost"}
            size="sm"
            className="border"
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-neutral-600 p-4">Contractor</TableHead>
              <TableHead className="hidden md:table-cell text-neutral-600">License #</TableHead>
              <TableHead className="hidden sm:table-cell text-neutral-600">Submitted</TableHead>
              <TableHead className="text-neutral-600">Status</TableHead>
              <TableHead className="text-right text-neutral-600 pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No vetting requests found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              requests.map((r) => {
                const c = r.contractorId;
                return (
                  <TableRow key={r._id}>
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img
                            src={BASE_IMAGE_URL + c.avatar}
                            alt={`${c.firstName} ${c.lastName}`}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-200 rounded-full flex justify-center items-center shrink-0">
                            <span className="text-primary-600 text-sm font-medium">
                              {c.firstName[0]}{c.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-neutral-500">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {r.submittedData.licenseNumber || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-500">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelected(r)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContractorVetting;

