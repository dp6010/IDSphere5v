import React from 'react';
import { Footer } from '../components/Footer';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: 13 August 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            IDSphere ("IDSphere", "we", "us", or "our") is a digital identity management platform powered by Metadox Digital.
          </p>
          <p>
            IDSphere helps organizations collect registration information, review registrations, verify users, issue digital identity cards, and provide QR-based identity verification.
          </p>
          <p>
            This Privacy Policy explains what information IDSphere collects, how it is used, where it is stored, and how users can contact us regarding their information.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">1. INFORMATION WE COLLECT</h2>
          <p>Depending on how IDSphere is used, the platform may process:</p>
          
          <h3 className="font-semibold mt-4">Account Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name associated with an authenticated Google account</li>
            <li>Email address</li>
            <li>Google account identifier necessary for authentication</li>
          </ul>

          <h3 className="font-semibold mt-4">Registration Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full name</li>
            <li>Date of birth</li>
            <li>Address</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Organization-defined registration fields</li>
            <li>Other information intentionally submitted through an organization's registration form</li>
          </ul>

          <h3 className="font-semibold mt-4">Identity Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Student/member photograph</li>
            <li>Digital identity information</li>
            <li>Identity status</li>
            <li>Registration and verification information</li>
            <li>QR-code-related identity information</li>
          </ul>

          <h3 className="font-semibold mt-4">Technical Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authentication/session information</li>
            <li>Basic technical information required to operate and secure the service</li>
          </ul>
          <p className="mt-4">
            IDSphere only collects information that is necessary for the functionality provided by the platform or intentionally submitted through an organization's registration process.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">2. HOW WE USE INFORMATION</h2>
          <p>Information may be used to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Authenticate users and administrators.</li>
            <li>Provide access to IDSphere.</li>
            <li>Allow organization administrators to manage their organization.</li>
            <li>Process registration submissions.</li>
            <li>Allow authorized organization administrators to review and verify registrations.</li>
            <li>Store and display student/member photographs.</li>
            <li>Generate digital identity cards.</li>
            <li>Generate QR codes for identity verification.</li>
            <li>Provide QR-based identity verification where enabled.</li>
            <li>Send registration, photo-upload, verification, and digital-ID email notifications.</li>
            <li>Maintain application security and prevent abuse.</li>
            <li>Diagnose technical problems and maintain the service.</li>
          </ul>
          <p>
            IDSphere does not use registration information for unrelated advertising or marketing purposes.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">3. GOOGLE ACCOUNT AND GOOGLE API DATA</h2>
          <p>
            IDSphere may use Google services and Google APIs as part of organization functionality.
          </p>
          <p>
            Depending on the organization's configuration, authorized organization administrators may grant IDSphere access to Google services such as Google Forms, Google Sheets, and Google Drive.
          </p>
          <p>This access may be used for:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Reading registration responses from Google Forms.</li>
            <li>Reading or managing organization spreadsheet data.</li>
            <li>Accessing organization-managed files or folders where required for the application's functionality.</li>
          </ul>
          <p>
            Google user data obtained through Google APIs is used only for the functionality disclosed in this Privacy Policy.
          </p>
          <p>IDSphere does not sell Google user data.</p>
          <p>IDSphere does not use Google user data for advertising.</p>
          <p>
            IDSphere does not transfer Google user data to third parties except where necessary to provide the requested functionality, comply with law, protect the service, or use an infrastructure provider acting on our behalf.
          </p>
          <p>
            IDSphere requests only the Google permissions necessary for the application's functionality.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">4. PHOTOS AND FILE STORAGE</h2>
          <p>
            Student/member photographs may be uploaded through IDSphere.
          </p>
          <p>
            Photos are stored using the application's configured secure storage infrastructure.
          </p>
          <p>
            IDSphere may use Supabase Storage for application-managed photo storage.
          </p>
          <p>
            Photos are associated with the relevant registration or identity and may be displayed to authorized organization administrators and, where applicable, as part of digital identity or QR verification functionality.
          </p>
          <p>
            Users should only upload photographs they are authorized to provide.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">5. EMAIL</h2>
          <p>IDSphere may send service-related emails, including:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Registration confirmation</li>
            <li>Photo upload instructions</li>
            <li>Verification status</li>
            <li>Digital identity availability</li>
            <li>Other necessary service notifications</li>
          </ul>
          <p>
            Email delivery may be provided through a configured SMTP provider.
          </p>
          <p>
            IDSphere does not use these service emails for unrelated advertising.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">6. DATA SHARING</h2>
          <p>IDSphere does not sell personal information.</p>
          <p>Information may be accessible to:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>The organization that collected the registration information.</li>
            <li>Authorized administrators of that organization.</li>
            <li>The individual user where applicable.</li>
            <li>Infrastructure and service providers required to operate IDSphere.</li>
            <li>Government authorities or other parties when legally required.</li>
            <li>Parties necessary to protect the rights, safety, security, or integrity of IDSphere.</li>
          </ul>
          <p>
            Organizations using IDSphere are responsible for ensuring that their collection and use of registration information is lawful and appropriate for their users.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">7. DATA SECURITY</h2>
          <p>
            IDSphere uses reasonable technical and organizational measures to protect information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p>Security measures may include:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Authenticated access</li>
            <li>Server-side authorization</li>
            <li>Secure HTTPS communication</li>
            <li>Protected server credentials</li>
            <li>Restricted storage access</li>
            <li>Organization-level access controls</li>
          </ul>
          <p>
            No internet service can guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">8. DATA RETENTION AND DELETION</h2>
          <p>
            IDSphere stores information only for as long as it is required to provide the requested functionality and while the information remains within the organization's IDSphere account.
          </p>
          <p>
            Organizations can delete registration, user, identity, and other applicable data using the available administrative functionality.
          </p>
          <p>
            When an organization permanently deletes data from IDSphere, that data is removed from IDSphere's active systems and is no longer retained by IDSphere for normal application use.
          </p>
          <p>
            IDSphere does not intentionally retain deleted organization data after it has been permanently deleted from the system.
          </p>
          <p>
            Organizations are responsible for deciding when registration and identity information should be deleted, subject to applicable legal or regulatory requirements.
          </p>
          <p>
            Some temporary technical copies, backups, logs, or security records may exist for a limited period where necessary for system security, reliability, fraud prevention, or legal obligations.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">9. USER RIGHTS AND REQUESTS</h2>
          <p>
            Depending on applicable law, individuals may have rights regarding their personal information, including rights to request:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Access</li>
            <li>Correction</li>
            <li>Deletion</li>
            <li>Information about how their data is used</li>
          </ul>
          <p>
            Requests should generally be directed to the organization that collected the individual's registration information.
          </p>
          <p>
            For questions specifically concerning IDSphere's platform, contact:
            <br />
            <a href="mailto:metadoxdigital@gmail.com" className="text-blue-600 hover:underline">metadoxdigital@gmail.com</a>
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">10. CHILDREN AND STUDENTS</h2>
          <p>
            IDSphere may be used by educational institutions, organizations, clubs, and similar organizations to manage student/member identities.
          </p>
          <p>
            Organizations are responsible for obtaining any permissions, notices, or consents required by applicable law before collecting information from students or minors.
          </p>
          <p>
            IDSphere does not knowingly use children's information for advertising.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">11. THIRD-PARTY SERVICES</h2>
          <p>
            IDSphere may rely on third-party infrastructure and services necessary to operate the platform, which may include:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Google / Google APIs</li>
            <li>Firebase Authentication</li>
            <li>Supabase</li>
            <li>SMTP/email infrastructure</li>
            <li>Vercel hosting or similar hosting infrastructure</li>
          </ul>
          <p>
            These services may process information according to their own terms and privacy policies.
          </p>
          <p>
            IDSphere only enables third-party access that is necessary for the application's functionality.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">12. REGISTRATION CONSENT</h2>
          <p>
            When a user submits a registration through an IDSphere registration form, the user must explicitly agree to the Privacy Policy and Terms and Conditions by selecting the mandatory consent checkbox provided on the registration form.
          </p>
          <p>
            If the checkbox is not selected, the registration cannot be submitted.
          </p>
          <p>
            The Privacy Policy and Terms and Conditions links are provided directly in the consent statement so users can review them before submitting their information.
          </p>
          <p>
            IDSphere does not maintain a separate consent log for this checkbox. The checkbox is a mandatory part of the registration process and serves as the user's acknowledgement before registration.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">13. CHANGES TO THIS PRIVACY POLICY</h2>
          <p>
            We may update this Privacy Policy when the platform, applicable requirements, or data practices change.
          </p>
          <p>
            The "Last Updated" date will be updated when material changes are made.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-900">14. CONTACT</h2>
          <p>For questions regarding this Privacy Policy:</p>
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
