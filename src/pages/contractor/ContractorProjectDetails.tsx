import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { getProjectById } from "@/api/porject";
import { bidService, type BidRecord } from "@/api/bid";
import { contractService, type ContractRecord } from "@/api/contract";
import type { HomeownerProject } from "@/types/project";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Skeleton } from "@/components/atoms/Skeleton";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";
const BID_STEPS: Array<"submitted" | "shortlisted" | "accepted"> = [
  "submitted",
  "shortlisted",
  "accepted",
];

const getBidProgress = (status: BidRecord["status"]) => {
  switch (status) {
    case "submitted":
      return { width: "34%", colorClass: "bg-primary", label: "Submitted" };
    case "shortlisted":
      return {
        width: "67%",
        colorClass: "bg-secondary",
        label: "Shortlisted",
      };
    case "accepted":
      return { width: "100%", colorClass: "bg-success", label: "Accepted" };
    case "rejected":
      return { width: "100%", colorClass: "bg-error", label: "Rejected" };
    case "withdrawn":
      return {
        width: "100%",
        colorClass: "bg-neutral-500",
        label: "Withdrawn",
      };
    default:
      return { width: "10%", colorClass: "bg-neutral-400", label: "Draft" };
  }
};

const ContractorProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<HomeownerProject | null>(null);
  const [projectBid, setProjectBid] = useState<BidRecord | null>(null);
  const [projectContract, setProjectContract] = useState<ContractRecord | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [projectResponse, myBids, contractData] = await Promise.all([
          getProjectById(id),
          bidService.getMyBids(),
          contractService.getProjectContract(id).catch(() => null),
        ]);
        setProject(projectResponse.project);
        setProjectContract(contractData);
        setLoadingContract(false);

        const currentProjectBid = myBids.find((bid) => {
          const bidProjectId =
            typeof bid.projectId === "string" ? bid.projectId : bid.projectId?._id;
          return bidProjectId === id;
        });
        setProjectBid(currentProjectBid ?? null);
      } catch {
        toast.error("Failed to load project details.");
        navigate("/contractor/projects");
      } finally {
        setLoadingContract(false);
        setLoading(false);
      }
    };

    void loadProject();
  }, [id, navigate]);

  const budget = project?.budgetRange
    ? `$${project.budgetRange.min.toLocaleString()} - $${project.budgetRange.max.toLocaleString()}`
    : project?.customBudget
      ? `$${project.customBudget.toLocaleString()}`
      : "Not specified";

  const location = project?.address
    ? `${project.address.street}, ${project.address.city}, ${project.address.state} ${project.address.zipCode}`
    : "Not specified";

  const images = project?.images ?? [];
  const bidProgress = projectBid ? getBidProgress(projectBid.status) : null;

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

  const hasContractorSigned = Boolean(
    projectContract?.signatures?.some((signature) => signature.party === "contractor"),
  );

  const hasHomeownerSigned = Boolean(
    projectContract?.signatures?.some((signature) => signature.party === "homeowner"),
  );

  const handleSignContract = async () => {
    if (!id || !projectContract?._id) return;

    try {
      setIsSigningContract(true);
      const updated = await contractService.signContract(projectContract._id);
      setProjectContract(updated);
      toast.success("Contract signed successfully.");

      const refreshed = await contractService.getProjectContract(id);
      setProjectContract(refreshed);
    } catch (error) {
      console.error("Failed to sign contract:", error);
      toast.error("Failed to sign contract.");
    } finally {
      setIsSigningContract(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/contractor/projects">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="size-4" /> Back to Projects
        </Button>
      </Link>

      {projectBid && <Card className="my-10">
            <h6 className="mb-3">Your Bid Status</h6>
            <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Current status</span>
                  <span className="font-semibold text-neutral-800 capitalize">
                    {bidProgress?.label}
                  </span>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${bidProgress?.colorClass}`}
                    style={{ width: bidProgress?.width }}
                  />
                </div>

                {projectBid.status === "rejected" ||
                projectBid.status === "withdrawn" ? (
                  <>
                    <p className="mt-3 text-sm text-neutral-600">
                      This bid is in a terminal state.
                    </p>
                    {projectBid.status === "rejected" && projectBid.reply?.trim() && (
                      <p className="mt-2 text-sm text-neutral-700">
                        <span className="font-medium">Reply:</span>{" "}
                        {projectBid.reply}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    {BID_STEPS.map((step) => {
                      const currentIndex = BID_STEPS.indexOf(
                        projectBid.status as "submitted" | "shortlisted" | "accepted",
                      );
                      const stepIndex = BID_STEPS.indexOf(step);
                      const done = stepIndex < currentIndex;
                      const active = stepIndex === currentIndex;

                      return (
                        <div
                          key={step}
                          className={`rounded-lg border px-2 py-2 text-center capitalize ${
                            active
                              ? "border-primary text-primary bg-primary-50"
                              : done
                                ? "border-success text-success bg-success/10"
                                : "border-neutral-200 text-neutral-500"
                          }`}
                        >
                          {step}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
          </Card>}

      <Card>
        <h6 className="mb-3">Contract Signature</h6>
        {loadingContract ? (
          <Skeleton variant="text" className="w-full h-12" />
        ) : !projectContract ? (
          <p className="text-sm text-neutral-600">No contract found for this project yet.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-700">
              Status: <span className="font-semibold capitalize">{projectContract.status.split("_").join(" ")}</span>
            </p>
            <p className="text-sm text-neutral-700">
              Homeowner signed: {hasHomeownerSigned ? "Yes" : "No"}
            </p>
            <p className="text-sm text-neutral-700">
              Contractor signed: {hasContractorSigned ? "Yes" : "No"}
            </p>
            <p className="text-sm text-neutral-700">
              Start date: {projectContract.startDate ? new Date(projectContract.startDate).toLocaleDateString() : "Not set"}
            </p>
            <p className="text-sm text-neutral-700">
              Estimated end date: {projectContract.estimatedEndDate ? new Date(projectContract.estimatedEndDate).toLocaleDateString() : "Not set"}
            </p>

            {projectContract.status === "pending_signatures" && !hasContractorSigned && (
              <Button
                size="xs"
                variant="primary"
                disabled={isSigningContract}
                onClick={() => void handleSignContract()}
              >
                {isSigningContract ? "Signing..." : "Sign Contract"}
              </Button>
            )}
          </div>
        )}
      </Card>

      {loading ? (
        <Card>
          <Skeleton variant="title" className="h-8 w-72" />
          <Skeleton variant="text" className="mt-2 h-5 w-full" />
        </Card>
      ) : (
        <>
          <Card className="space-y-4 mt-10">
            <div className="flex items-center gap-3">
              <h4>{project?.title}</h4>
              <Badge variant="primary">{project?.status ?? "bidding"}</Badge>
            </div>
            <p className="text-neutral-700">
              {project?.description || "No description provided."}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <span className="text-sm text-neutral-500">Room Type</span>
                <p className="font-semibold text-primary">
                  {project?.roomType?.split("_").join(" ") || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Budget</span>
                <p className="font-semibold text-primary">{budget}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Location</span>
                <p className="font-semibold text-primary">{location}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h6 className="mb-4">Project Images</h6>
            {images.length === 0 ? (
              <p className="text-neutral-600">
                No images uploaded for this project.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <img
                    key={`${image.url}-${index}`}
                    src={`${BASE_IMAGE_URL}${image.url}`}
                    alt={`Project image ${index + 1}`}
                    className="h-48 w-full rounded-lg object-cover cursor-pointer"
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </Card>

        </>
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
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 cursor-pointer"
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

export default ContractorProjectDetails;
