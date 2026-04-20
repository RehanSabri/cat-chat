import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-400 leading-relaxed">
          <p className="text-sm text-gray-500">Last updated: April 20, 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TextChat (&quot;the Service&quot;), you agree to be bound by these Terms of
              Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Age Requirement</h2>
            <p>
              You must be at least <strong className="text-white">18 years of age</strong> to use TextChat.
              By using the Service, you represent and warrant that you are at least 18 years old.
              If we discover or reasonably suspect that a user is under 18, we will immediately
              terminate their access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Prohibited Content & Behavior</h2>
            <p>You agree NOT to use TextChat for any of the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sharing or displaying illegal content of any kind</li>
              <li>Nudity, sexually explicit, or NSFW content</li>
              <li>Harassment, bullying, hate speech, or threats against other users</li>
              <li>Spam, advertising, or solicitation</li>
              <li>Sharing malware, phishing links, or malicious content</li>
              <li>Impersonating another person or entity</li>
              <li>Recording, screenshotting, or distributing conversations without consent</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Right to Ban</h2>
            <p>
              TextChat reserves the right to ban, suspend, or restrict any user at any time, with or
              without notice, for violating these terms or for any other reason at our sole discretion.
              Banned users may not create new accounts or attempt to circumvent the ban.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Anonymity & Privacy</h2>
            <p>
              TextChat provides anonymous chat services. We do not require registration or personal
              information. However, anonymity does not grant immunity from these Terms. Users engaging
              in prohibited behavior will be reported to relevant authorities when required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Disclaimer of Warranties</h2>
            <p>
              TextChat is provided &quot;as is&quot; without any warranties, express or implied. We do not
              guarantee that the service will be uninterrupted, secure, or error-free. You use the
              service at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
            <p>
              TextChat and its operators shall not be liable for any damages arising from your use of
              the Service, including but not limited to direct, indirect, incidental, consequential,
              or punitive damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
