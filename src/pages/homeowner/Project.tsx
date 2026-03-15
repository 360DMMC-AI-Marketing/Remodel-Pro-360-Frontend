import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { HomeownerProject } from "@/types/project";
import { getProjectById, updateProjectStatus } from "@/api/porject";
import { bidService, type HomeownerBid } from "@/api/bid";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Textarea } from "@/components/atoms/Textarea";
import { toast } from "sonner";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<HomeownerProject | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [bids, setBids] = useState<HomeownerBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [actingBidId, setActingBidId] = useState<string | null>(null);
  const [rejectDialogBidId, setRejectDialogBidId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const images = project?.images ?? [];
  const isRejectDialogOpen = Boolean(rejectDialogBidId);

  useEffect(() => {
    if (!isRejectDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actingBidId) {
        setRejectDialogBidId(null);
        setRejectReason("");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isRejectDialogOpen, actingBidId]);

  const loadBids = async (projectId: string) => {
    try {
      setLoadingBids(true);
      const data = await bidService.getProjectBids(projectId);
      setBids(data);
    } catch (error) {
      console.error("Failed to load bids:", error);
      toast.error("Failed to load bids.");
    } finally {
      setLoadingBids(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
        setLoading(true);
      try {
        const data = await getProjectById(id!);
        setProject(data.project);
        await loadBids(id!);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load project:", error);
        navigate("/homeowner/projects");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchProject();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (activeImageIndex === null || images.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) => {
          if (current === null) return current;
          return (current + 1) % images.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) => {
          if (current === null) return current;
          return (current - 1 + images.length) % images.length;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImageIndex, images.length]);

  const goToPreviousImage = () => {
    if (images.length === 0) return;
    setActiveImageIndex((current) => {
      if (current === null) return current;
      return (current - 1 + images.length) % images.length;
    });
  };

  const goToNextImage = () => {
    if (images.length === 0) return;
    setActiveImageIndex((current) => {
      if (current === null) return current;
      return (current + 1) % images.length;
    });
  };

  const budget = project?.budgetRange ? `${project.budgetRange.min.toLocaleString()} - ${project.budgetRange.max.toLocaleString()}` : project?.customBudget ? project.customBudget.toLocaleString() : "N/A";

  const address = project?.address ? `${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zipCode}` : "N/A";

  const handleStatusUpdate = async (status: "draft" | "bidding") => {
    if (!id || !project) return;
    if (project.status === status) return;

    try {
      setIsUpdatingStatus(true);
      const response = await updateProjectStatus(id, status);
      setProject(response.project);
      toast.success(`Project moved to ${status}.`);
    } catch (error) {
      console.error("Failed to update project status:", error);
      toast.error("Failed to update project status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getContractorName = (bid: HomeownerBid) => {
    if (typeof bid.contractorId === "string") return "Contractor";
    const firstName = bid.contractorId.firstName ?? "";
    const lastName = bid.contractorId.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Contractor";
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!id) return;
    try {
      setActingBidId(bidId);
      await bidService.acceptBid(bidId);
      const [projectData] = await Promise.all([
        getProjectById(id),
        loadBids(id),
      ]);
      setProject(projectData.project);
      toast.success("Bid accepted successfully.");
    } catch (error) {
      console.error("Failed to accept bid:", error);
      toast.error("Failed to accept bid.");
    } finally {
      setActingBidId(null);
    }
  };

  const handleRejectBid = async (bidId: string, reason?: string) => {
    if (!id) return;
    try {
      setActingBidId(bidId);
      await bidService.rejectBid(bidId, reason);
      await loadBids(id);
      setRejectDialogBidId(null);
      setRejectReason("");
      toast.success("Bid rejected.");
    } catch (error) {
      console.error("Failed to reject bid:", error);
      toast.error("Failed to reject bid.");
    } finally {
      setActingBidId(null);
    }
  };

  const openRejectDialog = (bidId: string) => {
    setRejectDialogBidId(bidId);
    setRejectReason("");
  };

  return (
    <div>
      <Link to="/homeowner/projects">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <ArrowLeft />
          Back to Projects
        </Button>
      </Link>
      <div className="my-10 flex flex-col md:flex-row md:justify-between md:items-center gap-5 md:gap-0">
        {loading ? (
          <>
            <div>
              <Skeleton variant="title" className="w-96 h-8 mb-2" />
              <Skeleton variant="text" className="w-48 h-4" />
            </div>
            <Skeleton variant="text" className="w-32 h-10" />
          </>
        ) : (
          <>
            <div>
              <span className="flex items-center space-x-4">
                <h4>Master Bathroom Renovation</h4>
                <Badge variant="primary">{project?.status}</Badge>
              </span>
              <p className="text-neutral-500">{project?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={project?.status === "draft" ? "primary" : "outline"}
                size="sm"
                disabled={isUpdatingStatus || project?.status === "draft"}
                onClick={() => void handleStatusUpdate("draft")}
              >
                {isUpdatingStatus && project?.status !== "draft"
                  ? "Updating..."
                  : "Move to Draft"}
              </Button>
              <Button
                variant={project?.status === "bidding" ? "primary" : "outline"}
                size="sm"
                disabled={isUpdatingStatus || project?.status === "bidding"}
                onClick={() => void handleStatusUpdate("bidding")}
              >
                {isUpdatingStatus && project?.status !== "bidding"
                  ? "Updating..."
                  : "Move to Bidding"}
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl p-5 border border-neutral-200">
            <h6 className="mb-3 text-neutral-800">Images & Linked Designs</h6>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="image" className="w-full h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img, index) => (
                      <img
                        key={index}
                        src={`${BASE_IMAGE_URL}${img.url}`}
                        alt={`Project Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => setActiveImageIndex(index)}
                      />
                  ))}
              </div>
            )}
        </div>
        <div className="h-fit col-span-1 bg-white rounded-xl p-5 border border-neutral-200">
            <h6 className="mb-3 text-neutral-800">Details</h6>
            {loading ? (
              <div className="space-y-4">
                <Skeleton variant="text" className="w-full h-16" />
                <Skeleton variant="text" className="w-32 h-4 mt-5" />
                <Skeleton variant="text" className="w-48 h-5" />
                <Skeleton variant="text" className="w-32 h-4 mt-5" />
                <Skeleton variant="text" className="w-40 h-5" />
                <Skeleton variant="text" className="w-32 h-4 mt-5" />
                <Skeleton variant="text" className="w-full h-5" />
              </div>
            ) : (
              <>
                <p className="text-neutral-600 pb-5 border-b">{project?.description}</p>
                <div className="pt-5">
                    <span className="text-sm text-neutral-600">Room Type</span>
                    <br />
                    <span className="font-semibold text-primary">{project?.roomType.split("_").join(" ")}</span>
                </div>
                <div className="pt-5">
                    <span className="text-sm text-neutral-600">Budget</span>
                    <br />
                    <span className="font-semibold text-primary">${budget}</span>
                </div>
                <div className="pt-5">
                    <span className="text-sm text-neutral-600">Location</span>
                    <br />
                    <span className="font-semibold text-primary">{address}</span>
                </div>
              </>
            )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
        <h6 className="mb-4 text-neutral-800">Received Bids</h6>
        {loadingBids ? (
          <div className="space-y-3">
            {[1, 2].map((item) => (
              <Skeleton key={item} variant="text" className="w-full h-20" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <p className="text-neutral-600">No bids received yet.</p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const isBusy = actingBidId === bid._id;
              const canTakeAction =
                bid.status === "submitted" || bid.status === "shortlisted";

              return (
                <div
                  key={bid._id}
                  className="rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-neutral-800">
                        {getContractorName(bid)}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Amount: ${bid.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="primary">{bid.status}</Badge>
                  </div>

                  <div className="mt-3 text-sm text-neutral-700 space-y-1">
                    <p>
                      <span className="font-medium">Message:</span>{" "}
                      {bid.message || "No message provided"}
                    </p>
                    <p>
                      <span className="font-medium">Estimated Start:</span>{" "}
                      {bid.estimatedStartDate
                        ? new Date(bid.estimatedStartDate).toLocaleDateString()
                        : "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {bid.estimatedDurationDays
                        ? `${bid.estimatedDurationDays} days`
                        : "Not provided"}
                    </p>
                  </div>

                  {canTakeAction && project?.status === "bidding" && (
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => void handleAcceptBid(bid._id)}
                      >
                        {isBusy ? "Processing..." : "Accept"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => openRejectDialog(bid._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isRejectDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-neutral-950/55"
              aria-label="Close reject dialog"
              onClick={() => {
                if (!actingBidId) {
                  setRejectDialogBidId(null);
                  setRejectReason("");
                }
              }}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close reject dialog"
                onClick={() => {
                  if (!actingBidId) {
                    setRejectDialogBidId(null);
                    setRejectReason("");
                  }
                }}
                disabled={Boolean(actingBidId)}
              >
                <X className="size-4" />
              </button>

              <h5 className="font-semibold">Reject Bid</h5>
              <p className="mt-1 text-sm text-neutral-600">
                Optionally provide a reason that will be sent to the contractor.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <label htmlFor="reject-reason">Reason (optional)</label>
                <Textarea
                  id="reject-reason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Add a rejection reason..."
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(actingBidId)}
                  onClick={() => {
                    setRejectDialogBidId(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={Boolean(actingBidId) || !rejectDialogBidId}
                  onClick={() =>
                    rejectDialogBidId &&
                    void handleRejectBid(
                      rejectDialogBidId,
                      rejectReason.trim() || undefined,
                    )
                  }
                >
                  {actingBidId ? "Rejecting..." : "Reject Bid"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {activeImageIndex !== null && images[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveImageIndex(null);
            }}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goToPreviousImage();
              }}
              className="absolute left-4 md:left-8 text-white bg-black/50 rounded-full p-2"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <img
            src={`${BASE_IMAGE_URL}${images[activeImageIndex].url}`}
            alt={`Project image ${activeImageIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goToNextImage();
              }}
              className="absolute right-4 md:right-8 text-white bg-black/50 rounded-full p-2"
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          <span className="absolute bottom-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {activeImageIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Project;
