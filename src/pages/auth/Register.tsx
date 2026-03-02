import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavLink } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...dataToSend } = data;
    console.log(confirmPassword);
    console.log(dataToSend);
    // Submit form logic here
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4">
      <div className="w-full max-w-md text-center">
        <h3 className="text-neutral-900">RP360</h3>
        <div className="mt-5">
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
              {/* <div className="mt-2 flex gap-2">
                <div
                  className={`py-3 flex-1 border-2 rounded-xl cursor-pointer text-md ${watch("role") === "homeowner" ? "text-primary-500 border-primary-600 bg-neutral-100" : "border-neutral-200 text-neutral-400 hover:border-primary-200"}`}
                  onClick={() =>
                    setValue("role", "homeowner", { shouldValidate: true })
                  }
                >
                  Homeowner
                </div>
                <div
                  className={`py-3 flex-1 border-2 rounded-xl cursor-pointer text-md ${watch("role") === "contractor" ? "text-primary-500 border-primary-600 bg-neutral-100" : "border-neutral-200 text-neutral-400 hover:border-primary-200"}`}
                  onClick={() =>
                    setValue("role", "contractor", { shouldValidate: true })
                  }
                >
                  Contractor
                </div>
              </div>
              {errors.role && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.role.message}
                </span>
              )} */}
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
            <Button variant="primary" size="sm">
              Create Account
            </Button>
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
