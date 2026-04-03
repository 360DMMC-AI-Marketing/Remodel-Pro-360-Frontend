import { Button } from "../atoms/Button";
import { Container } from "../atoms/Container";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/stores/useAuth";
import { getImageUrl } from "@/lib/utils";
import logo from "@/assets/logo-transparent.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = `/${user?.role}/dashboard`;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-b-neutral-200 h-header">
      <Container className="h-full flex items-center justify-between">
        <NavLink to="/">
          <img src={logo} alt="logo" className="w-26" />
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden md:flex h-full items-center gap-10">
          <nav>
            <NavLink
              to="/how-it-works"
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              How It Works
            </NavLink>
            <NavLink
              to="/pricing"
              className="ml-6 text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              Pricing
            </NavLink>
            <NavLink
              to="/contact"
              className="ml-6 text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              Contact
            </NavLink>
          </nav>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to={dashboardPath}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith("http") ? user.avatar : getImageUrl(user.avatar)}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="size-10 rounded-full object-cover ring-2 ring-neutral-200"
                    />
                  ) : (
                    <div className="size-10 flex justify-center items-center rounded-full bg-primary-200 text-sm font-semibold text-primary-600">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                </Link>
                <Button variant="danger" size="sm" onClick={logout}>
                  <LogOut size={16} /> Log Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate("/login")}>
                  Log In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate("/register")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden cursor-pointer"
        >
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </Container>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-y border-y-neutral-200">
          <nav className="flex flex-col items-start gap-4 p-4">
            <NavLink
              to="/how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              How It Works
            </NavLink>
            <NavLink
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              Pricing
            </NavLink>
            <NavLink
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              Contact
            </NavLink>
            <div className="mt-4 w-full flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => { setIsOpen(false); navigate(dashboardPath); }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => { setIsOpen(false); logout(); }}
                  >
                    <LogOut size={16} /> Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => { setIsOpen(false); navigate("/login"); }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => { setIsOpen(false); navigate("/register"); }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
