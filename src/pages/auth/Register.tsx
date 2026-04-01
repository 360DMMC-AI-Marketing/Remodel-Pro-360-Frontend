import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/stores/useAuth";
import { Spinner } from "@/components/atoms/Spinner";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import logo from "@/assets/logo-transparent.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(400);
  const googleContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signup, googleLogin, isLoading } = useAuth();

  useEffect(() => {
    const el = googleContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setGoogleBtnWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await signup(data);
      navigate("/select-role");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4 py-8">
      <Link
        to="/"
        className="text-primary-500 hover:underline absolute top-5 left-5 flex items-center gap-2 text-base"
      >
        <ArrowLeft size={18} /> Go back to home page
      </Link>
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="logo" className="w-48 mx-auto" />
        <div className="mt-2">
          <h4>Create your account</h4>
          <p className="text-sm text-neutral-600">
            Start your renovation journey today
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow mt-5">
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-left text-sm text-neutral-900">
                  First Name
                </label>
                <Input
                  type="text"
                  id="firstName"
                  placeholder="John"
                  className="w-full mt-2 bg-neutral-100"
                  error={!!errors.firstName}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <span className="text-xs text-red-500 block text-left mt-1">{errors.firstName.message}</span>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="lastName" className="block text-left text-sm text-neutral-900">
                  Last Name
                </label>
                <Input
                  type="text"
                  id="lastName"
                  placeholder="Doe"
                  className="w-full mt-2 bg-neutral-100"
                  error={!!errors.lastName}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <span className="text-xs text-red-500 block text-left mt-1">{errors.lastName.message}</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-left text-sm text-neutral-900">Email</label>
              <Input
                type="email"
                id="email"
                placeholder="abc@example.com"
                className="w-full mt-2 bg-neutral-100"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-red-500 block text-left mt-1">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-left text-sm text-neutral-900">Password</label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="w-full bg-neutral-100 pr-10"
                  error={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 block text-left mt-1">{errors.password.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-left text-sm text-neutral-900">Confirm Password</label>
              <div className="relative mt-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••"
                  className="w-full bg-neutral-100 pr-10"
                  error={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 block text-left mt-1">{errors.confirmPassword.message}</span>
              )}
            </div>

            <Button variant="primary" size="sm" disabled={isLoading} className="disabled:opacity-50">
              {isLoading ? <Spinner size="sm" /> : "Create Account"}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            <div ref={googleContainerRef} className="w-full">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    googleLogin(credentialResponse.credential)
                      .then((res) => {
                        if (!res?.user.role) {
                          navigate("/select-role");
                        } else {
                          toast.success(`Welcome back, ${res?.user.firstName}!`);
                          navigate(`/${res?.user.role}/dashboard`);
                        }
                      })
                      .catch(() => toast.error("Google sign-up failed. Please try again."));
                  }
                }}
                onError={() => toast.error("Google sign-up failed. Please try again.")}
                size="large"
                width={googleBtnWidth}
                text="signup_with"
                shape="rectangular"
              />
            </div>

            <p className="text-sm text-neutral-500">
              Already have an account?{" "}
              <NavLink to="/login" className="text-primary-500 hover:underline">
                Sign in
              </NavLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
