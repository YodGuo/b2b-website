import { useState, useEffect } from 'react';

const STORAGE_KEY = 'legal_consent_accepted';

interface ConsentData {
  accepted: boolean;
  level: 'all' | 'necessary';
  timestamp: string;
}

export function LegalConsentModal() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const saveConsent = (level: 'all' | 'necessary') => {
    const data: ConsentData = {
      accepted: true,
      level,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setShow(false);
    document.body.style.overflow = '';
  };

  const handleAcceptAll = () => saveConsent('all');
  const handleNecessaryOnly = () => saveConsent('necessary');

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
          <h2 className="text-xl font-bold text-secondary-900">Legal Notice</h2>
          <p className="text-sm text-secondary-500 mt-1">
            Before using our website, please read and accept the following policies.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {/* Privacy Policy Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900 mb-1">Privacy Policy</h3>
                  <p className="text-sm text-secondary-600">
                    We collect and use your personal information (inquiry form data, comments, and auto-collected analytics) to process requests, improve our services, and send notifications. Your data is protected with HTTPS encryption, Cloudflare security infrastructure, and access controls. You have the right to access, correct, and delete your data at any time.
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails('privacy')}
                  className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  Read Full →
                </button>
              </div>
            </div>

            {/* Terms Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900 mb-1">Terms & Conditions</h3>
                  <p className="text-sm text-secondary-600">
                    By using this website, you agree that product information is for reference only, inquiry submissions do not constitute binding offers, and all content is protected by intellectual property laws. We are not liable for any damages arising from the use of this website. Disputes shall be governed by applicable laws.
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails('terms')}
                  className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  Read Full →
                </button>
              </div>
            </div>

            {/* Cookie Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Cookies:</strong> This site uses essential cookies for authentication and security (Cloudflare Turnstile). We do not use third-party tracking cookies.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-secondary-400">
            By continuing, you agree to our Privacy Policy and Terms & Conditions.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleNecessaryOnly}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-secondary-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Necessary Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Detail Overlay */}
      {showDetails && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDetails(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-900">
                {showDetails === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button
                onClick={() => setShowDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {showDetails === 'privacy' ? (
                <div className="prose prose-sm max-w-none text-secondary-600 space-y-4">
                  <h4 className="text-base font-semibold text-secondary-900">1. Information We Collect</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Inquiry Form:</strong> Company name, contact name, email, phone, country, product interest, message</li>
                    <li><strong>Comments:</strong> Nickname, email (optional), comment content</li>
                    <li><strong>Auto-collected:</strong> IP address, browser type, visit time, page views (via Cloudflare Analytics)</li>
                    <li><strong>Uploaded Files:</strong> Attachments via inquiry form, stored on Cloudflare R2</li>
                  </ul>
                  <h4 className="text-base font-semibold text-secondary-900">2. How We Use Your Information</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Process and respond to your inquiries</li>
                    <li>Manage comment moderation and display</li>
                    <li>Improve website user experience and functionality</li>
                    <li>Send product updates (only with your consent)</li>
                    <li>Comply with legal requirements</li>
                  </ul>
                  <h4 className="text-base font-semibold text-secondary-900">3. Data Protection</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>All data transmission encrypted with HTTPS/TLS</li>
                    <li>Admin panel secured with password + HMAC-SHA256 signed cookies</li>
                    <li>Database hosted on Cloudflare D1 with enterprise-grade security</li>
                    <li>Files stored on Cloudflare R2 with hotlink protection</li>
                    <li>Form submissions protected by Cloudflare Turnstile CAPTCHA</li>
                  </ul>
                  <h4 className="text-base font-semibold text-secondary-900">4. Data Sharing</h4>
                  <p className="text-sm">We do not sell or trade your personal information. Data may only be shared with your explicit consent, business partners for order fulfillment, or when required by law.</p>
                  <h4 className="text-base font-semibold text-secondary-900">5. Your Rights</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                    <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
                  </ul>
                  <p className="text-sm mt-4">Contact: <a href="mailto:privacy@yourcompany.com" className="text-primary-600 hover:underline">privacy@yourcompany.com</a></p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-secondary-600 space-y-4">
                  <h4 className="text-base font-semibold text-secondary-900">1. Acceptance of Terms</h4>
                  <p className="text-sm">By accessing and using this website, you agree to be bound by these Terms & Conditions. We reserve the right to modify these terms at any time.</p>
                  <h4 className="text-base font-semibold text-secondary-900">2. Website Content</h4>
                  <p className="text-sm">Product information, specifications, and images are for reference only and may be updated without notice. We strive for accuracy but make no warranties regarding content completeness or timeliness.</p>
                  <h4 className="text-base font-semibold text-secondary-900">3. Intellectual Property</h4>
                  <p className="text-sm">All content including text, images, logos, and code is protected by copyright and trademark laws. Unauthorized reproduction or distribution is prohibited.</p>
                  <h4 className="text-base font-semibold text-secondary-900">4. Inquiries & Transactions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Inquiry submissions do not constitute binding offers</li>
                    <li>Actual terms are governed by formal contracts</li>
                    <li>We reserve the right to decline any inquiry</li>
                  </ul>
                  <h4 className="text-base font-semibold text-secondary-900">5. User Conduct</h4>
                  <p className="text-sm">Users must not submit fraudulent information, use automated tools to scrape content, post unlawful comments, attempt unauthorized access, or circumvent security measures.</p>
                  <h4 className="text-base font-semibold text-secondary-900">6. Limitation of Liability</h4>
                  <p className="text-sm">The website is provided &quot;as is&quot; without warranties. We are not liable for any direct, indirect, or consequential damages arising from the use of this website.</p>
                  <p className="text-sm mt-4">Contact: <a href="mailto:legal@yourcompany.com" className="text-primary-600 hover:underline">legal@yourcompany.com</a></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
