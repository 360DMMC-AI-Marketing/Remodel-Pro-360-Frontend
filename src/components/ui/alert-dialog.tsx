import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";

interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  variant?: "danger" | "info";
  warningText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const AlertDialog = ({
  open,
  title,
  description,
  variant = "danger",
  warningText = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  loadingLabel,
  onConfirm,
  onClose,
}: AlertDialogProps) => {
  const isDanger = variant === "danger";
  const iconColor = isDanger ? "bg-error/10 text-error" : "bg-primary-100 text-primary-600";
  const bannerColor = isDanger
    ? "border-error/15 bg-error/5"
    : "border-primary-200 bg-primary-50";
  const confirmVariant = isDanger ? "danger" : "primary";
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isLoading, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-1400 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-sm"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        {/* <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary-500 via-secondary-500 to-primary-600" /> */}

        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center shrink-0 rounded-full shadow-sm ${iconColor}`}>
              {isDanger ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
            </div>
            <div>
              <h4 className="text-xl font-semibold text-foreground">{title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss dialog"
            className="cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className={`rounded-2xl border p-4 text-sm text-neutral-700 ${bannerColor}`}>
            {warningText}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (loadingLabel ?? "Processing...") : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};