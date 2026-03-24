import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Card } from "@/components/molecules/Card";
import { useRef, useState, useEffect } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import {
  Shield,
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useAuth } from "@/stores/useAuth";
import { contractorService } from "@/api/contractor";
import type { VettingRequestData } from "@/api/contractor";
import { connectService, type ContractorConnectStatus } from "@/api/connect";
import MyMap from "@/components/ui/MyMap";
import { getImageUrl } from "@/lib/utils";
import { portfolioService, type PortfolioItem } from "@/api/portfolio";
import { ImagePlus, Trash2 } from "lucide-react";

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
  status: "pending" | "verified" | "rejected";
  uploadedAt: string;
}

type ServiceAreaPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatRequirement = (value: string) =>
  value
    .split(".")
    .join(" ")
    .split("_")
    .join(" ")
    .trim();

const ContractorProfile = () => {
  const location = useLocation();
  const [basicInfo, setBasicInfo] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    bio: "",
    phone: "",
    city: "",
    state: "",
    yearsOfExperience: "",
    specialties: [] as string[],
  });
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [vettingFiles, setVettingFiles] = useState<UploadedDoc[]>([]);
  const [serviceArea, setServiceArea] = useState<ServiceAreaPolygon | null>(null);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [isSubmittingVetting, setIsSubmittingVetting] = useState(false);
  const [vettingRequest, setVettingRequest] = useState<
    VettingRequestData | null | undefined
  >(undefined);
  const [vettingForm, setVettingForm] = useState({
    licenseNumber: "",
    licenseExpiry: "",
    insuranceProvider: "",
    insuranceExpiry: "",
  });
  const vettingFilesRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    contractorService
      .getVettingStatus()
      .then(setVettingRequest)
      .catch(() => setVettingRequest(null));
  }, []);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isDeleteAvatarDialogOpen, setIsDeleteAvatarDialogOpen] =
    useState(false);
  const [connectStatus, setConnectStatus] =
    useState<ContractorConnectStatus | null>(null);
  const [isLoadingConnectStatus, setIsLoadingConnectStatus] = useState(true);
  const [isLaunchingOnboarding, setIsLaunchingOnboarding] = useState(false);
  const [isOpeningConnectDashboard, setIsOpeningConnectDashboard] =
    useState(false);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: "", description: "" });
  const [portfolioTags, setPortfolioTags] = useState<string[]>([]);
  const [portfolioTagInput, setPortfolioTagInput] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);
  const portfolioFileRef = useRef<HTMLInputElement>(null);

  const loadPortfolio = async () => {
    try {
      setLoadingPortfolio(true);
      const items = await portfolioService.getMyPortfolio();
      setPortfolio(items);
    } catch {
      // ignore
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handlePortfolioImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 6 - portfolioImages.length);
    setPortfolioImages((prev) => [...prev, ...newFiles]);
    setPortfolioPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePortfolioImage = (index: number) => {
    URL.revokeObjectURL(portfolioPreviews[index]);
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
    setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({ title: "", description: "" });
    setPortfolioTags([]);
    setPortfolioTagInput("");
    portfolioPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPortfolioImages([]);
    setPortfolioPreviews([]);
    setShowAddPortfolio(false);
  };

  const handleSavePortfolioItem = async () => {
    if (!portfolioForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (portfolioImages.length === 0) {
      toast.error("At least one image is required");
      return;
    }
    try {
      setIsSavingPortfolio(true);
      const item = await portfolioService.create({
        title: portfolioForm.title,
        description: portfolioForm.description,
        tags: portfolioTags,
        images: portfolioImages,
      });
      setPortfolio((prev) => [item, ...prev]);
      resetPortfolioForm();
      toast.success("Portfolio item added");
    } catch {
      toast.error("Failed to add portfolio item");
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    try {
      setDeletingPortfolioId(id);
      await portfolioService.delete(id);
      setPortfolio((prev) => prev.filter((p) => p._id !== id));
      toast.success("Portfolio item deleted");
    } catch {
      toast.error("Failed to delete portfolio item");
    } finally {
      setDeletingPortfolioId(null);
    }
  };

  const loadConnectStatus = async () => {
    try {
      setIsLoadingConnectStatus(true);
      const status = await connectService.getMyStatus();
      setConnectStatus(status);
    } catch {
      toast.error("Failed to load Stripe payout onboarding status.");
    } finally {
      setIsLoadingConnectStatus(false);
    }
  };

  const handleStartStripeOnboarding = async () => {
    try {
      setIsLaunchingOnboarding(true);
      const data = await connectService.createOnboardingLink();
      window.location.assign(data.url);
    } catch {
      toast.error("Failed to start Stripe onboarding.");
      setIsLaunchingOnboarding(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      setIsOpeningConnectDashboard(true);
      const data = await connectService.createDashboardLink();
      window.location.assign(data.url);
    } catch {
      toast.error("Could not open Stripe Express dashboard.");
    } finally {
      setIsOpeningConnectDashboard(false);
    }
  };
  const processVettingFiles = (files: FileList | null) => {
    if (!files) return;
    const docs: UploadedDoc[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
      status: "pending" as const,
      uploadedAt: new Date().toISOString(),
    }));
    setVettingFiles((prev) => [...prev, ...docs]);
  };

  const removeVettingFile = (id: string) => {
    setVettingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleVettingDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDraggingFiles(false);
    processVettingFiles(e.dataTransfer.files);
  };

  const handleVettingDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDraggingFiles(true);
  };

  const handleVettingDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDraggingFiles(false);
  };

  const { user, updateAvatar, removeAvatar, updateProfile } = useAuth();

  useEffect(() => {
    void loadConnectStatus();
    void loadPortfolio();
  }, []);

  useEffect(() => {
    const stripeParam = new URLSearchParams(location.search).get("stripe");
    if (!stripeParam) return;

    if (stripeParam === "return") {
      toast.success("Stripe onboarding updated. Refreshing status...");
      void loadConnectStatus();
      return;
    }

    if (stripeParam === "refresh") {
      toast.error("Stripe onboarding expired. Please continue setup.");
      void loadConnectStatus();
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    setBasicInfo({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      companyName: user.contractor?.companyName ?? "",
      bio: user.contractor?.bio ?? "",
      phone: user.phone ?? "",
      city: user.address?.city ?? "",
      state: user.address?.state ?? "",
      yearsOfExperience: user.contractor?.experienceYears
        ? String(user.contractor.experienceYears)
        : "",
      specialties: user.contractor?.specialties ?? [],
    });
    console.log(user.contractor?.serviceArea);
    setServiceArea(user.contractor?.serviceArea ?? null);
  }, [user]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      await updateAvatar(selectedFile);
      toast.success("Profile picture updated successfully.");
    } catch {
      toast.error("Failed to update profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.avatar) return;

    try {
      setIsRemovingAvatar(true);
      await removeAvatar();
      setIsDeleteAvatarDialogOpen(false);
      toast.success("Profile picture removed successfully.");
    } catch {
      toast.error("Failed to remove profile picture.");
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleSubmitVetting = async () => {
    const { licenseNumber, licenseExpiry, insuranceProvider, insuranceExpiry } =
      vettingForm;
    if (!licenseNumber || !licenseExpiry || !insuranceProvider || !insuranceExpiry) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (vettingFiles.length === 0) {
      toast.error("Please upload at least one document.");
      return;
    }
    try {
      setIsSubmittingVetting(true);
      await contractorService.submitVettingRequest({
        licenseNumber,
        licenseExpiry,
        insuranceProvider,
        insuranceExpiry,
        files: vettingFiles.map((f) => f.file),
      });
      const updated = await contractorService.getVettingStatus();
      setVettingRequest(updated);
      setVettingFiles([]);
      setVettingForm({
        licenseNumber: "",
        licenseExpiry: "",
        insuranceProvider: "",
        insuranceExpiry: "",
      });
      toast.success("Documents submitted. Awaiting admin review.");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingVetting(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    const parsedExperienceYears = basicInfo.yearsOfExperience.trim()
      ? Number(basicInfo.yearsOfExperience)
      : undefined;
    const parsedSpecialties = basicInfo.specialties;

    if (
      parsedExperienceYears !== undefined &&
      (Number.isNaN(parsedExperienceYears) || parsedExperienceYears < 0)
    ) {
      toast.error("Years of experience must be a valid non-negative number.");
      return;
    }

    try {
      await updateProfile({
        firstName: basicInfo.firstName.trim(),
        lastName: basicInfo.lastName.trim(),
        phoneNumber: basicInfo.phone.trim() || undefined,
        address: {
          city: basicInfo.city.trim() || undefined,
          state: basicInfo.state.trim() || undefined,
        },
        contractor: {
          companyName: basicInfo.companyName.trim() || undefined,
          bio: basicInfo.bio.trim() || undefined,
          experienceYears: parsedExperienceYears,
          specialties: parsedSpecialties,
          serviceArea,
        },
      });
      toast.success("Basic information updated successfully.");
    } catch {
      toast.error("Failed to update basic information.");
    }
  };


  return (
    <div className="p-6">
      <AlertDialog
        open={isDeleteAvatarDialogOpen}
        title="Delete profile picture?"
        description="Removing your profile picture will replace it with your initials across the platform."
        warningText="This action removes your current profile picture immediately and cannot be undone."
        confirmLabel="Delete picture"
        cancelLabel="Keep picture"
        isLoading={isRemovingAvatar}
        onConfirm={handleAvatarRemove}
        onClose={() => setIsDeleteAvatarDialogOpen(false)}
      />
      <div className="flex flex-col gap-1">
        <h3>Contractor Profile</h3>
        <p className="text-neutral-500">
          Manage your profile, license, and insurance documents.
        </p>
      </div>
      <Card className="mt-10 max-w-2xl mx-auto">
        <h6 className="font-semibold">Profile Picture</h6>
        <input
          ref={avatarRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div className="flex items-start gap-4 mt-4">
          <div className="relative size-24 bg-linear-to-br from-primary-500 to-primary-700 rounded-full">
            {user?.avatar ? (
              <img
                src={getImageUrl(user.avatar)}
                alt="Profile Picture"
                className="size-full object-cover rounded-full"
              />
            ) : (
              <div className="size-full flex items-center justify-center cursor-default">
                <span className="text-2xl text-white font-medium">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
            )}
            {user?.role === "contractor" && user?.contractor?.isVerified && (
              <span className="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
                <BadgeCheck className="h-5 w-5 text-green-600" />
              </span>
            )}
            {/* <div className="absolute inset-0 cursor-pointer bg-black/50 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="size-8 text-white" />
            </div> */}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span>
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-sm text-neutral-500">{user?.email}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xs"
                className="mt-2"
                onClick={() => avatarRef.current?.click()}
                disabled={isUploadingAvatar || isRemovingAvatar}
              >
                {isUploadingAvatar ? "Uploading..." : "Change Picture"}
              </Button>
              <Button
                variant="danger"
                size="xs"
                className="mt-2"
                onClick={() => setIsDeleteAvatarDialogOpen(true)}
                disabled={
                  !user?.avatar || isUploadingAvatar || isRemovingAvatar
                }
              >
                {isRemovingAvatar ? "Removing..." : "Remove Picture"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Card className="mt-10 max-w-2xl mx-auto">
        <h6 className="font-medium mb-3">Basic Information</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName">First Name</label>
            <Input
              id="firstName"
              placeholder="ex: John"
              value={basicInfo.firstName}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, firstName: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="lastName">Last Name</label>
            <Input
              id="lastName"
              placeholder="ex: Doe"
              value={basicInfo.lastName}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, lastName: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phone">Phone</label>
            <Input
              id="phone"
              placeholder="ex: +12125551234"
              value={basicInfo.phone}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, phone: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="companyName">Company Name</label>
            <Input
              id="companyName"
              value={basicInfo.companyName}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, companyName: e.target.value})
              }}
            />
          </div>
          <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label htmlFor="specialties">Specialties</label>
            <div className="min-h-10 flex flex-wrap gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 transition-colors focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 focus-within:ring-offset-0">
              {basicInfo.specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-700"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setBasicInfo({
                        ...basicInfo,
                        specialties: basicInfo.specialties.filter((x) => x !== s),
                      })
                    }
                    className="ml-0.5 rounded-full hover:text-primary-900"
                    aria-label={`Remove ${s}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                id="specialties"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = specialtyInput.trim();
                    if (val && !basicInfo.specialties.includes(val)) {
                      setBasicInfo({
                        ...basicInfo,
                        specialties: [...basicInfo.specialties, val],
                      });
                    }
                    setSpecialtyInput("");
                  } else if (
                    e.key === "Backspace" &&
                    !specialtyInput &&
                    basicInfo.specialties.length > 0
                  ) {
                    setBasicInfo({
                      ...basicInfo,
                      specialties: basicInfo.specialties.slice(0, -1),
                    });
                  }
                }}
                placeholder={basicInfo.specialties.length === 0 ? "Type and press Enter..." : ""}
                className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label htmlFor="years">Years of Experience</label>
            <Input
              id="years"
              type="number"
              min={0}
              value={basicInfo.yearsOfExperience}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, yearsOfExperience: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label htmlFor="bio">Bio</label>
            <Textarea
              id="bio"
              rows={4}
              maxLength={200}
              value={basicInfo.bio}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, bio: e.target.value })
              }
            />
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 h-px bg-neutral-200 my-5" />
        <h6 className="font-medium mb-3">Service Area</h6>
        <MyMap value={serviceArea} onChange={setServiceArea} />
        <div className="flex justify-end mt-4">
          <Button variant="primary" size="sm" onClick={handleSaveBasicInfo}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="mt-10 max-w-2xl mx-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h6 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="text-primary-500" />
              Stripe Payout Onboarding
            </h6>
            <p className="text-sm text-muted-foreground">
              Complete Stripe Express onboarding for KYC verification and payout
              routing to your bank account.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={isLoadingConnectStatus}
            onClick={() => void loadConnectStatus()}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>

        {isLoadingConnectStatus ? (
          <p className="text-sm text-muted-foreground">Loading Stripe status...</p>
        ) : connectStatus?.onboardingComplete ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Payouts Enabled</p>
                <p className="text-sm mt-1">
                  Your Stripe account is ready. KYC is completed and payout routing
                  is active.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="text-neutral-500">Details Submitted</p>
                <p className="font-semibold text-neutral-800">
                  {connectStatus.detailsSubmitted ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="text-neutral-500">Charges Enabled</p>
                <p className="font-semibold text-neutral-800">
                  {connectStatus.chargesEnabled ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="text-neutral-500">Payouts Enabled</p>
                <p className="font-semibold text-neutral-800">
                  {connectStatus.payoutsEnabled ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isOpeningConnectDashboard}
                onClick={() => void handleOpenStripeDashboard()}
              >
                <ExternalLink className="size-4" />
                {isOpeningConnectDashboard
                  ? "Opening..."
                  : "Open Stripe Dashboard"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Onboarding Incomplete</p>
                <p className="text-sm mt-1">
                  You must finish Stripe onboarding before receiving payouts.
                </p>
              </div>
            </div>

            {connectStatus?.requirements.currentlyDue.length ? (
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="text-sm font-medium text-neutral-800 mb-2">
                  Information still required by Stripe
                </p>
                <ul className="space-y-1 text-sm text-neutral-600">
                  {connectStatus.requirements.currentlyDue.map((item) => (
                    <li key={item}>• {formatRequirement(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={isLaunchingOnboarding}
                onClick={() => void handleStartStripeOnboarding()}
              >
                {isLaunchingOnboarding
                  ? "Redirecting..."
                  : connectStatus?.accountId
                    ? "Continue Stripe Onboarding"
                    : "Start Stripe Onboarding"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Portfolio ──────────────────────────────────────────────── */}
      <Card className="mt-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h6 className="font-medium flex items-center gap-2">
            <ImagePlus className="text-primary-500" size={18} />
            Portfolio
          </h6>
          {!showAddPortfolio && (
            <Button variant="primary" size="xs" onClick={() => setShowAddPortfolio(true)}>
              Add Project
            </Button>
          )}
        </div>

        {showAddPortfolio && (
          <div className="rounded-xl border border-neutral-200 p-4 mb-4 space-y-3">
            <Input
              placeholder="Project title"
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              rows={2}
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
            />

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors">
              {portfolioTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-100 text-primary-700 px-2.5 py-0.5 text-xs font-medium">
                  {tag}
                  <button type="button" onClick={() => setPortfolioTags((t) => t.filter((x) => x !== tag))} className="hover:text-primary-900">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-1"
                placeholder="Add tag + Enter"
                value={portfolioTagInput}
                onChange={(e) => setPortfolioTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && portfolioTagInput.trim()) {
                    e.preventDefault();
                    const val = portfolioTagInput.trim();
                    if (!portfolioTags.includes(val)) setPortfolioTags((t) => [...t, val]);
                    setPortfolioTagInput("");
                  }
                  if (e.key === "Backspace" && !portfolioTagInput && portfolioTags.length > 0) {
                    setPortfolioTags((t) => t.slice(0, -1));
                  }
                }}
              />
            </div>

            {/* Image upload */}
            <input
              ref={portfolioFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePortfolioImages(e.target.files)}
            />
            <button
              type="button"
              onClick={() => portfolioFileRef.current?.click()}
              className="flex w-full flex-col items-center gap-1 cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center hover:border-primary-500/50 hover:bg-primary-50/30 transition-colors"
            >
              <Upload className="h-6 w-6 text-neutral-400" />
              <p className="text-sm text-neutral-600">Click to upload images (max 6)</p>
            </button>

            {portfolioPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {portfolioPreviews.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(i)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="xs" onClick={resetPortfolioForm} disabled={isSavingPortfolio}>
                Cancel
              </Button>
              <Button variant="primary" size="xs" onClick={() => void handleSavePortfolioItem()} disabled={isSavingPortfolio}>
                {isSavingPortfolio ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {loadingPortfolio ? (
          <p className="text-sm text-neutral-500">Loading portfolio...</p>
        ) : portfolio.length === 0 && !showAddPortfolio ? (
          <p className="text-sm text-neutral-500">No portfolio items yet. Add your first project to showcase your work.</p>
        ) : (
          <div className="space-y-4">
            {portfolio.map((item) => (
              <div key={item._id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h6 className="font-medium text-sm">{item.title}</h6>
                    {item.description && (
                      <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeletePortfolioItem(item._id)}
                    disabled={deletingPortfolioId === item._id}
                    className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {item.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {item.images.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden aspect-square">
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-neutral-100 text-neutral-600 px-2.5 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-10 max-w-2xl mx-auto">
        <div className="mb-6">
          <h6 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="text-primary-500" />
            License and Insurance Verification
          </h6>
          <p className="text-sm text-muted-foreground">
            Submit your contractor license and proof of insurance for
            verification. Once submitted, your request will be reviewed by an
            admin. You will be notified of the outcome.
          </p>
        </div>

        {/* Loading */}
        {vettingRequest === undefined && (
          <p className="text-sm text-muted-foreground py-4">
            Loading verification status...
          </p>
        )}

        {/* Pending banner */}
        {vettingRequest?.status === "pending" && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Under Review</p>
              <p className="text-sm mt-1">
                Your documents were submitted on{" "}
                {new Date(vettingRequest.submittedAt).toLocaleDateString()}.
                An admin will review them shortly. You cannot resubmit while a
                review is in progress.
              </p>
            </div>
          </div>
        )}

        {/* Approved banner */}
        {vettingRequest?.status === "approved" && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Verified</p>
              <p className="text-sm mt-1">
                Your contractor profile has been verified. You can now bid on
                projects that require verified status. Thank you for providing the
                necessary documentation!
              </p>
            </div>
          </div>
        )}

        {/* Rejected / More info needed banner */}
        {(vettingRequest?.status === "rejected" ||
          vettingRequest?.status === "more_info_needed") && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                {vettingRequest.status === "rejected"
                  ? "Request Rejected"
                  : "More Information Needed"}
              </p>
              {vettingRequest.adminNotes && (
                <p className="text-sm mt-1 font-medium">
                  Admin note: {vettingRequest.adminNotes}
                </p>
              )}
              <p className="text-sm mt-1">
                Please update your information below and resubmit.
              </p>
            </div>
          </div>
        )}

        {/* Submission form — shown only when no pending/approved request */}
        {(vettingRequest === null ||
          vettingRequest?.status === "rejected" ||
          vettingRequest?.status === "more_info_needed") && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="licenseNumber" className="text-sm font-medium">
                  License Number <span className="text-destructive">*</span>
                </label>
                <Input
                  id="licenseNumber"
                  placeholder="ex: LIC-12345"
                  value={vettingForm.licenseNumber}
                  onChange={(e) =>
                    setVettingForm({ ...vettingForm, licenseNumber: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="licenseExpiry" className="text-sm font-medium">
                  License Expiry <span className="text-destructive">*</span>
                </label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={vettingForm.licenseExpiry}
                  onChange={(e) =>
                    setVettingForm({ ...vettingForm, licenseExpiry: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="insuranceProvider" className="text-sm font-medium">
                  Insurance Provider <span className="text-destructive">*</span>
                </label>
                <Input
                  id="insuranceProvider"
                  placeholder="ex: State Farm"
                  value={vettingForm.insuranceProvider}
                  onChange={(e) =>
                    setVettingForm({ ...vettingForm, insuranceProvider: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="insuranceExpiry" className="text-sm font-medium">
                  Insurance Expiry <span className="text-destructive">*</span>
                </label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={vettingForm.insuranceExpiry}
                  onChange={(e) =>
                    setVettingForm({ ...vettingForm, insuranceExpiry: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Supporting Documents{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (license &amp; insurance files)
                </span>{" "}
                <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => vettingFilesRef.current?.click()}
                onDragOver={handleVettingDragOver}
                onDragLeave={handleVettingDragLeave}
                onDrop={handleVettingDrop}
                className={`flex w-full flex-col items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  draggingFiles
                    ? "border-primary-500 bg-primary-500/5"
                    : "border-neutral-300 hover:border-primary-600/50 hover:bg-muted-500/50"
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </button>
              <input
                ref={vettingFilesRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => processVettingFiles(e.target.files)}
              />
              {vettingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {vettingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-50">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeVettingFile(file.id)}
                        className="cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitVetting}
                disabled={isSubmittingVetting}
              >
                {isSubmittingVetting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ContractorProfile;
