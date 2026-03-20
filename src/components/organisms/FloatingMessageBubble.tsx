import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/stores/useAuth";
import MessagesWorkspace from "@/components/organisms/MessagesWorkspace";

const FloatingMessageBubble = () => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const messagesRoute =
    role === "homeowner" ? "/homeowner/messages" : "/contractor/messages";

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isAuthenticated) return null;
  if (role !== "homeowner" && role !== "contractor") return null;

  if (location.pathname === messagesRoute) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50" aria-hidden="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={() => setIsOpen(false)}
            aria-label="Close messages drawer"
          />

          <div className="absolute bottom-24 right-5 h-[min(78vh,44rem)] w-[min(96vw,64rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h6>Quick Messages</h6>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close quick messages"
              >
                <X className="size-4" />
              </button>
            </div>
            <MessagesWorkspace mode="compact" onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Open messages"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-50 inline-flex size-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle className="size-6" />
      </button>
    </>
  );
};

export default FloatingMessageBubble;
