import { Button } from "@/components/atoms/Button";
import { getProjects } from "@/api/porject";
import { useAuth } from "@/stores/useAuth";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/molecules/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useNavigate } from "react-router-dom";
import type { HomeownerProject } from "@/types/project";

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<HomeownerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProjects();
        setProjects(Array.isArray(data?.projects) ? data.projects : []);
      } catch {
        setError("Failed to load your projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5 md:gap-0">
        <div className="space-y-2 text-center md:text-left">
          <h4>My Projects</h4>
          <p className="text-neutral-500">
            Welcome Mr {user?.firstName}, Manage and track all your renovation
            projects
          </p>
        </div>
        <Link to="/homeowner/projects/new">
          <Button variant="primary" size="md" className="flex gap-4 w-full">
            <Plus />
            New Project
          </Button>
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton variant="image" className="size-32 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton variant="title" className="w-48 h-6" />
                      <Skeleton variant="text" className="w-32 h-4 mt-2" />
                      <Skeleton variant="text" className="w-full h-4 mt-3" />
                      <Skeleton variant="text" className="w-3/4 h-4 mt-1" />
                      <div className="mt-3 flex gap-4">
                        <Skeleton variant="text" className="w-24 h-3" />
                        <Skeleton variant="text" className="w-24 h-3" />
                      </div>
                    </div>
                  </div>
                  <Skeleton variant="text" className="w-16 h-6 rounded-full" />
                </div>
              </Card>
            ))}
          </>
        )}

        {!loading && error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <p className="text-sm text-neutral-500">
            No projects yet. Create your first project.
          </p>
        )}

        {!loading &&
          !error &&
          projects.map((project) => {
            const budgetText = project.budget
              ? `$${project.budget.agreed.toLocaleString()}`
              : project.budgetRange
                ? `$${project.budgetRange.min.toLocaleString()} - $${project.budgetRange.max.toLocaleString()}`
                : project.customBudget
                  ? `$${project.customBudget.toLocaleString()}`
                  : "N/A";

            return (
              <Card
                key={project._id}
                hoverable
                className="rounded-xl border border-neutral-200 bg-white p-4 cursor-pointer group"
                onClick={() => {
                  // Navigate to project details page
                  navigate(`/homeowner/projects/${project._id}`);
                }}
              >
                <div className="flex flex-col space-y-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex lg:items-center gap-3 flex-col lg:flex-row">
                    <div className="shrink-0">
                      <img
                        src={BASE_IMAGE_URL + project.images?.[0]?.url}
                        alt={project.title}
                        className="w-full h-32 md:size-32 object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <div>
                        <h5 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors duration-200">
                          {project.title}
                        </h5>
                        <p className="mt-1 text-sm text-neutral-500">
                          {project.roomType.replaceAll("_", " ")}
                        </p>
                      </div>
                      {project.description && (
                        <p
                          className="mt-3 text-sm text-neutral-700 overflow-hidden text-ellipsis"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {project.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>
                          Budget:{" "}
                          <span className="text-neutral-600 font-semibold">
                            {budgetText}
                          </span>
                        </span>
                        {project.createdAt && (
                          <span>
                            Created:{" "}
                            <span className="text-neutral-600 font-semibold">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 capitalize">
                    {project.status ?? "draft"}
                  </span>
                </div>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default Projects;
