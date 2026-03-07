import { Navigate, Outlet } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import HowItWorks from "./pages/HowItWorks";
import CommingSoon from "./pages/CommingSoon";
import Dashboard from "./pages/homeowner/Dashboard";
import { useAuth } from "./stores/useAuth";
import NotFound from "./pages/NotFound";
import EmailVerificationInfo from "./pages/auth/EmailVerificationInfo";
import EmailVerification from "./pages/auth/EmailVerification";
import HomeownerLayout from "./pages/homeowner/HomeownerLayout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Projects from "./pages/homeowner/Projects";
import NewProject from "./pages/homeowner/NewProject";

interface ProtectedRoutesProps {
  allowedRole?: "homeowner" | "contractor" | "admin";
}

const ProtectedRoutes = ({ allowedRole }: ProtectedRoutesProps) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const AuthRoutes = () => {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<CommingSoon />} />
        <Route element={<AuthRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/email-verification-info"
            element={<EmailVerificationInfo />}
          />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoutes allowedRole="homeowner" />}>
          <Route path="/homeowner" element={<HomeownerLayout />}>
            <Route path="/homeowner/dashboard" element={<Dashboard />} />
            <Route path="/homeowner/projects" element={<Projects />} />
            <Route path="/homeowner/projects/new" element={<NewProject />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoutes allowedRole="contractor" />}>
          <Route path="/contractor" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
