import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { HomeownerProject } from "@/types/project";
import { deleteProject, getProjectById, updateProject, updateProjectStatus } from "@/api/project";
import { bidService, type HomeownerBid } from "@/api/bid";
import { contractService, type ContractRecord } from "@/api/contract";
import { milestoneService, type MilestoneRecord } from "@/api/milestone";
import { paymentService, type EscrowStatus } from "@/api/payment";
import { reviewService, type Review, type CategoryRatings } from "@/api/review";
import { PaymentForm } from "@/components/PaymentForm";
import { ArrowLeft, ChevronLeft, ChevronRight, DollarSign, Edit3, MessageSquare, MoreHorizontal, Save, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Textarea } from "@/components/atoms/Textarea";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { getImageUrl } from "@/lib/utils";

interface EditProjectForm {
  title: string;
  roomType: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  customBudget?: number;
  startDate?: string;
}

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const projectStatusVariant = (status?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (status) {
    case "in_progress": return "warning";
    case "completed": return "success";
    case "cancelled": return "error";
    case "draft": return "draft";
    default: return "primary";
  }
};

const bidStatusVariant = (status?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (status) {
    case "shortlisted": return "warning";
    case "accepted": return "success";
    case "rejected": return "error";
    case "withdrawn": case "draft": return "draft";
    default: return "primary";
  }
};

const milestoneStatusVariant = (status?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (status) {
    case "in_progress": return "primary";
    case "submitted": return "warning";
    case "approved": case "paid": return "success";
    case "disputed": return "error";
    default: return "draft";
  }
};

