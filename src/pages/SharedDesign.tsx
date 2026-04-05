import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Image as ImageIcon, Sparkles, ArrowLeft } from "lucide-react";
import { designService, type DesignSession } from "@/api/design";

const SharedDesign = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<DesignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    designService
      .getSharedDesign(token)
      .then(setSession)
      .catch(() => setError("This shared design was not found or the link has been revoked."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-center p-6">
        <ImageIcon size={48} className="text-neutral-300 mb-4" />
        <p className="text-neutral-600 font-medium">{error || "Design not found"}</p>
        <Link to="/" className="mt-4 text-sm text-primary-500 hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
    );
  }

  const styleName = session.style?.id
    ? session.style.id.charAt(0).toUpperCase() + session.style.id.slice(1)
    : "Design";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-primary-500" />
            <h1 className="text-xl font-bold text-neutral-900">{styleName} Design</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Shared on {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.roomPhoto?.signedUrl && (
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
              <img src={session.roomPhoto.signedUrl} alt="Original room" className="w-full aspect-[4/3] object-cover" />
              <div className="px-3 py-2 text-xs text-neutral-500">Original Room</div>
            </div>
          )}

          {session.generatedImages?.map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-primary-200 bg-white shadow-sm">
              <img src={img.signedUrl} alt={`AI Render ${i + 1}`} className="w-full aspect-[4/3] object-cover" />
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-neutral-600 font-medium">AI Render {i + 1}</span>
                <span className="text-[10px] text-primary-500 font-medium uppercase">{img.resolution}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary-500 hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Remodel Pro 360
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedDesign;
