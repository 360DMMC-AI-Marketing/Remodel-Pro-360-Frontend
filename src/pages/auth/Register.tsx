import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, NavLink } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/stores/useAuth";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/atoms/Spinner";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import logo from "@/assets/logo-transparent.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(400);
  const googleContainerRef = useRef<HTMLDivElement>(null);

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
    setValue,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  type role = "homeowner" | "contractor";
  const selectedRole = watch("role");

  const { signup, googleLogin, isLoading } = useAuth();

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await signup(data);
      navigate("/email-verification-info");
    } catch (error: any) {
      const errorObject = { error };
      const errorMessage = errorObject.error.response.data.error;
      console.log(errorMessage);
      toast(errorMessage);
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4 py-2">
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
            <div>
              <div>
                <label className="block text-left text-sm font-medium text-neutral-900 mb-3">
                  I am a ...
                </label>
                <RadioGroup
                  onValueChange={(value) =>
                    setValue("role", value as role, { shouldValidate: true })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  {/* Homeowner button*/}
                  <div>
                    <RadioGroupItem
                      value="homeowner"
                      id="homeowner"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="homeowner"
                      className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all cursor-pointer
                      ${
                        selectedRole === "homeowner"
                          ? "border-primary-600 bg-primary-50/30 text-primary-700"
                          : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >
                      <span className="font-semibold text-md">Homeowner</span>
                    </Label>
                  </div>

                  {/* Contracotr button*/}
                  <div>
                    <RadioGroupItem
                      value="contractor"
                      id="contractor"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="contractor"
                      className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all cursor-pointer
                      ${
                        selectedRole === "contractor"
                          ? "border-primary-600 bg-primary-50/30 text-primary-700"
                          : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >
                      <span className="font-semibold text-md">Contractor</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <span className="text-xs text-red-500 block text-left mt-2 italic">
                    {errors.role.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label
                  htmlFor="firstName"
                  className="block text-left text-sm text-neutral-900"
                >
                  First Name
                </label>
                <Input
                  type="text"
                  id="firstName"
                  placeholder="John"
                  className={`w-full mt-2 bg-neutral-100`}
                  error={errors.firstName ? true : false}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <span className="text-xs text-red-500 block text-left mt-1">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <label
                  htmlFor="lastName"
                  className="block text-left text-sm text-neutral-900"
                >
                  Last Name
                </label>
                <Input
                  type="text"
                  id="lastName"
                  placeholder="Doe"
                  className={`w-full mt-2 bg-neutral-100`}
                  error={errors.lastName ? true : false}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <span className="text-xs text-red-500 block text-left mt-1">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-left text-sm text-neutral-900"
              >
                Email
              </label>
              <Input
                type="email"
                id="email"
                placeholder="abc@example.com"
                className={`w-full mt-2 bg-neutral-100`}
                error={errors.email ? true : false}
                {...register("email")}
              />
              {errors.email && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-left text-sm text-neutral-900"
              >
                Password
              </label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className={`w-full bg-neutral-100 pr-10`}
                  error={errors.password ? true : false}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-left text-sm text-neutral-900"
              >
                Confirm Password
              </label>
              <div className="relative mt-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••"
                  className={`w-full bg-neutral-100 pr-10`}
                  error={errors.confirmPassword ? true : false}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="disabled:opacity-50"
            >
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
                        toast.success(`Welcome, ${res?.user.firstName}!`);
                        navigate(`/${res?.user.role}/dashboard`);
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
