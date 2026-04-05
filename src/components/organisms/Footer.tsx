import { Container } from "../atoms/Container";
import { Link } from "react-router-dom";
import horizontalLogo from "@/assets/horizontal-logo.png";

const Footer = () => {
  return (
    <div className="w-full py-12 bg-white border-t border-t-neutral-200">
      <Container className="space-y-8">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link to="/">
              <img src={horizontalLogo} alt="Remodel Pro 360" className="h-8 w-auto mb-2" />
            </Link>
            <p className="text-neutral-700 text-sm">
              AI-powered home renovation made simple.
            </p>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">Platform</h6>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">For Homeowners</h6>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Start Your Project
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Browse Contractors
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Support & FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">For Contractors</h6>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Join As Contractor
                </Link>
              </li>
              <li>
                <a href="#" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Lead Management
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Resources
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">Support</h6>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-neutral-500 text-sm hover:text-primary-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="w-full h-px bg-neutral-300"></div>
        <span className="text-neutral-500 text-sm text-center block">
          © 2026 Remodel Pro360. All rights reserved.
        </span>
      </Container>
    </div>
  );
};

export default Footer;
