import React from 'react';
import { Footer } from '../components/Footer';

export function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: 13 August 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>These Terms and Conditions ("Terms") govern the use of IDSphere.</p>
          <p>IDSphere is powered by Metadox Digital.</p>
          <p>By using IDSphere, you agree to these Terms and Conditions.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">1. ABOUT IDSPHERE</h2>
          <p>IDSphere is a digital identity management platform that allows organizations to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Create registration forms.</li>
            <li>Collect registration information.</li>
            <li>Review registrations.</li>
            <li>Verify users.</li>
            <li>Store identity photographs.</li>
            <li>Generate digital identity cards.</li>
            <li>Provide QR-based identity verification.</li>
            <li>Send service-related email notifications.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">2. USER ACCOUNTS</h2>
          <p>Users must provide accurate information when creating or using an IDSphere account.</p>
          <p>Users are responsible for maintaining the security of their authentication credentials and account.</p>
          <p>Users must not attempt to access organizations, registrations, identities, or information that they are not authorized to access.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">3. ORGANIZATION ADMINISTRATORS</h2>
          <p>Organization administrators are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Using the platform only for legitimate organizational purposes.</li>
            <li>Ensuring that registration forms collect appropriate information.</li>
            <li>Ensuring they have the necessary authority to collect and process submitted information.</li>
            <li>Protecting access to administrator accounts.</li>
            <li>Reviewing and verifying registrations appropriately.</li>
            <li>Managing organization data responsibly.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">4. REGISTRATION INFORMATION</h2>
          <p>Information submitted through an organization's registration form is provided for processing by that organization.</p>
          <p>IDSphere provides the technical platform for collecting and managing that information.</p>
          <p>The organization is responsible for determining what information it collects and ensuring that its collection and processing comply with applicable laws and policies.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">5. DIGITAL IDENTITY CARDS</h2>
          <p>IDSphere may generate digital identity cards after an organization verifies a registration.</p>
          <p>An identity card may contain information such as:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Organization name</li>
            <li>Student/member name</li>
            <li>Photograph</li>
            <li>QR code</li>
          </ul>
          <p>The exact information displayed may depend on the organization's configuration.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">6. QR VERIFICATION</h2>
          <p>IDSphere may provide QR-based identity verification.</p>
          <p>A QR code may allow a verifier to access identity information made available by the organization.</p>
          <p>Users must not attempt to manipulate, forge, duplicate, or misuse digital identities or QR verification systems.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">7. ACCEPTABLE USE</h2>
          <p>Users must not:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Attempt unauthorized access.</li>
            <li>Attempt to bypass authentication or authorization.</li>
            <li>Upload malicious files.</li>
            <li>Upload content they do not have permission to use.</li>
            <li>Create fraudulent identities.</li>
            <li>Forge identity cards.</li>
            <li>Manipulate QR verification.</li>
            <li>Abuse the platform.</li>
            <li>Interfere with the operation or security of the service.</li>
            <li>Use the platform for unlawful purposes.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">8. PHOTO UPLOADS</h2>
          <p>Users must only upload photographs they have permission to provide.</p>
          <p>Photographs must not contain unlawful, abusive, or malicious content.</p>
          <p>IDSphere may reject or remove content that violates these Terms and Conditions or creates a security or operational risk.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">9. THIRD-PARTY SERVICES</h2>
          <p>IDSphere relies on third-party services to provide parts of its functionality.</p>
          <p>These may include:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Google services</li>
            <li>Firebase</li>
            <li>Supabase</li>
            <li>SMTP/email providers</li>
            <li>Hosting infrastructure</li>
          </ul>
          <p>Availability of these third-party services may affect parts of IDSphere.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">10. SERVICE AVAILABILITY</h2>
          <p>IDSphere is provided on an availability basis.</p>
          <p>We may temporarily suspend or modify parts of the service for:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Maintenance</li>
            <li>Security</li>
            <li>Updates</li>
            <li>Infrastructure problems</li>
            <li>Third-party service outages</li>
            <li>Legal or regulatory requirements</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">11. ACCOUNT SUSPENSION</h2>
          <p>IDSphere may restrict or suspend access where necessary to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Protect the platform.</li>
            <li>Prevent abuse.</li>
            <li>Investigate unauthorized access.</li>
            <li>Comply with legal requirements.</li>
            <li>Address violations of these Terms and Conditions.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">12. DATA DELETION</h2>
          <p>Organizations can delete their registration, user, identity, and other applicable data using the available IDSphere administrative functionality.</p>
          <p>Once data is permanently deleted by the organization, IDSphere no longer retains that data for normal application use.</p>
          <p>IDSphere does not intentionally retain deleted organization data after it has been permanently deleted from the system.</p>
          <p>Organizations are responsible for ensuring that they retain or delete information according to their own legal and organizational requirements.</p>
          <p>Some temporary technical copies, backups, logs, or security records may exist for a limited period where necessary for system security, reliability, fraud prevention, or legal obligations.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">13. REGISTRATION CONSENT</h2>
          <p>Before submitting a registration through an IDSphere registration form, users must explicitly agree to the Privacy Policy and Terms and Conditions by selecting the mandatory consent checkbox.</p>
          <p>Users who do not select the checkbox will not be able to submit their registration.</p>
          <p>The Privacy Policy and Terms and Conditions are linked directly from the consent statement so users can review them before completing registration.</p>
          <p>No separate consent log is maintained for this checkbox. The consent requirement is enforced directly as part of the registration submission process.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">14. INTELLECTUAL PROPERTY</h2>
          <p>The IDSphere software, branding, interface, and original platform materials are protected by applicable intellectual-property laws.</p>
          <p>Users retain ownership of information and content they submit, subject to the rights necessary for IDSphere and the relevant organization to provide the service.</p>
          <p>IDSphere is powered by Metadox Digital.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">15. DISCLAIMER</h2>
          <p>IDSphere provides software infrastructure for digital identity management.</p>
          <p>IDSphere does not independently verify the accuracy of information submitted by users.</p>
          <p>Organizations are responsible for verifying registration information and deciding whether to issue an identity.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">16. CHANGES TO THESE TERMS AND CONDITIONS</h2>
          <p>These Terms and Conditions may be updated when the platform or its requirements change.</p>
          <p>The "Last Updated" date will be updated when material changes are made.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">17. CONTACT</h2>
          <p>For questions about these Terms and Conditions:</p>
          <p>
            <a href="mailto:metadoxdigital@gmail.com" className="text-blue-600 hover:underline">metadoxdigital@gmail.com</a>
          </p>
          
          <p className="mt-8 pt-6 border-t border-slate-200">
            IDSphere is powered by Metadox Digital.
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
