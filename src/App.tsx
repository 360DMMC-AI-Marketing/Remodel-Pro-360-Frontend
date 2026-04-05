import { Navigate, Outlet } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import LandingPage from "./pages/LandingPage";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import CommingSoon from "./pages/CommingSoon";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import EmailVerificationInfo from "./pages/auth/EmailVerificationInfo";
import EmailVerification from "./pages/auth/EmailVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import HomeownerDashboard from "./pages/homeowner/HomeownerDashboard";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Projects from "./pages/homeowner/Projects";
import NewProject from "./pages/homeowner/NewProject";
import HomeownerProfile from "./pages/homeowner/HomeownerProfile";
import PaymentsPage from "./pages/homeowner/PaymentsPage";
import DesignStudio from "./pages/homeowner/DesignStudio";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import { useAuth } from "./stores/useAuth";
import Project from "./pages/homeowner/Project";
import ContractorProfile from "./pages/contractor/ContractorProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContractorVetting from "./pages/admin/ContractorVetting";
import AdminUsers from "./pages/admin/AdminUsers";
import ContractorLeads from "./pages/contractor/ContractorLeads";
import ContractorProjects from "./pages/contractor/ContractorProjects";
import ContractorEarnings from "./pages/contractor/ContractorEarnings";
import ContractorProjectDetails from "./pages/contractor/ContractorProjectDetails";
import MessagesPage from "./pages/messages/MessagesPage";
import FindContractors from "./pages/homeowner/FindContractors";
import ContractorDetails from "./pages/homeowner/ContractorDetails";
import NotificationsPage from "./pages/NotificationsPage";
import SelectRole from "./pages/auth/SelectRole";
import SettingsPage from "./pages/SettingsPage";
import SharedDesign from "./pages/SharedDesign";

interface ProtectedRoutesProps {
  allowedRole?: "homeowner" | "contractor" | "admin";
}

const ProtectedRoutes = ({ allowedRole }: ProtectedRoutesProps) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.role) {
    return <Navigate to="/select-role" replace />;
  }
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const AuthRoutes = () => {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && !role) {
    return <Navigate to="/select-role" replace />;
  }
  if (isAuthenticated && role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  return <Outlet />;
};

const MessagesRouteResolver = () => {
  const { role } = useAuth();

  if (role === "homeowner") {
    return <Navigate to="/homeowner/messages" replace />;
  }

  if (role === "contractor") {
    return <Navigate to="/contractor/messages" replace />;
  }

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<CommingSoon />} />
        <Route element={<AuthRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/email-verification-info"
            element={<EmailVerificationInfo />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/designs/shared/:token" element={<SharedDesign />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/messages" element={<MessagesRouteResolver />} />
        </Route>

        <Route element={<ProtectedRoutes allowedRole="homeowner" />}>
          <Route path="/homeowner" element={<DashboardLayout />}>
            <Route path="/homeowner/dashboard" element={<HomeownerDashboard />} />
            <Route path="/homeowner/design-studio" element={<DesignStudio />} />
            <Route path="/homeowner/projects" element={<Projects />} />
            <Route path="/homeowner/projects/new" element={<NewProject />} />
            <Route path="/homeowner/projects/:id" element={<Project />} />
            <Route path="/homeowner/contractors" element={<FindContractors />} />
            <Route path="/homeowner/contractors/:id" element={<ContractorDetails />} />
            <Route path="/homeowner/messages" element={<MessagesPage />} />
            <Route path="/homeowner/notifications" element={<NotificationsPage />} />
            <Route path="/homeowner/profile" element={<HomeownerProfile />} />
            <Route path="/homeowner/payments" element={<PaymentsPage />} />
            <Route path="/homeowner/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoutes allowedRole="contractor" />}>
          <Route path="/contractor" element={<DashboardLayout />} >
            <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
            <Route path="/contractor/leads" element={<ContractorLeads />} />
            <Route path="/contractor/profile" element={<ContractorProfile />} />
            <Route path="/contractor/projects" element={<ContractorProjects />} />
            <Route path="/contractor/earnings" element={<ContractorEarnings />} />
            <Route path="/contractor/messages" element={<MessagesPage />} />
            <Route path="/contractor/notifications" element={<NotificationsPage />} />
            <Route path="/contractor/settings" element={<SettingsPage />} />
            <Route
              path="/contractor/projects/:id"
              element={<ContractorProjectDetails />}
            />
          </Route>
        </Route>
        <Route element={<ProtectedRoutes allowedRole="admin" />}>
          <Route path="/admin" element={<DashboardLayout />} >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/vetting" element={<ContractorVetting />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
