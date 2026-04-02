import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  Layers,
  Paintbrush,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { toast } from "sonner";
import { designService, type DesignSession } from "@/api/design";

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
  { id: "modern", label: "Modern", emoji: "🏢", desc: "Clean lines, neutral tones, sleek furniture" },
  { id: "farmhouse", label: "Farmhouse", emoji: "🌾", desc: "Warm wood, shiplap, rustic charm" },
  { id: "scandinavian", label: "Scandinavian", emoji: "🌿", desc: "Bright, airy, light wood, cozy textiles" },
  { id: "industrial", label: "Industrial", emoji: "🏗️", desc: "Exposed brick, metal, urban loft feel" },
  { id: "coastal", label: "Coastal", emoji: "🌊", desc: "Ocean blues, sandy tones, rattan accents" },
  { id: "minimalist", label: "Minimalist", emoji: "⬜", desc: "Essentials only, uncluttered, serene" },
  { id: "bohemian", label: "Bohemian", emoji: "🎨", desc: "Eclectic, layered patterns, global vibes" },
  { id: "mid-century", label: "Mid-Century", emoji: "🪑", desc: "Retro shapes, teak wood, bold accents" },
  { id: "traditional", label: "Traditional", emoji: "🏛️", desc: "Rich fabrics, molding, refined elegance" },
  { id: "japandi", label: "Japandi", emoji: "🍵", desc: "Japanese minimalism meets Nordic warmth" },
];

const DesignStudio = () => {
  // Left panel state
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [roomType, setRoomType] = useState("");
  const [designStyle, setDesignStyle] = useState("");
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Middle panel state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"original" | "generated" | "history">("original");

  // Generated result from current session
  const [currentSession, setCurrentSession] = useState<DesignSession | null>(null);

  // History
  const [history, setHistory] = useState<DesignSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  useEffect(() => {
    loadHistory();
  }, []);

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
    setCurrentSession(null);

    try {
      // 1. Submit job — returns immediately with session ID (partial data)
      const queued = await designService.generate(
        uploadedImages[0].file,
        roomType,
        designStyle,
        prompt || undefined,
      );

      // Build a local session object with the info we already have
      const localSession: DesignSession = {
        ...queued,
        style: { id: designStyle, prompt: prompt || undefined },
        roomPhoto: { url: "", uploadedAt: new Date().toISOString() },
        generatedImages: [],
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentSession(localSession);

      // 2. Poll until done — merge updates into local session to preserve style info
      const completed = await designService.pollUntilDone(
        queued._id,
        (update) => setCurrentSession((prev) => prev ? { ...prev, ...update } : update),
      );

      setCurrentSession((prev) => prev ? { ...prev, ...completed } : completed);

      if (completed.status === "completed") {
        toast.success(
          `Design generated in ${((completed.processingTimeMs ?? 0) / 1000).toFixed(1)}s!`,
        );
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

  const handleDeleteSession = async (id: string) => {
    try {
      await designService.deleteDesign(id);
      setHistory((prev) => prev.filter((s) => s._id !== id));
      if (currentSession?._id === id) setCurrentSession(null);
      toast.success("Design deleted.");
    } catch {
      toast.error("Failed to delete design.");
    }
  };

  const generatedImages = currentSession?.generatedImages ?? [];

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

          {/* Design Style */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              <Paintbrush size={14} className="inline mr-1" />
              Design Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setDesignStyle(style.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    designStyle === style.id
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <span className="text-xs font-medium">
                    <span className="mr-1">{style.emoji}</span>
                    {style.label}
                  </span>
                  <p className={`text-[10px] mt-0.5 leading-tight ${designStyle === style.id ? "text-primary-500" : "text-neutral-400"}`}>
                    {style.desc}
                  </p>
                </button>
              ))}
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
              Generated ({generatedImages.length})
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
            isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-4">
                  <div className="size-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-primary-500" />
                </div>
                <p className="text-neutral-700 font-medium">Generating your design...</p>
                <p className="text-neutral-400 text-xs mt-1">This usually takes 15-30 seconds</p>
              </div>
            ) : generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Sparkles size={48} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No designs generated yet</p>
                <p className="text-neutral-400 text-xs mt-1">Configure your preferences and click "Generate Design"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Session info */}
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="capitalize">{currentSession?.style?.id ?? designStyle} style</span>
                  {currentSession?.processingTimeMs && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {(currentSession.processingTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original for comparison */}
                  {currentSession?.roomPhoto?.signedUrl && (
                    <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                      <img src={currentSession.roomPhoto.signedUrl} alt="Original" className="w-full aspect-[4/3] object-cover" />
                      <div className="px-3 py-2 text-xs text-neutral-500">Original</div>
                    </div>
                  )}

                  {/* Rendered images */}
                  {generatedImages.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-primary-200 bg-white shadow-sm">
                      <img src={img.signedUrl} alt={`Render ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-600 font-medium">AI Render {i + 1}</span>
                        <span className="text-[10px] text-primary-500 font-medium uppercase">
                          {img.resolution}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((session) => {
                  const render = session.generatedImages?.[0];
                  const styleName = DESIGN_STYLES.find((s) => s.id === session.style?.id)?.label ?? session.style?.id ?? "Unknown";
                  return (
                    <div
                      key={session._id}
                      className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentSession(session);
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
                          <p className="text-[10px] text-neutral-400">
                            {new Date(session.createdAt).toLocaleDateString()} &middot;{" "}
                            <span className={session.status === "completed" ? "text-green-500" : session.status === "failed" ? "text-red-500" : "text-amber-500"}>
                              {session.status}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void handleDeleteSession(session._id); }}
                          className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;
