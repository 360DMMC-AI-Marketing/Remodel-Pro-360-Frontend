import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { paymentService, type EscrowPaymentResponse } from "@/api/payment";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  projectId: string;
  onSuccess: () => void | Promise<void>;
  onClose: () => void;
}

interface CheckoutFormProps {
  paymentData: EscrowPaymentResponse;
  onSuccess: () => void | Promise<void>;
  onClose: () => void;
}

const CheckoutForm = ({ paymentData, onSuccess, onClose }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    try {
      setProcessing(true);
      setError(null);

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed. Please try again.");
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        await paymentService.confirmEscrowPayment(paymentIntent.id);
        await onSuccess();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
        <div className="flex justify-between text-sm text-neutral-600">
          <span>Contract total</span>
          <span className="font-medium text-neutral-900">
            ${paymentData.contractTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm text-neutral-600">
          <span>Platform fee (4%)</span>
          <span className="font-medium text-neutral-900">
            ${paymentData.homeownerFee.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm font-semibold text-neutral-900">
          <span>Total charge</span>
          <span className="text-indigo-600">
            ${paymentData.amount.toLocaleString()}
          </span>
        </div>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!stripe || !elements || processing}
        >
          {processing ? "Processing..." : `Pay $${paymentData.amount.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
};

export const PaymentForm = ({ projectId, onSuccess, onClose }: PaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<EscrowPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose]);

  useEffect(() => {
    let cancelled = false;

    const createPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.createEscrowPayment(projectId);
        if (!cancelled) {
          setClientSecret(data.clientSecret);
          setPaymentData(data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to initialize payment. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void createPayment();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return createPortal(
    <div className="fixed inset-0 z-1400 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 pt-5 pb-3 border-b border-neutral-100">
          <div>
            <h5 className="text-lg font-semibold text-neutral-900">Fund Project</h5>
            <p className="text-xs text-neutral-500">Securely deposit funds into escrow</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-neutral-500">Preparing payment...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : clientSecret && paymentData ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#4f46e5",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <CheckoutForm
                paymentData={paymentData}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};
