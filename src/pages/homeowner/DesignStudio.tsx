import { useEffect, useState, useRef, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Paintbrush,
  Clock,
  Trash2,
  Heart,
  Share2,
  Link2,
  Check,
  Paperclip,
  Star,
  Send,
  SplitSquareHorizontal,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { designService, type DesignSession } from "@/api/design";
import { getProjects } from "@/api/project";

import imgModern from "@/assets/room-styles/modern.png";
import imgFarmhouse from "@/assets/room-styles/farmhouse.png";
import imgScandinavian from "@/assets/room-styles/scandinavian.png";
import imgIndustrial from "@/assets/room-styles/industrial.png";
import imgCoastal from "@/assets/room-styles/coastal.png";
import imgMinimalist from "@/assets/room-styles/minimalist.png";
import imgBohemian from "@/assets/room-styles/bohemian.png";
import imgMidCentury from "@/assets/room-styles/mid-century.png";
import imgTraditional from "@/assets/room-styles/traditional.png";
import imgJapandi from "@/assets/room-styles/japandi.png";

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

const DESIGN_STYLES = [
  { id: "modern", label: "Modern", desc: "Clean lines, neutral tones, sleek furniture", img: imgModern },
  { id: "farmhouse", label: "Farmhouse", desc: "Warm wood, shiplap, rustic charm", img: imgFarmhouse },
  { id: "scandinavian", label: "Scandinavian", desc: "Bright, airy, light wood, cozy textiles", img: imgScandinavian },
  { id: "industrial", label: "Industrial", desc: "Exposed brick, metal, urban loft feel", img: imgIndustrial },
  { id: "coastal", label: "Coastal", desc: "Ocean blues, sandy tones, rattan accents", img: imgCoastal },
  { id: "minimalist", label: "Minimalist", desc: "Essentials only, uncluttered, serene", img: imgMinimalist },
  { id: "bohemian", label: "Bohemian", desc: "Eclectic, layered patterns, global vibes", img: imgBohemian },
  { id: "mid-century", label: "Mid-Century", desc: "Retro shapes, teak wood, bold accents", img: imgMidCentury },
  { id: "traditional", label: "Traditional", desc: "Rich fabrics, molding, refined elegance", img: imgTraditional },
  { id: "japandi", label: "Japandi", desc: "Japanese minimalism meets Nordic warmth", img: imgJapandi },
];

const DesignStudio = () => {
  // Left panel state
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [roomType, setRoomType] = useState("");
  const [designStyle, setDesignStyle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [roomLength, setRoomLength] = useState("");
  const [roomWidth, setRoomWidth] = useState("");
  const [roomHeight, setRoomHeight] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Middle panel state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"original" | "generated" | "history" | "favorites">("original");

  // Generated results from current batch
  const [currentSessions, setCurrentSessions] = useState<DesignSession[]>([]);

  // History
  const [history, setHistory] = useState<DesignSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<DesignSession[]>([]);

  // Projects (for attach dropdown)
  const [projects, setProjects] = useState<{ _id: string; title: string }[]>([]);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  // Share
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Selected design (only this one can be shared/attached/favorited)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Refinement prompt for iterating on generated designs
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection in history
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Close attach menu on outside click
  useEffect(() => {
    if (!attachingId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-attach-menu]")) setAttachingId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [attachingId]);

  // Compare mode: side-by-side vs slider
  const [compareMode, setCompareMode] = useState<"side" | "slider">("side");
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeVariationIdx, setActiveVariationIdx] = useState(0);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await designService.getMyDesigns(1, 20);
      setHistory(res.data);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await designService.getFavorites(1, 100);
      setFavorites(res.data);
      setFavoriteIds(new Set(res.data.map((d) => d._id)));
    } catch {
      // silent
    }
  };

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.projects ?? res.data ?? []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadHistory();
    loadFavorites();
    loadProjects();
  }, []);

  // ── Carousel scroll helpers ──
  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const amount = 280;
    carouselRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const selectStyle = (id: string) => {
    setDesignStyle((prev) => (prev === id ? "" : id));
  };

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).slice(0, 5 - uploadedImages.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Generate one design, append to existing results ──
  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one room photo.");
      return;
    }
    if (!roomType) {
      toast.error("Please select a room type.");
      return;
    }
    if (!designStyle) {
      toast.error("Please select a design style.");
      return;
    }

    setIsGenerating(true);
    setActiveTab("generated");

    try {
      const dims = roomLength && roomWidth && roomHeight
        ? { length: Number(roomLength), width: Number(roomWidth), height: Number(roomHeight) }
        : undefined;

      const queued = await designService.generate(
        uploadedImages[0].file,
        roomType,
        designStyle,
        prompt || undefined,
        undefined,
        dims,
      );

      // Append a placeholder session
      const localSession: DesignSession = {
        ...queued,
        style: { id: designStyle, prompt: prompt || undefined },
        roomPhoto: { url: "", uploadedAt: new Date().toISOString() },
        generatedImages: [],
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentSessions((prev) => [...prev, localSession]);

      // Poll until done, updating this session in place
      const completed = await designService.pollUntilDone(queued._id, (update) => {
        setCurrentSessions((prev) =>
          prev.map((s) => (s._id === queued._id ? { ...s, ...update, style: { id: designStyle } } : s)),
        );
      });

      setCurrentSessions((prev) =>
        prev.map((s) => (s._id === queued._id ? { ...s, ...completed, style: { id: designStyle } } : s)),
      );

      // Reset style so user can pick another one right away
      setDesignStyle("");

      if (completed.status === "completed") {
        toast.success(`Design generated in ${((completed.processingTimeMs ?? 0) / 1000).toFixed(1)}s!`);
        loadHistory();
      } else {
        toast.error(completed.errorMessage || "Generation failed");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Generation failed";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Refine: generate a new variation with a modification prompt ──
  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      toast.error("Please describe what you'd like to change.");
      return;
    }
    if (uploadedImages.length === 0 || !roomType) return;

    const baseStyle = currentSessions[0]?.style?.id || designStyle;
    if (!baseStyle) {
      toast.error("No base style found. Generate an initial design first.");
      return;
    }

    setIsRefining(true);

    try {
      const dims = roomLength && roomWidth && roomHeight
        ? { length: Number(roomLength), width: Number(roomWidth), height: Number(roomHeight) }
        : undefined;

      const queued = await designService.generate(
        uploadedImages[0].file,
        roomType,
        baseStyle,
        refinementPrompt,
        undefined,
        dims,
      );

      const localSession: DesignSession = {
        ...queued,
        style: { id: baseStyle, prompt: refinementPrompt },
        roomPhoto: { url: "", uploadedAt: new Date().toISOString() },
        generatedImages: [],
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentSessions((prev) => [...prev, localSession]);

      const completed = await designService.pollUntilDone(queued._id, (update) => {
        setCurrentSessions((prev) =>
          prev.map((s) => (s._id === queued._id ? { ...s, ...update, style: { id: baseStyle, prompt: refinementPrompt } } : s)),
        );
      });

      setCurrentSessions((prev) =>
        prev.map((s) => (s._id === queued._id ? { ...s, ...completed, style: { id: baseStyle, prompt: refinementPrompt } } : s)),
      );

      setRefinementPrompt("");

      if (completed.status === "completed") {
        toast.success("Variation generated!");
        loadHistory();
      } else {
        toast.error(completed.errorMessage || "Generation failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Generation failed");
    } finally {
      setIsRefining(false);
    }
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await Promise.all(deleteTarget.ids.map((id) => designService.deleteDesign(id)));
      setHistory((prev) => prev.filter((s) => !deleteTarget.ids.includes(s._id)));
      setCurrentSessions((prev) => prev.filter((s) => !deleteTarget.ids.includes(s._id)));
      if (selectedSessionId && deleteTarget.ids.includes(selectedSessionId)) setSelectedSessionId(null);
      setBulkSelected(new Set());
      toast.success(deleteTarget.ids.length > 1 ? `${deleteTarget.ids.length} designs deleted.` : "Design deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, selectedSessionId]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const { favorited } = await designService.toggleFavorite(id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (favorited) next.add(id);
        else next.delete(id);
        return next;
      });
      toast.success(favorited ? "Added to favorites" : "Removed from favorites");
      loadFavorites();
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const handleShare = async (id: string) => {
    try {
      const token = await designService.generateShareLink(id);
      const url = `${window.location.origin}/designs/shared/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedShareId(id);
      setTimeout(() => setCopiedShareId(null), 2000);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  const handleAttach = async (designId: string, projectId: string) => {
    try {
      await designService.attachToProject(designId, projectId);
      toast.success("Design attached to project");
      setAttachingId(null);
    } catch {
      toast.error("Failed to attach design");
    }
  };

  const allGeneratedImages = currentSessions.flatMap((s) => s.generatedImages ?? []);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 gap-0">
      {/* ── Left Panel: Input Controls ── */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-primary-500" />
              Design Studio
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Upload your room photos and generate AI-powered redesign concepts.</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">Room Photos</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <Upload size={24} className="mx-auto text-neutral-400 mb-1" />
              <p className="text-xs text-neutral-500">Click to upload (max 5)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200">
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Type */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              <Layers size={14} className="inline mr-1" />
              Room Type
            </label>
            <div className="relative">
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="">Select room type...</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Room Dimensions */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Room Dimensions <span className="text-neutral-400 font-normal">(ft)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 mb-0.5 block">Length</label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={roomLength}
                  onChange={(e) => setRoomLength(e.target.value)}
                  placeholder="12"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 mb-0.5 block">Width</label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(e.target.value)}
                  placeholder="10"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 mb-0.5 block">Height</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={roomHeight}
                  onChange={(e) => setRoomHeight(e.target.value)}
                  placeholder="9"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* ── Style Selector: Horizontal Carousel ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                <Paintbrush size={14} />
                Design Style
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  className="p-1 rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  className="p-1 rounded-md border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 mb-2">Pick a style, generate, then pick another to add more</p>
            <div
              ref={carouselRef}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300"
              style={{ scrollbarWidth: "thin" }}
            >
              {DESIGN_STYLES.map((style) => {
                const isSelected = designStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => selectStyle(style.id)}
                    className={`shrink-0 w-48 rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected
                        ? "border-primary-500 shadow-md shadow-primary-100"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {/* Style preview image */}
                    <div className="relative h-28">
                      <img
                        src={style.img}
                        alt={style.label}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className={`px-3 py-2 text-left ${isSelected ? "bg-primary-50" : "bg-white"}`}>
                      <span className={`text-xs font-semibold ${isSelected ? "text-primary-700" : "text-neutral-700"}`}>
                        {style.label}
                      </span>
                      <p className={`text-[10px] mt-0.5 leading-tight ${isSelected ? "text-primary-500" : "text-neutral-400"}`}>
                        {style.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">Custom Instructions</label>
            <Textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Keep the window layout, add an island with seating, use warm wood tones..."
              className="text-sm"
            />
          </div>

          {/* Generate Button */}
          <Button
            variant="primary"
            className="w-full"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Generate Design
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Middle Panel: Design Preview ── */}
      <div className="flex-1 min-w-0 min-h-[400px] bg-neutral-50 overflow-y-auto">
        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 rounded-lg bg-neutral-200/60 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("original")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "original" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Original ({uploadedImages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("generated")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "generated" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Generated ({allGeneratedImages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "history" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              History ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("favorites")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "favorites" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Heart size={12} className="inline mr-1" />
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Original Tab */}
          {activeTab === "original" && (
            uploadedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ImageIcon size={48} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">Upload room photos to get started</p>
                <p className="text-neutral-400 text-xs mt-1">Your original photos will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                    <img src={img.preview} alt={`Original ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
                    <div className="px-3 py-2 text-xs text-neutral-500">Original Photo {i + 1}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Generated Tab */}
          {activeTab === "generated" && (
            isGenerating && currentSessions.every((s) => s.status !== "completed") ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-4">
                  <div className="size-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-primary-500" />
                </div>
                <p className="text-neutral-700 font-medium">Generating your design...</p>
                <p className="text-neutral-400 text-xs mt-1">This usually takes 15-30 seconds</p>
              </div>
            ) : currentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Sparkles size={48} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No designs generated yet</p>
                <p className="text-neutral-400 text-xs mt-1">Select one or more styles and click "Generate Design"</p>
              </div>
            ) : (() => {
              const completedSessions = currentSessions.filter((s) => s.status === "completed" && (s.generatedImages?.length ?? 0) > 0);
              const pendingSessions = currentSessions.filter((s) => s.status === "pending" || s.status === "processing");

              // Still processing — show spinner
              if (completedSessions.length === 0 && pendingSessions.length > 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-4">
                      <div className="size-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
                      <Sparkles size={20} className="absolute inset-0 m-auto text-primary-500" />
                    </div>
                    <p className="text-neutral-700 font-medium">Generating your design...</p>
                    <p className="text-neutral-400 text-xs mt-1">This usually takes 15-30 seconds</p>
                  </div>
                );
              }

              // No completed and no pending — all failed or empty
              if (completedSessions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ImageIcon size={48} className="text-neutral-300 mb-3" />
                    <p className="text-neutral-500 text-sm">No completed designs</p>
                    <p className="text-neutral-400 text-xs mt-1">Try generating a new design</p>
                  </div>
                );
              }

              const safeIdx = Math.min(activeVariationIdx, completedSessions.length - 1);
              const activeSession = completedSessions[safeIdx];
              const activeStyleName = DESIGN_STYLES.find((s) => s.id === activeSession.style?.id)?.label ?? activeSession.style?.id ?? "Design";
              const activeUrl = activeSession.generatedImages?.[0]?.signedUrl;
              const originalUrl = uploadedImages[0]?.preview || activeSession.roomPhoto?.signedUrl;
              const isSelected = selectedSessionId === activeSession._id;

              return (
                <div className="space-y-4">
                  {/* ── Mode toggle ── */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <SplitSquareHorizontal size={14} />
                      <span className="font-medium text-neutral-700">{activeStyleName}</span>
                      {activeSession?.style?.prompt && (
                        <span className="text-neutral-400 truncate max-w-[200px]" title={activeSession.style.prompt}>
                          &mdash; {activeSession.style.prompt}
                        </span>
                      )}
                    </div>
                    <div className="flex rounded-lg bg-neutral-200/60 p-0.5">
                      <button
                        type="button"
                        onClick={() => setCompareMode("side")}
                        className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                          compareMode === "side" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                        }`}
                      >
                        Side by Side
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCompareMode("slider"); setSliderPos(50); }}
                        className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                          compareMode === "slider" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                        }`}
                      >
                        Slider
                      </button>
                    </div>
                  </div>

                  {/* ── Comparison view ── */}
                  {compareMode === "side" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                        {originalUrl ? (
                          <img src={originalUrl} alt="Original" className="w-full aspect-4/3 object-cover" />
                        ) : (
                          <div className="aspect-4/3 bg-neutral-100 flex items-center justify-center"><ImageIcon size={32} className="text-neutral-300" /></div>
                        )}
                        <div className="px-3 py-1.5 text-[11px] text-neutral-500 font-medium bg-neutral-50">Original</div>
                      </div>
                      <div className={`rounded-xl overflow-hidden border-2 bg-white shadow-sm transition-colors ${isSelected ? "border-primary-500" : "border-primary-200"}`}>
                        {activeUrl ? (
                          <img src={activeUrl} alt={activeStyleName} className="w-full aspect-[4/3] object-cover" />
                        ) : pendingSessions.length > 0 ? (
                          <div className="aspect-[4/3] bg-neutral-50 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-primary-400" />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center"><ImageIcon size={32} className="text-neutral-300" /></div>
                        )}
                        <div className="px-3 py-1.5 text-[11px] text-primary-600 font-medium bg-primary-50">{activeStyleName || "Generated"}</div>
                      </div>
                    </div>
                  ) : (
                    /* ── Slider compare ── */
                    <div
                      ref={sliderRef}
                      className="relative mx-auto rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm aspect-16/10 max-h-105 select-none cursor-col-resize"
                      onMouseDown={() => setIsDragging(true)}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                      onMouseMove={(e) => {
                        if (!isDragging || !sliderRef.current) return;
                        const rect = sliderRef.current.getBoundingClientRect();
                        setSliderPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
                      }}
                      onTouchMove={(e) => {
                        if (!sliderRef.current) return;
                        const rect = sliderRef.current.getBoundingClientRect();
                        setSliderPos(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)));
                      }}
                    >
                      {/* Original (full, fixed background) */}
                      {originalUrl && (
                        <img src={originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                      )}

                      {/* Generated (clipped from right via clip-path, image stays fixed) */}
                      {activeUrl && (
                        <div
                          className="absolute inset-0"
                          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                        >
                          <img src={activeUrl} alt={activeStyleName} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                        </div>
                      )}

                      {/* Slider handle */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center">
                          <div className="flex gap-px">
                            <ChevronLeft size={11} className="text-neutral-500" />
                            <ChevronRight size={11} className="text-neutral-500" />
                          </div>
                        </div>
                      </div>

                      {/* Labels */}
                      <span className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-20">
                        Original
                      </span>
                      <span className="absolute top-2.5 right-2.5 bg-primary-500/80 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-20">
                        {activeStyleName}
                      </span>
                    </div>
                  )}

                  {/* ── Thumbnail pagination ── */}
                  {(completedSessions.length > 1 || pendingSessions.length > 0) && (
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                      {completedSessions.map((session, idx) => {
                        const thumbUrl = session.generatedImages?.[0]?.signedUrl;
                        const isActive = idx === safeIdx;
                        const thumbStyle = DESIGN_STYLES.find((s) => s.id === session.style?.id)?.label ?? "";
                        return (
                          <button
                            key={session._id}
                            type="button"
                            onClick={() => { setActiveVariationIdx(idx); setSliderPos(50); }}
                            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                              isActive ? "border-primary-500 shadow-md" : "border-neutral-200 hover:border-neutral-300 opacity-70 hover:opacity-100"
                            }`}
                          >
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={thumbStyle} className="w-20 h-14 object-cover" />
                            ) : (
                              <div className="w-20 h-14 bg-neutral-100 flex items-center justify-center"><ImageIcon size={14} className="text-neutral-300" /></div>
                            )}
                          </button>
                        );
                      })}
                      {pendingSessions.map((session) => (
                        <div key={session._id} className="shrink-0 w-20 h-14 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin text-neutral-300" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Actions for active variation ── */}
                  {activeSession && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(isSelected ? null : activeSession._id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isSelected
                            ? "bg-primary-500 text-white"
                            : "border border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:text-primary-600"
                        }`}
                      >
                        <Star size={12} className={isSelected ? "fill-white" : ""} />
                        {isSelected ? "Selected" : "Select as Final"}
                      </button>

                      {isSelected && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(activeSession._id)}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                              favoriteIds.has(activeSession._id)
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            }`}
                          >
                            <Heart size={12} className={favoriteIds.has(activeSession._id) ? "fill-red-500" : ""} />
                            {favoriteIds.has(activeSession._id) ? "Favorited" : "Favorite"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShare(activeSession._id)}
                            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                          >
                            {copiedShareId === activeSession._id ? <Check size={12} className="text-green-500" /> : <Share2 size={12} />}
                            {copiedShareId === activeSession._id ? "Copied!" : "Share"}
                          </button>

                          <div className="relative" data-attach-menu>
                            <button
                              type="button"
                              onClick={() => setAttachingId(attachingId === activeSession._id ? null : activeSession._id)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                activeSession.projectId
                                  ? "border-green-200 bg-green-50 text-green-600"
                                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              <Paperclip size={12} />
                              {activeSession.projectId ? "Attached" : "Attach"}
                            </button>

                            {attachingId === activeSession._id && (
                              <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-10">
                                {projects.length === 0 ? (
                                  <p className="p-3 text-xs text-neutral-400">No projects found</p>
                                ) : (
                                  projects.map((p) => (
                                    <button
                                      key={p._id}
                                      type="button"
                                      onClick={() => handleAttach(activeSession._id, p._id)}
                                      className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                    >
                                      {p.title}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Refinement text box ── */}
                  {currentSessions.some((s) => s.status === "completed") && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                      <label className="text-sm font-medium text-neutral-700 mb-1 block">Modify this design</label>
                      <p className="text-[10px] text-neutral-400 mb-2">Describe changes and a new variation will be generated from your original photo</p>
                      <div className="flex gap-2">
                        <Textarea
                          rows={2}
                          value={refinementPrompt}
                          onChange={(e) => setRefinementPrompt(e.target.value)}
                          placeholder='e.g. "Make the cabinets white" or "Add pendant lights over the island"'
                          className="text-sm flex-1"
                          disabled={isRefining}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRefine(); }
                          }}
                        />
                        <Button variant="primary" size="sm" onClick={handleRefine} disabled={isRefining || !refinementPrompt.trim()} className="shrink-0 self-end">
                          {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })())}
          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart size={48} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No favorites yet</p>
                <p className="text-neutral-400 text-xs mt-1">Click the heart icon on any design to save it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((session) => {
                  const render = session.generatedImages?.[0];
                  const styleName = DESIGN_STYLES.find((s) => s.id === session.style?.id)?.label ?? session.style?.id ?? "Unknown";
                  return (
                    <div
                      key={session._id}
                      className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentSessions([session]);
                        setActiveVariationIdx(0);
                        setActiveTab("generated");
                      }}
                    >
                      {render?.signedUrl ? (
                        <img src={render.signedUrl} alt={styleName} className="w-full aspect-[4/3] object-cover" />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                          <ImageIcon size={32} className="text-neutral-300" />
                        </div>
                      )}
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-700 truncate">{styleName}</p>
                          <p className="text-[10px] text-neutral-400">{new Date(session.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(session._id); }}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Heart size={14} className="fill-red-500" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleShare(session._id); }}
                            className="p-1 rounded text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                          >
                            {copiedShareId === session._id ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 size={24} className="animate-spin text-neutral-400 mb-2" />
                <p className="text-neutral-500 text-sm">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock size={48} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No past designs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk actions bar */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setBulkMode((v) => !v); setBulkSelected(new Set()); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      bulkMode ? "bg-primary-50 text-primary-700 border border-primary-200" : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {bulkMode ? <CheckSquare size={14} /> : <Square size={14} />}
                    {bulkMode ? `${bulkSelected.size} selected` : "Select"}
                  </button>

                  {bulkMode && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkSelected.size === history.length) setBulkSelected(new Set());
                          else setBulkSelected(new Set(history.map((s) => s._id)));
                        }}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {bulkSelected.size === history.length ? "Deselect all" : "Select all"}
                      </button>
                      {bulkSelected.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ ids: Array.from(bulkSelected), label: `${bulkSelected.size} design${bulkSelected.size > 1 ? "s" : ""}` })}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete ({bulkSelected.size})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((session) => {
                    const render = session.generatedImages?.[0];
                    const styleName = DESIGN_STYLES.find((s) => s.id === session.style?.id)?.label ?? session.style?.id ?? "Unknown";
                    const isBulkChecked = bulkSelected.has(session._id);
                    return (
                      <div
                        key={session._id}
                        className={`rounded-xl overflow-hidden border bg-white shadow-sm cursor-pointer hover:shadow-md transition-all ${
                          isBulkChecked ? "border-primary-400 ring-2 ring-primary-100" : "border-neutral-200"
                        }`}
                        onClick={() => {
                          if (bulkMode) {
                            setBulkSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(session._id)) next.delete(session._id);
                              else next.add(session._id);
                              return next;
                            });
                          } else {
                            setCurrentSessions([session]);
                            setActiveVariationIdx(0);
                            setActiveTab("generated");
                          }
                        }}
                      >
                        <div className="relative">
                          {render?.signedUrl ? (
                            <img src={render.signedUrl} alt={styleName} className="w-full aspect-[4/3] object-cover" />
                          ) : (
                            <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                              <ImageIcon size={32} className="text-neutral-300" />
                            </div>
                          )}
                          {bulkMode && (
                            <div className={`absolute top-2 left-2 size-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isBulkChecked ? "bg-primary-500 border-primary-500" : "bg-white/80 border-neutral-300"
                            }`}>
                              {isBulkChecked && <Check size={12} className="text-white" />}
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-neutral-700 truncate">{styleName}</p>
                              <p className="text-[10px] text-neutral-400">
                                {new Date(session.createdAt).toLocaleDateString()} &middot;{" "}
                                <span className={session.status === "completed" ? "text-green-500" : session.status === "failed" ? "text-red-500" : "text-amber-500"}>
                                  {session.status}
                                </span>
                              </p>
                            </div>
                            {!bulkMode && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ ids: [session._id], label: "this design" }); }}
                                className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          {!bulkMode && session.status === "completed" && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(session._id); }}
                                className={`p-1 rounded transition-colors ${
                                  favoriteIds.has(session._id) ? "text-red-500 hover:bg-red-50" : "text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                }`}
                              >
                                <Heart size={14} className={favoriteIds.has(session._id) ? "fill-red-500" : ""} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleShare(session._id); }}
                                className="p-1 rounded text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              >
                                {copiedShareId === session._id ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        title="Delete Design"
        description={`Are you sure you want to delete ${deleteTarget?.label ?? "this design"}?`}
        variant="danger"
        warningText="This will permanently delete the design and its generated images. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        loadingLabel="Deleting..."
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DesignStudio;
