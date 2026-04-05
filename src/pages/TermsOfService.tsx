import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: April 5, 2026</p>

        <div className="prose prose-neutral prose-sm max-w-none space-y-8 text-neutral-700">

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Remodel Pro 360 ("RP360", "the Service"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and RP360. We reserve the right to
              modify these Terms at any time. Continued use of the Service after modifications constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">2. Description of Service</h2>
            <p>
              RP360 is an AI-powered home renovation platform that connects homeowners with verified contractors.
              The Service includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>AI Design Studio:</strong> Upload room photos and generate AI-powered design visualizations in various styles.</li>
              <li><strong>Contractor Marketplace:</strong> Browse, compare, and hire verified contractors for renovation projects.</li>
              <li><strong>Project Management:</strong> Create projects, manage bids, track milestones, and handle payments.</li>
              <li><strong>Messaging:</strong> Communicate directly with contractors through our built-in messaging system.</li>
              <li><strong>Payments & Escrow:</strong> Secure milestone-based payments processed through Stripe.</li>
              <li><strong>Contract Management:</strong> Electronic contract creation and signing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">3. User Accounts</h2>

            <h3 className="text-base font-medium text-neutral-800 mt-4">3.1 Registration</h3>
            <p>
              To use certain features of the Service, you must create an account. You agree to provide accurate,
              current, and complete information during registration and to keep your account information up to date.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">3.2 Account Types</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Homeowner Accounts:</strong> For individuals seeking renovation services. Homeowners receive initial design credits upon registration.</li>
              <li><strong>Contractor Accounts:</strong> For licensed professionals offering renovation services. Contractors must provide valid license and insurance documentation for verification.</li>
            </ul>

            <h3 className="text-base font-medium text-neutral-800 mt-4">3.3 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to
              notify us immediately of any unauthorized access to your account. RP360 is not liable for any
              loss or damage arising from your failure to protect your account information.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">3.4 Email Verification</h3>
            <p>
              Certain features, including creating projects and generating designs, require a verified email address.
              You agree to verify your email address when prompted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">4. AI Design Studio</h2>

            <h3 className="text-base font-medium text-neutral-800 mt-4">4.1 AI-Generated Content</h3>
            <p>
              The AI Design Studio generates design visualizations based on your uploaded photos and preferences.
              These visualizations are artistic renderings and should not be considered as architectural plans,
              engineering drawings, or construction documents.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">4.2 Uploaded Content</h3>
            <p>
              By uploading photos to the Service, you grant RP360 a non-exclusive, worldwide license to process,
              store, and use your photos solely for the purpose of generating design visualizations and improving
              the Service. You retain all ownership rights to your original photos.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">4.3 Generated Designs</h3>
            <p>
              AI-generated designs are provided "as is" for visualization purposes only. You may save, share,
              and attach designs to projects within the platform. RP360 does not guarantee that generated designs
              are feasible, code-compliant, or structurally sound.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">4.4 Design Credits</h3>
            <p>
              Design generation may consume credits from your account balance. Credit allocation and pricing
              are subject to change. Unused credits have no cash value.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">5. Contractor Marketplace</h2>

            <h3 className="text-base font-medium text-neutral-800 mt-4">5.1 Contractor Verification</h3>
            <p>
              RP360 verifies contractor license and insurance documentation submitted through the platform.
              However, verification does not constitute an endorsement, guarantee of quality, or warranty of
              any contractor's work. Homeowners are responsible for conducting their own due diligence.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">5.2 Bids and Contracts</h3>
            <p>
              Bids submitted by contractors through the platform are binding offers subject to the terms
              specified in each bid. Once a homeowner accepts a bid, both parties are expected to fulfill
              their obligations as outlined in the resulting contract.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">5.3 Relationship Between Users</h3>
            <p>
              RP360 facilitates connections between homeowners and contractors but is not a party to any
              agreement between them. RP360 is not responsible for the quality, safety, legality, or
              completion of any renovation work.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">6. Payments</h2>

            <h3 className="text-base font-medium text-neutral-800 mt-4">6.1 Payment Processing</h3>
            <p>
              All payments are processed securely through Stripe. By making a payment, you agree to
              Stripe's <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Terms of Service</a>.
              RP360 does not store your full payment card details.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">6.2 Escrow and Milestones</h3>
            <p>
              Project payments are held in escrow and released to contractors upon milestone completion
              as approved by the homeowner. Disputes regarding milestone completion or payment release
              should be resolved between the parties, with RP360 available to mediate if necessary.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">6.3 Refunds</h3>
            <p>
              Refund policies for project payments are governed by the terms of the contract between
              the homeowner and contractor. RP360 may facilitate refunds from escrow in cases of dispute
              resolution. Design credit purchases are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide false, misleading, or fraudulent information.</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation.</li>
              <li>Upload content that is illegal, harmful, threatening, abusive, or otherwise objectionable.</li>
              <li>Use the Service to spam, solicit, or harass other users.</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts.</li>
              <li>Use automated tools or bots to access the Service without authorization.</li>
              <li>Interfere with or disrupt the Service or servers.</li>
              <li>Submit false contractor credentials or insurance documentation.</li>
              <li>Circumvent the platform's payment system for project transactions.</li>
              <li>Use AI-generated designs in a manner that infringes on third-party rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">8. Intellectual Property</h2>
            <p>
              The Service, including its design, logos, text, graphics, and software, is owned by RP360
              and protected by intellectual property laws. You may not reproduce, distribute, or create
              derivative works from the Service without our written consent.
            </p>
            <p>
              Content you upload (photos, project descriptions) remains your property. AI-generated designs
              created through the Service may be used by you for personal and project-related purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, RP360 shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Loss of profits, data, or business opportunities.</li>
              <li>Damages arising from contractor work quality, delays, or disputes.</li>
              <li>Inaccuracies in AI-generated design visualizations.</li>
              <li>Unauthorized access to your account or data.</li>
              <li>Service interruptions or technical failures.</li>
            </ul>
            <p className="mt-2">
              RP360's total liability for any claim arising from the Service shall not exceed the amount
              you paid to RP360 in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">10. Disclaimers</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement.
            </p>
            <p>
              RP360 does not guarantee that: the Service will be uninterrupted or error-free; AI-generated
              designs will be accurate or feasible; contractors listed on the platform will perform
              satisfactorily; or that defects will be corrected in a timely manner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">11. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these
              Terms or for any other reason at our discretion. You may delete your account at any time
              through your account settings.
            </p>
            <p>
              Upon termination, your right to use the Service ceases immediately. Data associated with
              your account will be handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">12. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or the Service shall first be attempted to be resolved
              through informal negotiation. If informal resolution is unsuccessful, disputes shall be
              resolved through binding arbitration in accordance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State
              of Illinois, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">14. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <ul className="list-none pl-0 space-y-1">
              <li>Email: <a href="mailto:support@rp360.com" className="text-primary-500 hover:underline">support@rp360.com</a></li>
              <li>Address: Chicago, Illinois, United States</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
