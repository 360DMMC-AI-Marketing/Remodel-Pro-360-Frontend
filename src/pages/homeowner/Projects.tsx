import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/stores/useAuth";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Projects = () => {
    const { user } = useAuth();
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h4>My Projects</h4>
          <p className="text-neutral-500">
            Welcome Mr {user?.firstName}, Manage and track all your renovation projects
          </p>
        </div>
        <Link to="/homeowner/projects/new">
          <Button variant="primary" size="md" className="flex gap-4">
            <Plus />
            New Project
          </Button>
        </Link>
      </div>
    </>
  );
};

export default Projects;
