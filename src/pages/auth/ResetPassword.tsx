import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { resetPasswordSchema, type ResetPasswordForm } from "@/schemas/auth";
import { useAuth } from "@/stores/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router-dom";


const ResetPassword = () => {
    const { isLoading, resetPassword } = useAuth();
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
          newPassword: "",
          confirmNewPassword: "",
        },
      });

      const onSubmit = async (data: ResetPasswordForm) => {
          const token = searchParams.get("token") as string
          const payload: ResetPasswordForm = {
            token,
            ...data
          }
        console.log(data)
        console.log(token)
        console.log(payload)
        try {
            await resetPassword(payload);
            navigate('/login')
        } catch (error) {
            console.log({error})
        }
      }
  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4">
      <Link
        to="/"
        className="text-primary-500 hover:underline absolute top-5 left-5 flex items-center gap-2 text-base"
      >
        <ArrowLeft size={18} /> Go back to home page
      </Link>
      <div className="w-full max-w-md text-center">
        <h3 className="text-neutral-900">RP360</h3>
        <div className="mt-5">
          <h4>Reset your password</h4>
          <p className="text-sm text-neutral-600">
            Enter your new Password
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
                htmlFor="new-password"
                className="block text-left text-sm text-neutral-900"
              >
                New Password
              </label>
              <div className="relative mt-2">
              <Input
                type={showNewPassword ? "text" : "password"}
                id="new-password"
                placeholder="Enter your new password"
                className={`w-full bg-neutral-100`}
                error={errors.newPassword ? true : false}
                {...register("newPassword")}
              />
              <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.newPassword.message}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-left text-sm text-neutral-900"
              >
                Confirm New Password
              </label>
              <div className="relative mt-2">
              <Input
                type={showConfirmNewPassword ? "text" : "password"}
                id="confirm-new-password"
                placeholder="Confirm your new password"
                className={`w-full bg-neutral-100`}
                error={errors.confirmNewPassword ? true : false}
                {...register("confirmNewPassword")}
              />
              <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                >
                  {showConfirmNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <span className="text-xs text-red-500 block text-left mt-1">
                  {errors.confirmNewPassword.message}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="disabled:opacity-50"
            >
              {isLoading ? <Spinner size="sm" /> : "Reset Password"}
            </Button>
            <Link to="/login" className="text-primary-500 text-base hover:underline w-fit flex items-center gap-1 mx-auto">
                <ArrowLeft size={18}/> Back to Sign In
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
