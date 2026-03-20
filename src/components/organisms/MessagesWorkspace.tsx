import { Link } from "react-router-dom";
import MessagesPage from "@/pages/messages/MessagesPage";
import { useAuth } from "@/stores/useAuth";

interface MessagesWorkspaceProps {
  mode?: "full" | "compact";
  onClose?: () => void;
}

const MessagesWorkspace = ({ mode = "full", onClose }: MessagesWorkspaceProps) => {
  const { role } = useAuth();

  if (mode === "compact") {
    const messagesRoute =
      role === "homeowner" ? "/homeowner/messages" : "/contractor/messages";

    return (
      <div className="h-full rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h6>Messages</h6>
          <Link
            to={messagesRoute}
            onClick={onClose}
            className="text-sm font-medium text-primary hover:underline"
          >
            Open full page
          </Link>
        </div>
        <p className="text-sm text-neutral-500">
          Quick drawer is available. Open full page for full conversations.
        </p>
      </div>
    );
  }

  return <MessagesPage />;
};

export default MessagesWorkspace;
