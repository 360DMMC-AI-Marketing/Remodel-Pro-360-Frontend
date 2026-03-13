import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { useAuth } from "@/stores/useAuth";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo-transparent.png";

const EmailVerification = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid token");
      return;
    }
    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage("Email verified successfully");
        navigate(`/${response.user.role}/dashboard`);
      } catch (error) {
        setStatus("error");
        setMessage("Verification link is invalid or expired.");
        console.log(error)
      }
    };
    verify();
  }, []);
  return (
    <div className="bg-neutral-100 h-screen w-screen flex justify-center items-center">
      <div className="text-center">
        <img src={logo} alt="RP360 Logo" className="w-64 mx-auto"/>
        <p className="text-lg font-bold">Verify your email</p>
        <p className="text-sm text-neutral-500">
          Please check your email for a verification link
        </p>
        {status === "success" && (
          <div className="text-green-500">
            <p>Email verified successfully. Redirecting to dashboard...</p>
          </div>
        )}
        {status === "error" && (
          <div className="text-red-500 flex flex-col items-center gap-2">
            <p>{message}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/register")}
            >
              <Link to="/register">Register</Link>
            </Button>
          </div>
        )}
      </div>
      {status === "loading" && (
        <div className="text-center">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
