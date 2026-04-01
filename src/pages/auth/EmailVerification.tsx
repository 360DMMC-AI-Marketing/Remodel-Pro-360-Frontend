import { Spinner } from "@/components/atoms/Spinner";
import { useAuth } from "@/stores/useAuth";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import logo from "@/assets/logo-transparent.png";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useAuth();
  const called = useRef(false);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid verification link. No token found.",
  );

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    verifyEmail(token)
      .then((response) => {
        setStatus("success");
        setMessage("Your email has been verified!");
        setTimeout(() => {
          const role = response?.user?.role;
          navigate(!role ? "/select-role" : `/${role}/dashboard`);
        }, 1500);
      })
      .catch(() => {
        setStatus("error");
        setMessage("This verification link is invalid or has expired.");
      });
  }, [token, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm text-center">
        <img src={logo} alt="RP360" className="w-40 mx-auto mb-6" />

        {status === "loading" && (
          <div className="space-y-3">
            <Spinner size="md" />
            <p className="text-sm text-neutral-500">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <p className="text-lg font-semibold text-neutral-900">{message}</p>
            <p className="text-sm text-neutral-500">Redirecting you now...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle size={48} className="mx-auto text-red-400" />
            <p className="text-lg font-semibold text-neutral-900">Verification failed</p>
            <p className="text-sm text-neutral-500">{message}</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
