import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-400 leading-relaxed">
          <p className="text-sm text-gray-500">Last updated: April 20, 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>
              TextChat is designed to be anonymous. We do not collect personal information such as
              names, email addresses, or phone numbers. The following non-personal data may be
              collected:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address (for moderation and abuse prevention)</li>
              <li>Browser type and version</li>
              <li>Connection timestamps</li>
              <li>Chat mode preference (text/video)</li>
              <li>Interest tags you voluntarily provide</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
            <p>Any data collected is used solely for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Matching you with other users based on interests</li>
              <li>Maintaining service stability and performance</li>
              <li>Preventing abuse and enforcing our Terms of Service</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Chat Content</h2>
            <p>
              Text messages are transmitted in real time and are <strong className="text-white">not stored</strong> on
              our servers after delivery. Video and audio streams are peer-to-peer (WebRTC) and do
              not pass through our servers. We do not record, monitor, or store the content of your
              conversations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Cookies & Local Storage</h2>
            <p>
              We use minimal browser storage for functional purposes only:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Age disclaimer acknowledgment (localStorage)</li>
              <li>Session identifier (sessionStorage)</li>
            </ul>
            <p>We do not use tracking cookies or third-party analytics.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or share your data with third parties, except when required by
              law or to protect the safety of our users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect against unauthorized access.
              However, no method of internet transmission is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Children&apos;s Privacy</h2>
            <p>
              TextChat is not intended for users under 18. We do not knowingly collect information
              from minors. If we learn that a user is under 18, their access will be terminated
              immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated date. Continued use of TextChat constitutes acceptance of the
              revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">9. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@textchat.com" className="text-accent hover:underline">
                privacy@textchat.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
