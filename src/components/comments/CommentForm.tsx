import { useState } from 'react';
import { actions } from 'astro:actions';

interface CommentFormProps {
  newsId: number;
  parentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  newsId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write your comment...'
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await actions.comment(formData);

      if (result.error) {
        setError(result.error.message || 'Comment submission failed');
        return;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();

      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }

    } catch (err) {
      console.error('Comment submit error:', err);
      setError('Comment submission failed, please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700">Comment submitted and awaiting moderation</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="newsId" value={newsId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      {/* Honeypot field */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`authorName-${parentId || 'root'}`} className="label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`authorName-${parentId || 'root'}`}
            name="authorName"
            required
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor={`authorEmail-${parentId || 'root'}`} className="label">Email (Optional)</label>
          <input
            type="email"
            id={`authorEmail-${parentId || 'root'}`}
            name="authorEmail"
            className="input"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`content-${parentId || 'root'}`} className="label">
          Comment <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`content-${parentId || 'root'}`}
          name="content"
          required
          rows={4}
          className="input resize-none"
          placeholder={placeholder}
          maxLength={1000}
        />
        <p className="text-xs text-secondary-400 mt-1">Up to 1,000 characters</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
