import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: April 5, 2026</p>

        <div className="prose prose-neutral prose-sm max-w-none space-y-8 text-neutral-700">

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">1. Introduction</h2>
            <p>
              Remodel Pro 360 ("RP360", "we", "us", or "our") operates the RP360 platform, including our website,
              mobile applications, and related services (collectively, the "Service"). This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p>
              By accessing or using the Service, you agree to this Privacy Policy. If you do not agree with the
              terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">2. Information We Collect</h2>

            <h3 className="text-base font-medium text-neutral-800 mt-4">2.1 Personal Information</h3>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile photo.</li>
              <li><strong>Address Information:</strong> Street address, city, state, zip code, and geographic coordinates for project locations and contractor service areas.</li>
              <li><strong>Contractor Information:</strong> Company name, biography, license numbers and expiry dates, insurance details, specialties, and years of experience.</li>
              <li><strong>Payment Information:</strong> Payment details are processed securely through Stripe. We do not store your full credit card numbers on our servers.</li>
              <li><strong>Identity Verification:</strong> Contractor license documents and insurance certificates uploaded for verification purposes.</li>
            </ul>

            <h3 className="text-base font-medium text-neutral-800 mt-4">2.2 Room Photos and Design Data</h3>
            <p>
              When you use our AI Design Studio, we collect photos of your rooms that you upload, your design style
              preferences, room dimensions, custom instructions, and the AI-generated design images. These images
              are stored securely on Amazon Web Services (AWS) S3 cloud storage.
            </p>

            <h3 className="text-base font-medium text-neutral-800 mt-4">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform, and interaction patterns.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
              <li><strong>Cookies:</strong> We use cookies and similar technologies to maintain your session, remember preferences, and improve our Service.</li>
            </ul>

            <h3 className="text-base font-medium text-neutral-800 mt-4">2.4 Communication Data</h3>
            <p>
              Messages exchanged between homeowners and contractors through our platform messaging system are stored
              to facilitate project communication and for dispute resolution purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account.</li>
              <li>Generate AI-powered room design visualizations based on your photos and preferences.</li>
              <li>Match homeowners with verified contractors based on project requirements and location.</li>
              <li>Process payments and manage escrow for project milestones through Stripe.</li>
              <li>Send transactional emails (bid notifications, project updates, milestone alerts) via SendGrid.</li>
              <li>Send SMS notifications via Twilio when enabled.</li>
              <li>Verify contractor licenses and insurance documentation.</li>
              <li>Facilitate real-time messaging between homeowners and contractors.</li>
              <li>Enable electronic contract signing.</li>
              <li>Improve and personalize our Service.</li>
              <li>Detect and prevent fraud or abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">4. Third-Party Services</h2>
            <p>We share your information with the following third-party service providers who assist us in operating the Service:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-neutral-700">Provider</th>
                    <th className="text-left px-4 py-2 font-medium text-neutral-700">Purpose</th>
                    <th className="text-left px-4 py-2 font-medium text-neutral-700">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr><td className="px-4 py-2">Stripe</td><td className="px-4 py-2">Payment processing & escrow</td><td className="px-4 py-2">Payment details, transaction data</td></tr>
                  <tr><td className="px-4 py-2">Amazon Web Services (S3)</td><td className="px-4 py-2">File and image storage</td><td className="px-4 py-2">Uploaded photos, documents, generated designs</td></tr>
                  <tr><td className="px-4 py-2">Google OAuth</td><td className="px-4 py-2">Authentication</td><td className="px-4 py-2">Email, name, profile picture</td></tr>
                  <tr><td className="px-4 py-2">SendGrid</td><td className="px-4 py-2">Transactional emails</td><td className="px-4 py-2">Email address, notification content</td></tr>
                  <tr><td className="px-4 py-2">Twilio</td><td className="px-4 py-2">SMS notifications</td><td className="px-4 py-2">Phone number, message content</td></tr>
                  <tr><td className="px-4 py-2">NVIDIA / AI Providers</td><td className="px-4 py-2">AI design generation</td><td className="px-4 py-2">Room photos, design prompts</td></tr>
                  <tr><td className="px-4 py-2">HelloSign</td><td className="px-4 py-2">Electronic signatures</td><td className="px-4 py-2">Contract documents, signer information</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Each third-party provider is bound by their own privacy policies and data processing agreements.
              We encourage you to review their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">5. Data Storage and Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is stored on secure servers using MongoDB with encryption at rest.</li>
              <li>Files and images are stored on Amazon S3 with server-side encryption and accessed via signed URLs with limited expiration.</li>
              <li>Passwords are hashed using industry-standard algorithms and are never stored in plain text.</li>
              <li>All data in transit is encrypted using TLS/HTTPS.</li>
              <li>Authentication tokens (JWT) are used for session management with automatic expiration and refresh mechanisms.</li>
              <li>Payment data is handled exclusively by Stripe and never touches our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data and account.</li>
              <li><strong>Portability:</strong> Request your data in a structured, commonly used format.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable.</li>
              <li><strong>Notification Preferences:</strong> Control which email and SMS notifications you receive through your account settings.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at <a href="mailto:support@rp360.com" className="text-primary-500 hover:underline">support@rp360.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              you with the Service. Project data, including designs, messages, and contracts, is retained for
              the duration of the project and a reasonable period thereafter for record-keeping and dispute
              resolution purposes.
            </p>
            <p>
              When you delete your account, we will delete or anonymize your personal information within 30 days,
              except where retention is required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">8. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date. Your
              continued use of the Service after any changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
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

export default PrivacyPolicy;
