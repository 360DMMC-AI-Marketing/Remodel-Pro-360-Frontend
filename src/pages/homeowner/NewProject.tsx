import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/molecules/Card";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  MapPin,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createProject } from "@/api/project";
import { designService, type DesignSession } from "@/api/design";
import { reverseGeocode } from "@/api/geolocation";
import LocationPickerMap from "@/components/ui/LocationPickerMap";

const STEPS = [
  "Room Type",
  "Photos and Design",
  "Details",
  "Budget & Timeline",
  "Review",
];

const BUDGET_RANGES = [
  { label: "Under $10k", min: 0, max: 10000 },
  { label: "$10k - $25k", min: 10000, max: 25000 },
  { label: "$25k - $50k", min: 25000, max: 50000 },
  { label: "$50k - $100k", min: 50000, max: 100000 },
  { label: "$100k+", min: 100000, max: 999999 },
];

const ROOM_TYPES = [
  { value: "kitchen", label: "Kitchen", icon: "🍳" },
  { value: "bathroom", label: "Bathroom", icon: "🚿" },
  { value: "living_room", label: "Living Room", icon: "🛋️" },
  { value: "bedroom", label: "Bedroom", icon: "🛏️" },
  { value: "exterior", label: "Exterior", icon: "🏠" },
];

// Design styles for label display
const STYLE_LABELS: Record<string, string> = {
  modern: "Modern", farmhouse: "Farmhouse", scandinavian: "Scandinavian",
  industrial: "Industrial", coastal: "Coastal", minimalist: "Minimalist",
  bohemian: "Bohemian", "mid-century": "Mid-Century", traditional: "Traditional", japandi: "Japandi",
};

interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
}

interface ProjectFormData {
  roomType: string;
  title: string;
  description: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  customBudget?: number;
  startDate?: Date;
  attachedDesignId: string | null;
  images: UploadedPhoto[];
}

const NewProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Completed designs for attachment
  const [designs, setDesigns] = useState<DesignSession[]>([]);
  useEffect(() => {
    designService.getMyDesigns(1, 50).then((res) => {
      setDesigns(res.data.filter((d) => d.status === "completed" && d.generatedImages?.length));
    }).catch(() => {});
  }, []);
  const [form, setForm] = useState<ProjectFormData>({
    roomType: "",
    title: "",
    description: "",
    address: undefined,
    budgetRange: undefined,
    customBudget: undefined,
    startDate: undefined,
    attachedDesignId: null,
    images: [],
  });

  const update = (patch: Partial<ProjectFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleLocationChange = async (coordinates: [number, number] | null) => {
    if (!coordinates) {
      // Location cleared
      update({
        address: {
          street: form.address?.street || "",
          city: form.address?.city || "",
          state: form.address?.state || "",
          zipCode: form.address?.zipCode || "",
          coordinates: undefined,
        },
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const addressData = await reverseGeocode(coordinates[0], coordinates[1]);
      if (addressData) {
        update({
          address: {
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            coordinates: { type: "Point", coordinates },
          },
        });
        toast.success("Address auto-filled from location");
      } else {
        // Still update coordinates even if geocoding fails
        update({
          address: {
            street: form.address?.street || "",
            city: form.address?.city || "",
            state: form.address?.state || "",
            zipCode: form.address?.zipCode || "",
            coordinates: { type: "Point", coordinates },
          },
        });
        toast.info("Could not auto-fill address. Please fill in manually.");
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      // Still update coordinates even if there's an error
      update({
        address: {
          street: form.address?.street || "",
          city: form.address?.city || "",
          state: form.address?.state || "",
          zipCode: form.address?.zipCode || "",
          coordinates: { type: "Point", coordinates },
        },
      });
      toast.error("Error auto-filling address. Please fill in manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.roomType;
    if (step === 1) return form.images.length > 0 || !!form.attachedDesignId;
    if (step === 2)
      return (
        form.title.trim().length >= 3 &&
        form.description.trim().length >= 10 &&
        !!form.address?.street.trim() &&
        !!form.address?.city.trim() &&
        !!form.address?.state.trim() &&
        !!form.address?.zipCode.trim() &&
        !!form.address?.coordinates?.coordinates?.length
      );
    if (step === 3)
      return (!!form.budgetRange || !!form.customBudget) && !!form.startDate;
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: UploadedPhoto[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    update({
      images: [...form.images, ...newPhotos],
      attachedDesignId: null, // clear design if uploading photos
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    const photo = form.images.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.preview);
    update({ images: form.images.filter((p) => p.id !== id) });
  };

  const selectedBudget = form.budgetRange;
  const selectedRoom = ROOM_TYPES.find((r) => r.value === form.roomType);
  const attachedDesign = form.attachedDesignId
    ? designs.find((d) => d._id === form.attachedDesignId) ?? null
    : null;

  const handleSubmit = async () => {
    setSubmitting(true);
    console.log("Submitting project with data:", form);
    try {
      await createProject(form, { saveAsDraft: false });
      toast.success("Project created successfully!");
      navigate("/homeowner/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error 
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create project. Please try again.")
          : "Failed to create project. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await createProject(form, { saveAsDraft: true });
      toast.success("Draft saved.");
      navigate("/homeowner/projects");
    } catch {
      toast.error("Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="p-6">
      <Link to="/homeowner/projects">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Projects
        </Button>
      </Link>
      <div className="mt-10">
        <div className="max-w-2xl mx-auto">
          <div>
            <h4>Create New Project</h4>
            <p className="text-neutral-500 text-sm mt-2">
              Tell us about your renovation in a few steps
            </p>
          </div>
          <div className="my-6 sm:my-8 flex items-center gap-0.5 sm:gap-1">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      "mx-auto flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold cursor-default transition-colors",
                      i < step &&
                        "bg-linear-to-br from-primary-500 to-primary-800 text-white",
                      i === step &&
                        "border-2 border-primary-500 text-primary-500",
                      i > step && "border border-neutral-400 text-neutral-400",
                    )}
                  >
                    {i < step ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs text-center leading-tight",
                    i <= step
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Card className="mt-10">
            {step === 0 && (
              <div>
                <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                  What type of room?
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Select the space you want to renovate
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ROOM_TYPES.map((room) => (
                    <button
                      key={room.value}
                      onClick={() =>
                        update({ roomType: room.value, attachedDesignId: null })
                      }
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-sm",
                        form.roomType === room.value
                          ? "border-primary-600 bg-primary-600/5 shadow-sm"
                          : "border-neutral-300 hover:border-primary-700/30",
                      )}
                    >
                      <span className="text-3xl">{room.icon}</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          form.roomType === room.value
                            ? "text-primary-600"
                            : "text-neutral-800",
                        )}
                      >
                        {room.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                  Add Photos or a Design
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Upload at least one photo of your space
                </p>

                {/* Upload photos section */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium">
                    Upload Photos
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!form.attachedDesignId}
                    onDragOver={(e) => {
                      if (!form.attachedDesignId) {
                        e.preventDefault();
                        e.currentTarget.setAttribute("data-dragging", "true");
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.removeAttribute("data-dragging");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.removeAttribute("data-dragging");
                      if (form.attachedDesignId) return;
                      const files = Array.from(e.dataTransfer.files).filter(
                        (f) => f.type.startsWith("image/"),
                      );
                      if (!files.length) return;
                      const newPhotos: UploadedPhoto[] = files.map((file) => ({
                        id: crypto.randomUUID(),
                        file,
                        preview: URL.createObjectURL(file),
                      }));
                      update({
                        images: [...form.images, ...newPhotos],
                        attachedDesignId: null,
                      });
                    }}
                    className={cn(
                      "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-all",
                      form.attachedDesignId
                        ? "cursor-not-allowed border-border/50 opacity-50"
                        : "border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/10",
                    )}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Click or drop to upload photos of your space
                    </span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG up to 10MB each
                    </span>
                  </button>

                  {/* Uploaded photos grid */}
                  {form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {form.images.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                        >
                          <img
                            src={photo.preview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="cursor-pointer absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5 text-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Or attach a design */}
                {designs.length > 0 && (
                  <div>
                    <div className="relative mb-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Or attach a design</span></div>
                    </div>

                    {form.attachedDesignId ? (
                      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                        {attachedDesign?.generatedImages?.[0]?.signedUrl && (
                          <img src={attachedDesign.generatedImages[0].signedUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {STYLE_LABELS[attachedDesign?.style?.id ?? ""] ?? attachedDesign?.style?.id ?? "Design"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attachedDesign ? new Date(attachedDesign.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => update({ attachedDesignId: null })}
                          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                        {designs.map((d) => {
                          const thumb = d.generatedImages?.[0]?.signedUrl;
                          const label = STYLE_LABELS[d.style?.id ?? ""] ?? d.style?.id ?? "";
                          return (
                            <button
                              key={d._id}
                              type="button"
                              onClick={() => update({ attachedDesignId: d._id, images: [] })}
                              className="group rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors"
                              disabled={form.images.length > 0}
                            >
                              {thumb ? (
                                <img src={thumb} alt={label} className="w-full aspect-square object-cover" />
                              ) : (
                                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <p className="px-1.5 py-1 text-[10px] text-muted-foreground truncate">{label}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {form.images.length > 0 && !form.attachedDesignId && (
                      <p className="text-[10px] text-muted-foreground mt-1">Remove uploaded photos to attach a design instead</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                  Project Details
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Describe what you'd like done
                </p>
                <div>
                  <label htmlFor="title">Project Title</label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder={`e.g. Modern ${selectedRoom?.label || "Room"} Remodel`}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="desc">Description</label>
                  <Textarea
                    id="desc"
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Describe your vision, materials, and any specific requirements..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 mb-2">
                    <MapPin size={18} />
                    Address
                  </label>
                  <div className="space-y-3">
                    <Input
                      id="street"
                      value={form.address?.street || ""}
                      onChange={(e) => update({ 
                        address: { 
                          ...form.address, 
                          street: e.target.value,
                          city: form.address?.city || "",
                          state: form.address?.state || "",
                          zipCode: form.address?.zipCode || "",
                          coordinates: form.address?.coordinates,
                        }
                      })}
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="city"
                        value={form.address?.city || ""}
                        onChange={(e) => update({ 
                          address: { 
                            ...form.address, 
                            street: form.address?.street || "",
                            city: e.target.value,
                            state: form.address?.state || "",
                            zipCode: form.address?.zipCode || "",
                            coordinates: form.address?.coordinates,
                          }
                        })}
                        placeholder="City"
                      />
                      <Input
                        id="state"
                        value={form.address?.state || ""}
                        onChange={(e) => update({ 
                          address: { 
                            ...form.address, 
                            street: form.address?.street || "",
                            city: form.address?.city || "",
                            state: e.target.value,
                            zipCode: form.address?.zipCode || "",
                            coordinates: form.address?.coordinates,
                          }
                        })}
                        placeholder="State"
                      />
                    </div>
                    <Input
                      id="zipCode"
                      value={form.address?.zipCode || ""}
                      onChange={(e) => update({ 
                        address: { 
                          ...form.address, 
                          street: form.address?.street || "",
                          city: form.address?.city || "",
                          state: form.address?.state || "",
                          zipCode: e.target.value,
                          coordinates: form.address?.coordinates,
                        }
                      })}
                      placeholder="Zip code"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 mb-2">
                    <MapPin size={18} />
                    Project Location
                  </label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {isGeocoding
                      ? "Finding address information..."
                      : "Click on the map to pin the exact location. Address fields will auto-fill."}
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <LocationPickerMap
                      value={form.address?.coordinates?.coordinates ?? null}
                      onChange={handleLocationChange}
                    />
                  </div>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                  Budget & Timeline
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Set your budget range and preferred start date
                </p>

                <label className="mb-3 block">Budget Range</label>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BUDGET_RANGES.map((range) => {
                    const isSelected = form.budgetRange?.min === range.min && form.budgetRange?.max === range.max;
                    return (
                      <button
                        key={range.label}
                        onClick={() => update({ budgetRange: { min: range.min, max: range.max }, customBudget: undefined })}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all hover:shadow-sm",
                          isSelected
                            ? "border-primary-600 bg-primary-600/10 text-primary"
                            : "border-neutral-300 text-neutral-800 hover:border-primary-600/40",
                        )}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mb-6">
                  <label htmlFor="customBudget">Or enter exact amount</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="customBudget"
                      type="number"
                      value={form.customBudget || ""}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        update({ customBudget: value, budgetRange: undefined });
                      }}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="startDate">
                    Preferred Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate ? form.startDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => {
                      const value = e.target.value ? new Date(e.target.value) : undefined;
                      update({ startDate: value });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
                  Review Your Project
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Make sure everything looks good before submitting
                </p>

                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedRoom?.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Room Type</p>
                      <p className="font-medium text-foreground">
                        {selectedRoom?.label}
                      </p>
                    </div>
                  </div>

                  {/* Photos / Design summary */}
                  {(form.images.length > 0 || attachedDesign) && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        {attachedDesign ? "Attached Design" : "Uploaded Photos"}
                      </p>
                      {attachedDesign ? (
                        <div className="flex items-center gap-2">
                          {attachedDesign.generatedImages?.[0]?.signedUrl ? (
                            <img src={attachedDesign.generatedImages[0].signedUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <span className="text-sm font-medium capitalize text-foreground">
                            {STYLE_LABELS[attachedDesign.style?.id ?? ""] ?? attachedDesign.style?.id ?? "Design"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {form.images.slice(0, 4).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.preview}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border border-border"
                            />
                          ))}
                          {form.images.length > 4 && (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                              +{form.images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium text-foreground">{form.title}</p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">
                      {form.description}
                    </p>
                  </div>
                  {form.address && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm text-foreground">
                        {form.address.street && `${form.address.street}, `}
                        {form.address.city && `${form.address.city}, `}
                        {form.address.state && `${form.address.state} `}
                        {form.address.zipCode}
                      </p>
                    </div>
                  )}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium text-foreground">
                      {form.customBudget
                        ? `$${form.customBudget.toLocaleString()}`
                        : selectedBudget
                        ? `$${selectedBudget.min.toLocaleString()} - $${selectedBudget.max.toLocaleString()}`
                        : "Not specified"}
                    </p>
                  </div>
                  {form.startDate && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        Preferred Start Date
                      </p>
                      <p className="text-sm text-foreground">
                        {form.startDate.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                size="sm"
                className="flex items-center gap-2"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={18} />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={savingDraft || submitting}
                onClick={() => void handleSaveDraft()}
              >
                {savingDraft ? "Saving..." : "Save as Draft"}
              </Button>
            </div>
            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Project"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProject;
