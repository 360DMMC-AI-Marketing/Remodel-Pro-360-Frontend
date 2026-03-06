import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { emailSchema, type EmailForm } from "@/schemas/auth";
import { useAuth } from "@/stores/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";


const ForgotPassword = () => {
    const { isLoading, sendPasswordReset } = useAuth();
    const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<EmailForm>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
          email: "",
        },
      });

      const onSubmit = async (data: {email: string}) => {
        const {email} = data
        console.log(email)
        try {
          await sendPasswordReset(email);
          toast('Password Link Sent To Your Email')
        } catch (error) {
          console.log(error)
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
            Enter your email and we'll send you a reset link
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
            <Button
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="disabled:opacity-50"
            >
              {isLoading ? <Spinner size="sm" /> : "Send Reset Link"}
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

export default ForgotPassword;
