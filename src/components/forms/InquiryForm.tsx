import { useState, useCallback } from 'react';
import { actions } from 'astro:actions';
import { TurnstileWidget } from '../common/TurnstileWidget';

interface Attachment {
  name: string;
  url: string;
  size: number;
}

interface InquiryFormProps {
  productInterest?: string;
}

// Turnstile Site Key - fetched from environment variables, uses test key for local development
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export function InquiryForm({ productInterest }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    for (const file of Array.from(files)) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} exceeds the 10MB limit`);
        continue;
      }

      try {
        setUploadProgress(0);

        // Get presigned URL
        const presignRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type
          })
        });

        if (!presignRes.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, publicUrl } = await presignRes.json();

        setUploadProgress(50);

        // Upload file to R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });

        if (!uploadRes.ok) {
          throw new Error('File upload failed');
        }

        setUploadProgress(100);

        setAttachments(prev => [...prev, {
          name: file.name,
          url: publicUrl,
          size: file.size
        }]);

      } catch (err) {
        console.error('Upload error:', err);
        setError(`File ${file.name} upload failed`);
      } finally {
        setUploadProgress(null);
      }
    }

    // Reset input
    e.target.value = '';
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Add Turnstile token
    if (turnstileToken) {
      formData.set('cfTurnstileToken', turnstileToken);
    }

    // Add attachment info
    if (attachments.length > 0) {
      formData.set('attachments', JSON.stringify(attachments.map(a => a.url)));
    }

    try {
      const result = await actions.inquiry(formData);

      if (result.error) {
        setError(result.error.message || 'Submission failed');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setAttachments([]);

    } catch (err) {
      console.error('Submit error:', err);
      setError('Submission failed, please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-secondary-900 mb-2">Submission Successful!</h3>
        <p className="text-secondary-600 mb-6">We have received your inquiry and will contact you within 24 hours.</p>
        <button
          onClick={() => setSuccess(false)}
          className="btn-secondary"
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="label">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            required
            className="input"
            placeholder="Enter company name"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label htmlFor="contactName" className="label">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            required
            className="input"
            placeholder="Enter contact name"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="input"
            placeholder="example@company.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="input"
            placeholder="+86 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Country */}
        <div>
          <label htmlFor="country" className="label">Country/Region</label>
          <select id="country" name="country" className="input">
            <option value="">Please select</option>
            <option value="China">China</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="label">Desired Quantity</label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            className="input"
            placeholder="e.g., 1,000 pcs/month"
          />
        </div>
      </div>

      {/* Product Interest */}
      <div>
        <label htmlFor="productInterest" className="label">Product of Interest</label>
        <input
          type="text"
          id="productInterest"
          name="productInterest"
          className="input"
          placeholder="Enter product name or model number"
          defaultValue={productInterest}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="label">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="input resize-none"
          placeholder="Please describe your requirements in detail, including product specifications, intended use, etc."
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="label">Attachments (Optional)</label>
        <div className="border-2 border-dashed border-secondary-200 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            id="attachments"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="attachments" className="cursor-pointer">
            <svg className="w-10 h-10 mx-auto text-secondary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-secondary-600">
              Click to upload or drag and drop files here
            </p>
            <p className="text-sm text-secondary-400 mt-1">
              Supports PDF, Word, Excel, images, and archives (max 10MB)
            </p>
          </label>
        </div>

        {/* Upload Progress */}
        {uploadProgress !== null && (
          <div className="mt-3">
            <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-secondary-500 mt-1">Uploading...</p>
          </div>
        )}

        {/* Uploaded Files List */}
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((att, index) => (
              <li key={index} className="flex items-center justify-between bg-secondary-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-secondary-700">{att.name}</span>
                  <span className="text-xs text-secondary-400">({(att.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-secondary-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Privacy Consent */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="privacyConsent"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          required
        />
        <label htmlFor="privacyConsent" className="text-sm text-secondary-600">
          I have read and agree to the{' '}
          <a href="/privacy" target="_blank" className="text-primary-600 hover:underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" target="_blank" className="text-primary-600 hover:underline">
            Terms & Conditions
          </a>{' '}
          <span className="text-red-500">*</span>
        </label>
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <TurnstileWidget
        siteKey={TURNSTILE_SITE_KEY}
        onVerify={(token) => setTurnstileToken(token)}
        onError={(err) => setError(err)}
        theme="auto"
        language="en"
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !turnstileToken || !privacyAccepted}
        className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title={!turnstileToken ? 'Please complete the CAPTCHA first' : !privacyAccepted ? 'Please accept the privacy policy' : undefined}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : !turnstileToken ? 'Please complete the CAPTCHA first' : !privacyAccepted ? 'Please accept the privacy policy' : 'Submit Inquiry'}
      </button>

      <p className="text-sm text-secondary-500 text-center">
        By submitting, you agree to our <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
      </p>
    </form>
  );
}
