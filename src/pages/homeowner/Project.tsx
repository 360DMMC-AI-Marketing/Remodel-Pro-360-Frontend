import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { HomeownerProject } from "@/types/project";
import { getProjectById } from "@/api/porject";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<HomeownerProject | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const images = project?.images ?? [];

  useEffect(() => {
    const fetchProject = async () => {
        setLoading(true);
      try {
        const data = await getProjectById(id!);
        setProject(data.project);
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

  return (
    <div>
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
                <h4>Master Bathroom Renovation</h4>
                <Badge variant="primary">{project?.status}</Badge>
              </span>
              <p className="text-neutral-500">{project?.title}</p>
            </div>
            <Button variant="outline" size="sm">Edit Project</Button>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl p-5 border border-neutral-200">
            <h6 className="mb-3 text-neutral-800">Images & Linked Designs</h6>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="image" className="w-full h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img, index) => (
                      <img
                        key={index}
                        src={`${BASE_IMAGE_URL}${img.url}`}
                        alt={`Project Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => setActiveImageIndex(index)}
                      />
                  ))}
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