const contractStatusVariant = (status?: string): "primary" | "success" | "warning" | "error" | "draft" => {
  switch (status) {
    case "pending_signatures": return "warning";
    case "signed": return "success";
    default: return "draft";
  }
};

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<HomeownerProject | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [bids, setBids] = useState<HomeownerBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [projectContract, setProjectContract] = useState<ContractRecord | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [isStartingSignatureFlow, setIsStartingSignatureFlow] = useState(false);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [actingBidId, setActingBidId] = useState<string | null>(null);
  const [rejectDialogBidId, setRejectDialogBidId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus | null>(null);
  const [loadingEscrow, setLoadingEscrow] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedBidIds, setSelectedBidIds] = useState<string[]>([]);
  const [acceptDialogBidId, setAcceptDialogBidId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ categoryRatings: CategoryRatings; comment: string }>({
    categoryRatings: { quality: 0, communication: 0, timeliness: 0, budget: 0 },
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  // Proof image lightbox
  const [proofLightbox, setProofLightbox] = useState<string[]>([]);
  const [proofLightboxIdx, setProofLightboxIdx] = useState(0);
  // Dispute dialog
  const [disputeMilestoneId, setDisputeMilestoneId] = useState<string | null>(null);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const [editForm, setEditForm] = useState<EditProjectForm>({
    title: "",
    roomType: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    budgetRange: undefined,
    customBudget: undefined,
    startDate: undefined,
  });

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

  const loadContract = async (projectId: string) => {
    try {
      setLoadingContract(true);
      const contract = await contractService.getProjectContract(projectId);
      setProjectContract(contract);
    } catch (error) {
      console.error("Failed to load contract:", error);
      setProjectContract(null);
    } finally {
      setLoadingContract(false);
    }
  };

  const loadMilestones = async (projectId: string) => {
    try {
      setLoadingMilestones(true);
      const data = await milestoneService.getProjectMilestones(projectId);
      setMilestones(data);
    } catch {
      // milestones may not exist yet
    } finally {
      setLoadingMilestones(false);
    }
  };

  const loadEscrow = async (projectId: string) => {
    try {
      setLoadingEscrow(true);
      const data = await paymentService.getEscrowStatus(projectId);
      setEscrowStatus(data);
    } catch {
      // escrow may not exist yet
    } finally {
      setLoadingEscrow(false);
    }
  };

  const loadReview = async (projectId: string) => {
    try {
      setLoadingReview(true);
      const data = await reviewService.getProjectReview(projectId);
      setReview(data);
    } catch {
      // review may not exist yet
    } finally {
      setLoadingReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    const { quality, communication, timeliness, budget: budgetRating } = reviewForm.categoryRatings;
    if (!quality || !communication || !timeliness || !budgetRating) {
      toast.error("Please rate all categories.");
      return;
    }
    try {
      setSubmittingReview(true);
      const created = await reviewService.createReview({
        projectId: id,
        categoryRatings: reviewForm.categoryRatings,
        comment: reviewForm.comment || undefined,
      });
      setReview(created);
      setShowReviewForm(false);
      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
        setLoading(true);
      try {
        const data = await getProjectById(id!);
        setProject(data.project);
        await Promise.all([loadBids(id!), loadContract(id!), loadMilestones(id!), loadEscrow(id!), loadReview(id!)]);
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

  useEffect(() => {
    if (!actionsOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node;
      if (!actionsMenuRef.current?.contains(targetNode)) {
        setActionsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("touchstart", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [actionsOpen]);

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

  const handleStatusUpdate = async (status: "draft" | "bidding" | "cancelled") => {
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

  const handleCancelProject = async () => {
    if (!id || !project) return;
    try {
      setIsCancelling(true);
      const response = await updateProjectStatus(id, "cancelled");
      setProject(response.project);
      toast.success("Project cancelled.");
      setShowCancelDialog(false);
    } catch {
      toast.error("Failed to cancel project.");
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel =
    project &&
    !["cancelled", "completed", "in_progress"].includes(project.status ?? "") &&
    projectContract?.status !== "signed";

  const getContractorName = (bid: HomeownerBid) => {
    if (typeof bid.contractorId === "string") return "Contractor";
    const firstName = bid.contractorId.firstName ?? "";
    const lastName = bid.contractorId.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Contractor";
  };

  const hasPartySigned = (party: "homeowner" | "contractor") =>
    Boolean(projectContract?.signatures?.some((signature) => signature.party === party));

  const handleAcceptBid = async (bidId: string) => {
    if (!id) return;
    try {
      setActingBidId(bidId);
      await bidService.acceptBid(bidId);
      const [projectData] = await Promise.all([
        getProjectById(id),
        loadBids(id),
        loadContract(id),
      ]);
      setProject(projectData.project);
      toast.success("Bid accepted successfully.");
      setAcceptDialogBidId(null);
    } catch (error) {
      console.error("Failed to accept bid:", error);
      toast.error("Failed to accept bid.");
    } finally {
      setActingBidId(null);
    }
  };

  const handleStartSignatureFlow = async () => {
    if (!projectContract?._id || !id) return;

    try {
      setIsStartingSignatureFlow(true);
      const updated = await contractService.startSignatureFlow(projectContract._id);
      setProjectContract(updated);
      toast.success("Signature flow started.");
      await loadContract(id);
    } catch (error) {
      console.error("Failed to start signature flow:", error);
      toast.error("Failed to start signature flow.");
    } finally {
      setIsStartingSignatureFlow(false);
    }
  };

  const handleSignContract = async () => {
    if (!projectContract?._id || !id) return;

    try {
      setIsSigningContract(true);
      const updated = await contractService.signContract(projectContract._id);
      setProjectContract(updated);
      toast.success("Contract signed successfully.");
      await loadContract(id);
    } catch (error) {
      console.error("Failed to sign contract:", error);
      toast.error("Failed to sign contract.");
    } finally {
      setIsSigningContract(false);
    }
  };

  const handleMilestoneStatus = async (milestoneId: string, status: string) => {
    if (!id) return;
    try {
      setUpdatingMilestoneId(milestoneId);
      const updated = await milestoneService.updateMilestoneStatus(milestoneId, status);
      setMilestones((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      toast.success(`Milestone ${status.replace(/_/g, " ")}.`);
    } catch {
      toast.error("Failed to update milestone.");
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleDisputeMilestone = async () => {
    if (!disputeMilestoneId || !disputeMessage.trim()) return;
    try {
      setIsDisputing(true);
      const updated = await milestoneService.updateMilestoneStatus(
        disputeMilestoneId,
        "disputed",
        { disputeReason: disputeMessage.trim() },
      );
      setMilestones((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      toast.success("Milestone disputed.");
      setDisputeMilestoneId(null);
      setDisputeMessage("");
    } catch {
      toast.error("Failed to dispute milestone.");
    } finally {
      setIsDisputing(false);
    }
  };

  const handleShortlistBid = async (bidId: string) => {
    if (!id) return;
    try {
      setActingBidId(bidId);
      await bidService.shortlistBid(bidId);
      await loadBids(id);
      toast.success("Bid shortlisted.");
    } catch (error) {
      console.error("Failed to shortlist bid:", error);
      toast.error("Failed to shortlist bid.");
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

  const toggleBidSelect = (bidId: string) => {
    setSelectedBidIds((prev) =>
      prev.includes(bidId) ? prev.filter((b) => b !== bidId) : [...prev, bidId],
    );
  };

  const startEditing = () => {
    if (!project) return;

    setEditForm({
      title: project.title,
      roomType: project.roomType,
      description: project.description || "",
      address: {
        street: project.address?.street || "",
        city: project.address?.city || "",
        state: project.address?.state || "",
        zipCode: project.address?.zipCode || "",
      },
      budgetRange: project.budgetRange,
      customBudget:
        typeof project.customBudget === "number" && project.customBudget > 0
          ? project.customBudget
          : undefined,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : undefined,
    });
    setNewImages([]);
    setImagePreviews([]);
    setRemovedImageUrls([]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setNewImages([]);
    setImagePreviews([]);
    setRemovedImageUrls([]);
    setIsEditing(false);
  };

  const onNewImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...nextPreviews]);
    event.target.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    setImagePreviews((prev) => {
      const previewToRemove = prev[index];
      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove);
      }
      return prev.filter((_, previewIndex) => previewIndex !== index);
    });
  };

  const removeExistingImage = (url: string) => {
    setRemovedImageUrls((prev) => [...new Set([...prev, url])]);
  };

  const undoRemoveExistingImage = (url: string) => {
    setRemovedImageUrls((prev) => prev.filter((item) => item !== url));
  };

  const handleSaveEdit = async () => {
    if (!id || !project) return;

    if (editForm.title.trim().length < 3) {
      toast.error("Title must have at least 3 characters.");
      return;
    }

    if (editForm.description.trim().length < 10) {
      toast.error("Description must have at least 10 characters.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const response = await updateProject(
        id,
        {
          title: editForm.title,
          roomType: editForm.roomType,
          description: editForm.description,
          address: editForm.address,
          budgetRange: editForm.budgetRange,
          customBudget:
            typeof editForm.customBudget === "number" && editForm.customBudget > 0
              ? editForm.customBudget
              : undefined,
          startDate: editForm.startDate ? new Date(editForm.startDate) : undefined,
          images: [],
          attachedDesignId: null,
        },
        {
          newImages,
          removeImageUrls: removedImageUrls,
        },
      );

      setProject(response.project);
      toast.success("Project updated successfully.");
      cancelEditing();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;

    try {
      setIsDeletingProject(true);
      await deleteProject(id);
      toast.success("Project deleted.");
      setIsDeleteProjectDialogOpen(false);
      navigate("/homeowner/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project.");
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="p-6">
      <AlertDialog
        open={isDeleteProjectDialogOpen}
        title="Delete project?"
        description="Deleting this project will remove its details, images, and related context from your dashboard."
        warningText="This action is permanent and cannot be undone."
        confirmLabel="Delete project"
        cancelLabel="Keep project"
        isLoading={isDeletingProject}
        onConfirm={handleDeleteProject}
        onClose={() => setIsDeleteProjectDialogOpen(false)}
      />

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
                <h4>{project?.title}</h4>
                <Badge variant={projectStatusVariant(project?.status)}>{project?.status?.replace(/_/g, " ")}</Badge>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {projectContract?.contractorId && (
                <Link to="/homeowner/messages">
                  <Button size="xs" variant="outline">
                    <MessageSquare size={14} className="mr-1.5" />
                    Message
                  </Button>
                </Link>
              )}
              <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setActionsOpen((prev) => !prev)}
                className="p-2 rounded-full cursor-pointer hover:bg-secondary-100 group"
                aria-label="Open project actions"
              >
                <MoreHorizontal className="size-5 group-hover:text-secondary-600" />
              </button>

              {actionsOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        startEditing();
                        setActionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      <Edit3 className="size-4" />
                      Edit Project
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          cancelEditing();
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                      >
                        <X className="size-4" />
                        Cancel Edit
                      </button>
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={() => {
                          void handleSaveEdit();
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                      >
                        <Save className="size-4" />
                        {isSavingEdit ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={isUpdatingStatus || project?.status === "draft"}
                    onClick={() => {
                      void handleStatusUpdate("draft");
                      setActionsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Move to Draft
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || project?.status === "bidding"}
                    onClick={() => {
                      void handleStatusUpdate("bidding");
                      setActionsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Move to Bidding
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteProjectDialogOpen(true);
                      setActionsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                    Delete Project
                  </button>
                </div>
              )}
            </div>
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl p-5 border border-neutral-200">
            <h6 className="mb-3 text-neutral-800">Images & Linked Designs</h6>
            {isEditing && (
              <div className="mb-4 space-y-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700">
                  <Upload className="size-4" />
                  Add Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onNewImageChange}
                  />
                </label>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative overflow-hidden rounded-lg border border-neutral-200">
                        <img src={preview} alt="New upload" className="h-28 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="image" className="w-full h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img, index) => {
                    const markedForRemoval = removedImageUrls.includes(img.url);
                    return (
                      <div key={img.url + index} className="relative">
                        <img
                          src={`${BASE_IMAGE_URL}${img.url}`}
                          alt={`Project Image ${index + 1}`}
                          className={`w-full h-48 object-cover rounded-lg cursor-pointer ${
                            markedForRemoval ? "opacity-40" : ""
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() =>
                              markedForRemoval
                                ? undoRemoveExistingImage(img.url)
                                : removeExistingImage(img.url)
                            }
                            className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs"
                          >
                            {markedForRemoval ? "Undo" : "Remove"}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <label>Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label>Room Type</label>
                  <Input
                    value={editForm.roomType}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, roomType: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label>Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Street"
                    value={editForm.address.street}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, street: event.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="City"
                    value={editForm.address.city}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: event.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="State"
                    value={editForm.address.state}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: event.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="Zip Code"
                    value={editForm.address.zipCode}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, zipCode: event.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Budget Range</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={editForm.budgetRange?.min ?? ""}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customBudget: undefined,
                          budgetRange: {
                            min: event.target.value ? Number(event.target.value) : 0,
                            max: prev.budgetRange?.max ?? 0,
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={editForm.budgetRange?.max ?? ""}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          customBudget: undefined,
                          budgetRange: {
                            min: prev.budgetRange?.min ?? 0,
                            max: event.target.value ? Number(event.target.value) : 0,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Custom Budget</label>
                  <Input
                    type="number"
                    value={editForm.customBudget || ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        customBudget: event.target.value ? Number(event.target.value) : undefined,
                        budgetRange: undefined,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label>Start Date</label>
                  <Input
                    type="date"
                    value={editForm.startDate || ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        startDate: event.target.value || undefined,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
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

      {/* Contract */}
      <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
        <h6 className="mb-4 text-neutral-800">Contract Signature</h6>

        {loadingContract ? (
          <Skeleton variant="text" className="w-full h-16" />
        ) : !projectContract ? (
          <p className="text-neutral-600">
            No contract found yet. A contract is created automatically when a bid is accepted.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-700">
              Status: <Badge variant={contractStatusVariant(projectContract.status)}>{projectContract.status.split("_").join(" ")}</Badge>
            </p>
            <p className="text-sm text-neutral-700">
              Homeowner signed: {hasPartySigned("homeowner") ? "Yes" : "No"}
            </p>
            <p className="text-sm text-neutral-700">
              Contractor signed: {hasPartySigned("contractor") ? "Yes" : "No"}
            </p>
            <p className="text-sm text-neutral-700">
              Start date: {projectContract.startDate ? new Date(projectContract.startDate).toLocaleDateString() : "Not set"}
            </p>
            <p className="text-sm text-neutral-700">
              Estimated end date: {projectContract.estimatedEndDate ? new Date(projectContract.estimatedEndDate).toLocaleDateString() : "Not set"}
            </p>

            <div className="flex gap-2 pt-2">
              {projectContract.status === "draft" && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={isStartingSignatureFlow}
                  onClick={() => void handleStartSignatureFlow()}
                >
                  {isStartingSignatureFlow ? "Starting..." : "Start Signature"}
                </Button>
              )}

              {projectContract.status === "pending_signatures" && !hasPartySigned("homeowner") && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={isSigningContract}
                  onClick={() => void handleSignContract()}
                >
                  {isSigningContract ? "Signing..." : "Sign as Homeowner"}
                </Button>
              )}

              {canCancel && (
                <Button size="xs" variant="danger" onClick={() => setShowCancelDialog(true)}>
                  Cancel Project
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment & Escrow */}
      {projectContract?.status === "signed" && (
        <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
          <h6 className="mb-4 text-neutral-800">Payment & Escrow</h6>
          {loadingEscrow ? (
            <Skeleton variant="text" className="w-full h-16" />
          ) : escrowStatus?.funded ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Project Funded — ${escrowStatus.totalDeposited.toLocaleString()} in escrow</p>
                <p className="mt-1 text-xs text-green-700">
                  Funds are securely held. ${escrowStatus.released.toLocaleString()} released · ${escrowStatus.held.toLocaleString()} remaining.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-neutral-600">
                Fund the project to start work. A 4% platform fee applies.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowPaymentForm(true)}>
                Fund Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Milestone Timeline (after contract signed) */}
      {projectContract?.status === "signed" && milestones.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
          <h6 className="mb-4 text-neutral-800">Project Timeline</h6>
          <div className="relative pl-6 space-y-4">
            {milestones.map((m, i) => {
              const done = ["approved", "paid"].includes(m.status);
              const active = m.status === "in_progress" || m.status === "submitted";
              const date = m.status === "paid" ? m.paidAt : done ? m.updatedAt : undefined;
              const isLast = i === milestones.length - 1;
              return (
                <div key={m._id} className="relative flex items-start gap-3">
                  <div className="absolute -left-6 top-0.5 flex flex-col items-center">
                    <div className={`size-3 rounded-full border-2 ${done ? "bg-green-500 border-green-500" : active ? "bg-primary-500 border-primary-500" : "bg-white border-neutral-300"}`} />
                    {!isLast && (
                      <div className={`w-0.5 h-6 ${done ? "bg-green-300" : "bg-neutral-200"}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm ${done ? "text-neutral-900 font-medium" : active ? "text-primary-700 font-medium" : "text-neutral-400"}`}>
                      {m.order}. {m.name}
                      <span className="ml-2 text-xs font-normal text-neutral-400">${m.paymentAmount.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-neutral-400">
                      {m.status === "paid" && date ? `Paid ${new Date(date).toLocaleDateString()}` : m.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Progress & Payment Status (shown after contract is signed) */}
      {projectContract?.status === "signed" && (
        <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
          <h6 className="mb-4 text-neutral-800">Project Progress</h6>
          {loadingMilestones ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="text" className="w-full h-14" />)}
            </div>
          ) : milestones.length === 0 ? (
            <p className="text-sm text-neutral-500">No milestones defined yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Overall progress bar */}
              {(() => {
                const done = milestones.filter((m) => ["approved", "paid"].includes(m.status)).length;
                const pct = Math.round((done / milestones.length) * 100);
                const totalPaid = milestones.filter((m) => m.status === "paid").reduce((sum, m) => sum + m.paymentAmount, 0);
                const totalAmount = milestones.reduce((sum, m) => sum + m.paymentAmount, 0);
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>{done} of {milestones.length} milestones complete</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
                      <DollarSign size={14} className="text-neutral-400" />
                      <span className="text-sm text-neutral-700">
                        <span className="font-semibold text-green-600">${totalPaid.toLocaleString()}</span>
                        {" "}paid of{" "}
                        <span className="font-semibold">${totalAmount.toLocaleString()}</span>
                        {" "}total
                      </span>
                    </div>
                  </div>
                );
              })()}

              {milestones.map((m) => {
                const busy = updatingMilestoneId === m._id;
                return (
                  <div key={m._id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm text-neutral-900">{m.order}. {m.name}</span>
                          <Badge variant={milestoneStatusVariant(m.status)}>
                            {m.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {m.description && <p className="mt-1 text-xs text-neutral-500">{m.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400">
                          <span className="font-medium text-neutral-600">${m.paymentAmount.toLocaleString()}</span>
                          <span>{m.percentOfTotal}%</span>
                          {m.estimatedDurationDays && <span>{m.estimatedDurationDays} days</span>}
                          {m.paidAt && <span className="text-green-600">Paid {new Date(m.paidAt).toLocaleDateString()}</span>}
                        </div>
                        {m.deliverables.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.deliverables.map((d, i) => (
                              <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">{d}</span>
                            ))}
                          </div>
                        )}
                        {m.proofImages && m.proofImages.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-neutral-600 mb-1">Proof Photos</p>
                            <div className="flex flex-wrap gap-2">
                              {m.proofImages.map((img, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setProofLightbox(m.proofImages!.map((p) => getImageUrl(p)));
                                    setProofLightboxIdx(i);
                                  }}
                                  className="size-16 rounded-lg overflow-hidden border border-neutral-200 hover:ring-2 hover:ring-primary-400 transition-all"
                                >
                                  <img loading="lazy" src={getImageUrl(img)} alt={`Proof ${i + 1}`} className="size-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {m.status === "submitted" && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="xs" variant="primary" disabled={busy} onClick={() => void handleMilestoneStatus(m._id, "approved")}>
                            {busy ? "..." : "Approve"}
                          </Button>
                          <Button size="xs" variant="danger" disabled={busy} onClick={() => { setDisputeMilestoneId(m._id); setDisputeMessage(""); }}>
                            Dispute
                          </Button>
                        </div>
                      )}
                      {m.status === "paid" && (
                        <Button size="xs" variant="ghost" onClick={() => paymentService.downloadReceipt(m._id)}>
                          Receipt
                        </Button>
                      )}
                      {m.status === "approved" && (
                        <Button size="xs" variant="outline" disabled={busy} onClick={async () => {
                          try {
                            setUpdatingMilestoneId(m._id);
                            await paymentService.releaseMilestonePayment(m._id);
                            toast.success("Payment released to contractor.");
                            if (id) {
                              await Promise.all([loadMilestones(id), loadEscrow(id)]);
                            }
                          } catch {
                            toast.error("Failed to release payment.");
                          } finally {
                            setUpdatingMilestoneId(null);
                          }
                        }}>
                          {busy ? "..." : "Release Payment"}
                        </Button>
                      )}
                    </div>
                    {m.status === "disputed" && (
                      <div className="mt-2 rounded-md bg-red-50 p-2.5 border border-red-100">
                        <p className="text-xs font-medium text-red-600 mb-0.5">Disputed</p>
                        {m.disputeReason && <p className="text-xs text-red-500">{m.disputeReason}</p>}
                        <p className="text-[11px] text-red-400 mt-1">The contractor has been notified and must restart the work.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Complete Project */}
      {projectContract?.status === "signed" && project?.status === "in_progress" && milestones.length > 0 && milestones.every((m) => m.status === "paid") && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="size-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-emerald-800">All milestones are paid!</p>
          <p className="text-sm text-emerald-700">Mark this project as complete and leave a review for the contractor.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              try {
                await updateProjectStatus(id!, "completed");
                setProject((prev) => prev ? { ...prev, status: "completed" } : prev);
                toast.success("Project marked as completed!");
                setShowReviewForm(true);
              } catch {
                toast.error("Failed to complete project.");
              }
            }}
          >
            Complete Project
          </Button>
        </div>
      )}

      {/* Review Section */}
      {projectContract?.status === "signed" && (
        <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
          <h6 className="mb-4 text-neutral-800">Leave a Review</h6>
          {loadingReview ? (
            <Skeleton variant="text" className="w-full h-20" />
          ) : review ? (
            <div className="space-y-3">
              {(["quality", "communication", "timeliness", "budget"] as const).map((cat) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium capitalize text-neutral-700">{cat}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={18}
                        className={s <= (review.categoryRatings as CategoryRatings)[cat] ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                <span className="w-32 text-sm font-semibold text-neutral-800">Overall</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={s <= Math.round(review.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">({(review.rating ?? 0).toFixed(1)})</span>
              </div>
              {review.comment && (
                <p className="text-sm text-neutral-600 mt-2 italic">"{review.comment}"</p>
              )}
            </div>
          ) : showReviewForm ? (
            <div className="space-y-4">
              {(["quality", "communication", "timeliness", "budget"] as const).map((cat) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium capitalize text-neutral-700">{cat}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setReviewForm((prev) => ({
                            ...prev,
                            categoryRatings: { ...prev.categoryRatings, [cat]: s },
                          }))
                        }
                        className="p-0.5 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={22}
                          className={s <= reviewForm.categoryRatings[cat] ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Textarea
                placeholder="Add a comment (optional)"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" disabled={submittingReview} onClick={() => void handleSubmitReview()}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
                <Button variant="outline" size="sm" disabled={submittingReview} onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setShowReviewForm(true)}>
              Write Review
            </Button>
          )}
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-neutral-800">Received Bids</h6>
            {selectedBidIds.length >= 2 && !bids.some((b) => b.status === "accepted") && (
              <Button size="xs" variant="outline" onClick={() => setShowCompare(true)}>
                Compare {selectedBidIds.length} Bids
              </Button>
            )}
          </div>
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
              const canShortlist = bid.status === "submitted";

              return (
                <div
                  key={bid._id}
                  className={`rounded-xl border p-4 transition-colors ${selectedBidIds.includes(bid._id) ? "border-primary-300 bg-primary-50/30" : "border-neutral-200"}`}
                >
                  {!bids.some((b) => b.status === "accepted") && (
                    <label className="flex items-center gap-2 mb-2 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={selectedBidIds.includes(bid._id)}
                        onChange={() => toggleBidSelect(bid._id)}
                        className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs text-neutral-500">Compare</span>
                    </label>
                  )}
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-neutral-800">
                        {getContractorName(bid)}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Amount: ${bid.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={bidStatusVariant(bid.status)}>{bid.status}</Badge>
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
                    {bid.status === "rejected" && bid.reply?.trim() && (
                      <p>
                        <span className="font-medium">Rejection reason:</span>{" "}
                        {bid.reply}
                      </p>
                    )}
                  </div>

                  {canTakeAction && project?.status === "bidding" && (
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => setAcceptDialogBidId(bid._id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        disabled={isBusy}
                        onClick={() => openRejectDialog(bid._id)}
                      >
                        Reject
                      </Button>
                      {canShortlist && (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => void handleShortlistBid(bid._id)}
                        >
                          {isBusy ? "Processing..." : "Shortlist"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bid Comparison Modal */}
      {showCompare && selectedBidIds.length >= 2 && (() => {
        const compareBids = bids.filter((b) => selectedBidIds.includes(b._id));
        return createPortal(
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
            <button type="button" className="absolute inset-0 bg-neutral-950/55" onClick={() => setShowCompare(false)} aria-label="Close" />
            <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl overflow-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold">Bid Comparison</h5>
                <button type="button" onClick={() => setShowCompare(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareBids.length}, 1fr)` }}>
                {compareBids.map((bid) => (
                  <div key={bid._id} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">{getContractorName(bid)}</p>
                      <Badge variant={bidStatusVariant(bid.status)} className="mt-1">{bid.status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="rounded-lg bg-primary-50 px-3 py-2 text-center">
                        <p className="text-xs text-neutral-500">Bid Amount</p>
                        <p className="text-lg font-bold text-primary-700">${bid.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Est. Start</p>
                        <p className="font-medium text-neutral-800">{bid.estimatedStartDate ? new Date(bid.estimatedStartDate).toLocaleDateString() : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Duration</p>
                        <p className="font-medium text-neutral-800">{bid.estimatedDurationDays ? `${bid.estimatedDurationDays} days` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Message</p>
                        <p className="text-neutral-700 text-xs leading-relaxed line-clamp-4">{bid.message || "No message"}</p>
                      </div>
                    </div>
                    {(bid.status === "submitted" || bid.status === "shortlisted") && project?.status === "bidding" && (
                      <Button size="xs" variant="primary" className="w-full" disabled={Boolean(actingBidId)} onClick={() => setAcceptDialogBidId(bid._id)}>
                        Accept This Bid
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        );
      })()}

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
      <AlertDialog
        open={Boolean(acceptDialogBidId)}
        variant="info"
        title="Accept Bid"
        description="Are you sure you want to accept this bid? All other pending bids will be automatically rejected."
        warningText="This action cannot be undone. The contractor will be notified and a contract will be created."
        confirmLabel="Accept Bid"
        loadingLabel="Accepting..."
        isLoading={Boolean(actingBidId)}
        onConfirm={() => {
          if (acceptDialogBidId) void handleAcceptBid(acceptDialogBidId);
        }}
        onClose={() => setAcceptDialogBidId(null)}
      />
      <AlertDialog
        open={showCancelDialog}
        variant="danger"
        title="Cancel Project"
        description="Are you sure you want to cancel this project?"
        warningText="This will cancel the project. Any pending bids and contracts will no longer be actionable."
        confirmLabel="Cancel Project"
        loadingLabel="Cancelling..."
        isLoading={isCancelling}
        onConfirm={() => void handleCancelProject()}
        onClose={() => setShowCancelDialog(false)}
      />
      {showPaymentForm && id && (
        <PaymentForm
          projectId={id}
          onSuccess={async () => {
            setShowPaymentForm(false);
            toast.success("Project funded successfully!");
            if (id) await loadEscrow(id);
          }}
          onClose={() => setShowPaymentForm(false)}
        />
      )}

      {/* Proof image lightbox */}
      {proofLightbox.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
            onClick={() => setProofLightbox([])}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
              onClick={() => setProofLightbox([])}
            >
              <X size={28} />
            </button>
            {proofLightbox.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProofLightboxIdx((i) => (i - 1 + proofLightbox.length) % proofLightbox.length);
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProofLightboxIdx((i) => (i + 1) % proofLightbox.length);
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <img
              src={proofLightbox[proofLightboxIdx]}
              alt={`Proof ${proofLightboxIdx + 1}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {proofLightboxIdx + 1} / {proofLightbox.length}
            </span>
          </div>,
          document.body,
        )}

      {/* Dispute dialog */}
      {disputeMilestoneId &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setDisputeMilestoneId(null)}>
            <div
              className="w-full max-w-md rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-neutral-100 px-5 py-4">
                <h3 className="text-lg font-semibold text-neutral-800">Dispute Milestone</h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Explain what needs to be fixed. The contractor will be notified.
                </p>
              </div>
              <div className="px-5 py-4">
                <Textarea
                  rows={4}
                  placeholder="Describe the issue with this milestone..."
                  value={disputeMessage}
                  onChange={(e) => setDisputeMessage(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-3">
                <Button size="sm" variant="outline" onClick={() => setDisputeMilestoneId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!disputeMessage.trim() || isDisputing}
                  onClick={() => void handleDisputeMilestone()}
                >
                  {isDisputing ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Project;
