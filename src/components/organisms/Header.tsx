import { Button } from "../atoms/Button";
import { Container } from "../atoms/Container";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/stores/useAuth";
import { Avatar } from "../atoms/Avatar";
import { getImageUrl } from "@/lib/utils";
import logo from "@/assets/logo-transparent.png";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, isAuthenticated, user } = useAuth();
  console.log(user)
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-b-neutral-200 h-header">
      <Container className="h-full flex items-center justify-between">
        <NavLink to="/">
          <img src={logo} alt="logo" className="w-26" />
        </NavLink>
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
          </nav>
          <div>
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-4">
                  <Link to={`/${user?.role}/dashboard`}>
                    {user?.avatar ? (
                      <Avatar
                        src={getImageUrl(user.avatar)}
                        size={48}
                        className="text-primary-700"
                      />
                    ) : (
                      <div className="size-12 flex justify-center items-center rounded-full bg-primary-200 text-primary-600">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </div>
                    )}
                  </Link>
                  <Button variant="danger" size="sm" onClick={logout}>
                    <LogOut /> Log Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="mr-2">
                  <NavLink to="/login">Log In</NavLink>
                </Button>
                <Button variant="primary" size="sm">
                  <NavLink to="/register">Get Started</NavLink>
                </Button>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden cursor-pointer"
        >
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </Container>
      {isOpen && (
        <div className="md:hidden bg-white border-y border-y-neutral-200">
          <nav className="flex flex-col items-start gap-4 p-4">
            <NavLink
              to="/"
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              How It Works
            </NavLink>
            <NavLink
              to="/pricing"
              className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
            >
              Pricing
            </NavLink>
            <div className="mt-4 w-full">
              <Button variant="ghost" size="sm" className="w-full mb-2">
                <NavLink to="/login">Log In</NavLink>
              </Button>
              <Button variant="primary" size="sm" className="w-full">
                <NavLink to="/register">Get Started</NavLink>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
