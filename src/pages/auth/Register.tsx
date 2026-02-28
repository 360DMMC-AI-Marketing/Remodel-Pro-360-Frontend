import { Button } from "@/components/atoms/Button"
import { Input } from "@/components/atoms/Input"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router-dom"


const Register = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [role, setRole] = useState<"homeowner" | "contractor" | null>(null)
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        role?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!role) newErrors.role = "Please select a role";
        if (!firstName) newErrors.firstName = "First name is required";
        if (!lastName) newErrors.lastName = "Last name is required";
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email address";
        }
        if (!password) newErrors.password = "Password is required";
        if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
        if (password && confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // Submit form logic here
        }
    };
  return (
    <div className="min-h-screen flex justify-center items-center bg-neutral-100 px-4">
        <div className="w-full max-w-md text-center">
            <h3 className="text-neutral-900">RP360</h3>
            <div className="mt-5">
                <h4>Create your account</h4>
                <p className="text-sm text-neutral-600">Start your renovation journey today</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow mt-5">
                <form action="" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="role" className="block text-left text-sm text-neutral-900">I am</label>
                        <div className="mt-2 flex gap-2">
                            <div
                                className={`py-3 flex-1 border-2 rounded-xl cursor-pointer text-md ${role === "homeowner" ? "text-primary-500 border-primary-600 bg-neutral-100" : "border-neutral-200 text-neutral-400 hover:border-primary-200"}`}
                                onClick={() => setRole("homeowner")}
                            >Homeowner</div>
                            <div
                                className={`py-3 flex-1 border-2 rounded-xl cursor-pointer text-md ${role === "contractor" ? "text-primary-500 border-primary-600 bg-neutral-100" : "border-neutral-200 text-neutral-400 hover:border-primary-200"}`}
                                onClick={() => setRole("contractor")}
                            >Contractor</div>
                        </div>
                        {errors.role && <span className="text-xs text-red-500 block text-left mt-1">{errors.role}</span>}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label htmlFor="firstName" className="block text-left text-sm text-neutral-900">First Name</label>
                            <Input
                                type="text"
                                id="firstName"
                                placeholder="John"
                                className={`w-full mt-2 bg-neutral-100 ${errors.firstName ? 'border border-red-500' : ''}`}
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                            />
                            {errors.firstName && <span className="text-xs text-red-500 block text-left mt-1">{errors.firstName}</span>}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="lastName" className="block text-left text-sm text-neutral-900">Last Name</label>
                            <Input
                                type="text"
                                id="lastName"
                                placeholder="Doe"
                                className={`w-full mt-2 bg-neutral-100 ${errors.lastName ? 'border border-red-500' : ''}`}
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                            />
                            {errors.lastName && <span className="text-xs text-red-500 block text-left mt-1">{errors.lastName}</span>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-left text-sm text-neutral-900">Email</label>
                        <Input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            className={`w-full mt-2 bg-neutral-100 ${errors.email ? 'border border-red-500' : ''}`}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        {errors.email && <span className="text-xs text-red-500 block text-left mt-1">{errors.email}</span>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-left text-sm text-neutral-900">Password</label>
                        <div className="relative mt-2">
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="••••••••"
                                className={`w-full bg-neutral-100 pr-10 ${errors.password ? 'border border-red-500' : ''}`}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.password && <span className="text-xs text-red-500 block text-left mt-1">{errors.password}</span>}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-left text-sm text-neutral-900">Confirm Password</label>
                        <div className="relative mt-2">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                placeholder="••••••••"
                                className={`w-full bg-neutral-100 pr-10 ${errors.confirmPassword ? 'border border-red-500' : ''}`}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className="text-xs text-red-500 block text-left mt-1">{errors.confirmPassword}</span>}
                    </div>
                    <Button variant="primary" size="sm">Create Account</Button>
                    <p className="text-sm text-neutral-500">Already have an account? <NavLink to="/login" className="text-primary-500 hover:underline">Sign in</NavLink></p>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Register