import { Container } from "../atoms/Container";

const Footer = () => {
  return (
    <div className="w-full py-12 bg-neutral-100">
      <Container className="space-y-8">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-neutral-900">RP360</h3>
            <p className="text-neutral-700 text-sm">
              AI-powered home renovation made simple.
            </p>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">Platform</h6>
            <ul>
                <li className="text-neutral-500 text-sm">How It Works</li>
                <li className="text-neutral-500 text-sm">Pricing</li>
                <li className="text-neutral-500 text-sm">Contact Us</li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">For Contractors</h6>
            <ul>
                <li className="text-neutral-500 text-sm">Join As Contractor</li>
                <li className="text-neutral-500 text-sm">Lead Management</li>
                <li className="text-neutral-500 text-sm">Resources</li>
            </ul>
          </div>
          <div>
            <h6 className="mb-3 text-sm font-semibold">Support</h6>
            <ul>
                <li className="text-neutral-500 text-sm">Help Center</li>
                <li className="text-neutral-500 text-sm">Contact us</li>
                <li className="text-neutral-500 text-sm">Privacy Policy</li>
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
