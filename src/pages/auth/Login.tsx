import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/stores/useAuth";
import { Spinner } from "@/components/atoms/Spinner";
import { toast } from "sonner";
import logo from "@/assets/logo-transparent.png"

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await login(data);
      navigate(`/${response?.user.role}/dashboard`);
    } catch (error) {
      console.log(error);
      toast.error("Invalid email or password");
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4">
      <Link
        to="/"
        className="text-primary-500 hover:underline absolute top-5 left-5 flex items-center gap-2 text-base"
      >
        <ArrowLeft size={18} /> Go back to home page
      </Link>
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="logo" className="w-48 mx-auto" />
        <div className="mt-2">
          <h4>Welcome Back</h4>
          <p className="text-sm text-neutral-600">
            Sign in to your account to continue
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow mt-10">
          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
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
                placeholder="Enter your email"
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
              <Link
                to="/forgot-password"
                className="block w-full mt-2 text-neutral-600 text-xs text-right hover:text-primary-600 hover:underline"
              >
                Forgot password?
              </Link>
              {errors.password && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="disabled:opacity-50"
            >
              {isLoading ? <Spinner size="sm" /> : "Login"}
            </Button>
            <p className="text-sm text-neutral-500">
              Don't have an account?{" "}
              <NavLink
                to="/register"
                className="text-primary-500 hover:underline"
              >
                Sign up
              </NavLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
