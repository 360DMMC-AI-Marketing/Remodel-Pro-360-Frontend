import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { HomeownerProject } from "@/types/project";
import { deleteProject, getProjectById, updateProject, updateProjectStatus } from "@/api/porject";
import { bidService, type HomeownerBid } from "@/api/bid";
import { contractService, type ContractRecord } from "@/api/contract";
import { ArrowLeft, ChevronLeft, ChevronRight, Edit3, MoreHorizontal, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Textarea } from "@/components/atoms/Textarea";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { AlertDialog } from "@/components/ui/alert-dialog";

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

  useEffect(() => {
    const fetchProject = async () => {
        setLoading(true);
      try {
        const data = await getProjectById(id!);
        setProject(data.project);
        await Promise.all([loadBids(id!), loadContract(id!)]);
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
                <Badge variant="primary">{project?.status}</Badge>
              </span>
            </div>
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
              Status: <span className="font-semibold capitalize">{projectContract.status.split("_").join(" ")}</span>
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
            </div>
          </div>
        )}
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
              const canShortlist = bid.status === "submitted";

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
                        onClick={() => void handleAcceptBid(bid._id)}
                      >
                        {isBusy ? "Processing..." : "Accept"}
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
