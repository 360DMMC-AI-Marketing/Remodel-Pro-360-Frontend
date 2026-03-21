import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import {
  contractorsService,
  type ContractorProfile,
} from "@/api/contractors";

const SPECIALTIES = [
  "Plumbing",
  "Electrical",
  "Painting",
  "Roofing",
  "Flooring",
  "HVAC",
  "Carpentry",
  "Landscaping",
  "General Contracting",
  "Remodeling",
  "Masonry",
  "Tiling",
];

const EXPERIENCE_OPTIONS = [
  { label: "Any experience", value: 0 },
  { label: "1+ years", value: 1 },
  { label: "3+ years", value: 3 },
  { label: "5+ years", value: 5 },
  { label: "10+ years", value: 10 },
];

const PAGE_SIZE = 12;

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const FindContractors = () => {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minExperience, setMinExperience] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSpecialty, verifiedOnly, minExperience]);

  // Fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const data = await contractorsService.getContractors({
          search: debouncedSearch || undefined,
          specialty: selectedSpecialty || undefined,
          verified: verifiedOnly || undefined,
          minExperience: minExperience || undefined,
          page,
          limit: PAGE_SIZE,
        });
        setContractors(data.contractors);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast.error("Failed to load contractors.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, [debouncedSearch, selectedSpecialty, verifiedOnly, minExperience, page]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialty) count++;
    if (verifiedOnly) count++;
    if (minExperience > 0) count++;
    return count;
  }, [selectedSpecialty, verifiedOnly, minExperience]);

  const clearFilters = () => {
    setSelectedSpecialty("");
    setVerifiedOnly(false);
    setMinExperience(0);
    setSearchQuery("");
  };

  return (
    <div className="p-6 pt-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Find Contractors
        </h1>
        <p className="mt-1 text-neutral-500">
          Browse verified contractors and find the right professional for your
          project.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              placeholder="Search by name, company, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary-600">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Specialty */}
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Specialty
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">All specialties</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience */}
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Experience
                </label>
                <select
                  value={minExperience}
                  onChange={(e) => setMinExperience(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified only */}
              <div className="flex items-center gap-2 pb-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  Verified only
                </label>
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-neutral-500"
                >
                  <X size={14} />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-neutral-500">
          {total} contractor{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton variant="avatar" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="title" className="w-2/3" />
                  <Skeleton variant="text" className="w-1/2" />
                  <Skeleton variant="text" className="w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && contractors.length === 0 && (
        <EmptyState
          icon={<Users size={48} className="text-neutral-300" />}
          title="No contractors found"
          description="Try adjusting your search or filters to find more contractors."
        >
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
              Clear filters
            </Button>
          )}
        </EmptyState>
      )}

      {/* Contractor Grid */}
      {!loading && contractors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contractors.map((c) => (
            <ContractorCard key={c._id} contractor={c} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Contractor Card ─────────────────────────────────────────────────────────

const ContractorCard = ({ contractor }: { contractor: ContractorProfile }) => {
  const navigate = useNavigate();
  const { firstName, lastName, avatar, contractor: info } = contractor;
  const fullName = `${firstName} ${lastName}`;

  return (
    <Card
      className="cursor-pointer p-5 transition-shadow hover:shadow-md"
      hoverable
      onClick={() => navigate(`/homeowner/contractors/${contractor._id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {avatar ? (
          <img
            src={`${BASE_IMAGE_URL}${avatar}`}
            alt={fullName}
            className="size-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-600">
            {firstName.charAt(0)}
            {lastName.charAt(0)}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-neutral-900">
            {fullName}
          </h3>

          {info.companyName && (
            <p className="truncate text-sm text-neutral-500">
              {info.companyName}
            </p>
          )}

          <div className="mt-1 flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-neutral-700">
              {(info.averageRating ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">
              ({info.reviewCount ?? 0})
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        {info.experienceYears != null && (
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {info.experienceYears} yr{info.experienceYears !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Bio */}
      {info.bio && (
        <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
          {info.bio}
        </p>
      )}

      {/* Specialties */}
      {info.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {info.specialties.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              {s}
            </span>
          ))}
          {info.specialties.length > 4 && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
              +{info.specialties.length - 4}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default FindContractors;
