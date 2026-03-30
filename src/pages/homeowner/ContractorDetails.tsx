import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Briefcase,
  MapPin,
  ShieldCheck,
  Tag,
  ImageOff,
  MessageSquare,
  X,
} from "lucide-react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { contractorsService, type ContractorProfile } from "@/api/contractors";
import { reviewService, type Review } from "@/api/review";
import { portfolioService, type PortfolioItem } from "@/api/portfolio";
import { getImageUrl } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={
          n <= Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "fill-neutral-200 text-neutral-200"
        }
      />
    ))}
  </div>
);

const getAuthorName = (homeownerId: Review["homeownerId"]) => {
  if (!homeownerId || typeof homeownerId === "string") return "Homeowner";
  const full = `${homeownerId.firstName ?? ""} ${homeownerId.lastName ?? ""}`.trim();
  return full || "Homeowner";
};

const getAuthorInitials = (homeownerId: Review["homeownerId"]) => {
  const name = getAuthorName(homeownerId);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });

// ─── Service Area Map ─────────────────────────────────────────────────────────

type ServiceAreaPolygon = { type: "Polygon"; coordinates: number[][][] };

// Converts GeoJSON [lng, lat] to Leaflet [lat, lng]
const toLatLng = (coords: number[][][]): LatLngTuple[][] =>
  coords.map((ring) => ring.map(([lng, lat]) => [lat, lng] as LatLngTuple));

const FitBounds = ({ positions }: { positions: LatLngTuple[][] }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || positions[0]?.length === 0) return;
    map.fitBounds(positions[0].map((p) => p as LatLngTuple), { padding: [24, 24] });
    fitted.current = true;
  }, [map, positions]);
  return null;
};

const ServiceAreaMap = ({ serviceArea }: { serviceArea: ServiceAreaPolygon }) => {
  const positions = toLatLng(serviceArea.coordinates);
  const center: LatLngTuple = positions[0]?.[0] ?? [41.8781, -87.6298];

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Service Area</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-200" style={{ height: 320 }}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={false}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polygon
            positions={positions}
            pathOptions={{ color: "#4f46e5", fillColor: "#6366f1", fillOpacity: 0.2, weight: 2 }}
          />
          <FitBounds positions={positions} />
        </MapContainer>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ContractorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const [contractorData, reviewData, portfolioData] = await Promise.all([
          contractorsService.getContractorById(id),
          reviewService.getContractorReviews(id),
          portfolioService.getContractorPortfolio(id),
        ]);
        setContractor(contractorData);
        setReviews(reviewData.reviews);
        setAverageRating(reviewData.averageRating);
        setPortfolio(portfolioData);
      } catch {
        toast.error("Failed to load contractor profile.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) return <ContractorDetailsSkeleton />;

  if (!contractor) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <p className="text-neutral-500">Contractor not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const { firstName, lastName, avatar, address, contractor: info } = contractor;
  const fullName = `${firstName} ${lastName}`;
  const location = [address?.city, address?.state].filter(Boolean).join(", ");

  return (
    <div className="p-6 pt-16 max-w-4xl mx-auto">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to contractors
      </button>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          {avatar ? (
            <img
              src={getImageUrl(avatar)}
              alt={fullName}
              className="size-24 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-600">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">{fullName}</h1>
              {info.isVerified && (
                <ShieldCheck size={18} className="text-green-500 shrink-0" />
              )}
            </div>

            {info.companyName && (
              <p className="mt-0.5 text-sm text-neutral-500">{info.companyName}</p>
            )}

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-sm font-medium text-neutral-700">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-400">
                ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
              {info.experienceYears != null && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} />
                  {info.experienceYears} yr{info.experienceYears !== 1 ? "s" : ""} experience
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {location}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 flex items-center gap-2"
            onClick={() => navigate("/homeowner/messages")}
          >
            <MessageSquare size={15} />
            Message
          </Button>
        </div>

        {/* Bio */}
        {info.bio && (
          <p className="mt-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-5">
            {info.bio}
          </p>
        )}

        {/* Specialties */}
        {info.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {info.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* ── Service Area ────────────────────────────────────────────────────── */}
      {info.serviceArea && <ServiceAreaMap serviceArea={info.serviceArea} />}

      {/* ── Portfolio ───────────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Portfolio</h2>

        {portfolio.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ImageOff size={32} className="text-neutral-300" />
            <p className="text-sm text-neutral-400">No portfolio items yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {portfolio.map((item) => (
              <Card key={item._id} className="overflow-hidden p-0">
                {/* Images */}
                {item.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5 bg-neutral-100">
                    {item.images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLightboxImages(item.images.map((i) => getImageUrl(i)));
                          setLightboxIndex(idx);
                        }}
                        className="relative aspect-square overflow-hidden"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Portfolio image ${idx + 1}`}
                          className="size-full object-cover transition-transform hover:scale-105"
                        />
                        {idx === 2 && item.images.length > 3 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                            +{item.images.length - 3}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-neutral-100">
                    <ImageOff size={24} className="text-neutral-300" />
                  </div>
                )}

                {/* Text */}
                <div className="p-4">
                  {item.title && (
                    <h6 className="text-sm font-semibold text-neutral-800 mb-1">{item.title}</h6>
                  )}
                  {item.description && (
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Reviews ─────────────────────────────────────────────────────────── */}
      <section className="mt-8 mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-sm font-semibold text-neutral-700">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-400">/ 5</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Star size={32} className="text-neutral-300" />
            <p className="text-sm text-neutral-400">No reviews yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review._id} className="p-5">
                <div className="flex items-start gap-3">
                  {/* Author avatar */}
                  {typeof review.homeownerId !== "string" && review.homeownerId?.avatar ? (
                    <img
                      src={getImageUrl(review.homeownerId.avatar)}
                      alt={getAuthorName(review.homeownerId)}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600">
                      {getAuthorInitials(review.homeownerId)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-neutral-800">
                        {getAuthorName(review.homeownerId)}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1">
                      <StarRating rating={review.rating} size={13} />
                    </div>

                    {review.comment && (
                      <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Image gallery lightbox */}
      {lightboxImages.length > 0 && (() => {
        // Lock body scroll
        document.body.style.overflow = "hidden";
        const close = () => {
          setLightboxImages([]);
          setLightboxIndex(0);
          document.body.style.overflow = "";
        };
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={close}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(i + 1, lightboxImages.length - 1));
              if (e.key === "ArrowLeft") setLightboxIndex((i) => Math.max(i - 1, 0));
            }}
            tabIndex={0}
            ref={(el) => el?.focus()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white z-10">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>

            {/* Previous */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1); }}
                className="absolute left-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors z-10"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next */}
            {lightboxIndex < lightboxImages.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1); }}
                className="absolute right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors z-10"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Image */}
            <img
              src={lightboxImages[lightboxIndex]}
              alt={`Image ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })()}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ContractorDetailsSkeleton = () => (
  <div className="p-6 pt-16 max-w-4xl mx-auto space-y-6">
    <Card className="p-6">
      <div className="flex gap-6">
        <Skeleton variant="avatar" className="size-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="title" className="w-48" />
          <Skeleton variant="text" className="w-32" />
          <Skeleton variant="text" className="w-56" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-4/5" />
      </div>
    </Card>
    <div className="space-y-3">
      <Skeleton variant="title" className="w-28" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton variant="title" className="w-24" />
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-5">
          <div className="flex gap-3">
            <Skeleton variant="avatar" className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-32" />
              <Skeleton variant="text" className="w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default ContractorDetails;
