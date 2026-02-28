import { Button } from "@/components/atoms/Button"
import { Input } from "@/components/atoms/Input"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { NavLink } from "react-router-dom"


const Login = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email address";
        }
        if (!password) {
            newErrors.password = "Password is required";
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
                <h4>Welcome Back</h4>
                <p className="text-sm text-neutral-600">Sign in to your account to continue</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow mt-10">
                <form action="" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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
                    <Button variant="primary" size="sm">Login</Button>
                    <p className="text-sm text-neutral-500">Don't have an account? <NavLink to="/register" className="text-primary-500 hover:underline">Sign up</NavLink></p>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Login