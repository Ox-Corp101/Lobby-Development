import { Link } from 'react-router';
import AuthCard, { authLinkClasses } from '../components/AuthCard';
import ResendConfirmation from '../components/ResendConfirmation';

// Deliberately neutral: identical whether or not the address already has an
// account, and it never shows the address itself.
export default function CheckEmailPage() {
  return (
    <AuthCard
      title="Check your email"
      footer={
        <Link to="/sign-in" className={authLinkClasses}>
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-3 text-ink-muted">
        <p>
          If that email address can be used for a new Lobby account, we’ve sent it a confirmation
          link.
        </p>
        <p>Open the link to confirm your email. You can sign in once your email is confirmed.</p>
        <p>
          <strong className="text-ink">Tip:</strong> open the link in this same browser to be signed
          in automatically. If you open it somewhere else, your email will still be confirmed and
          you can sign in with your password.
        </p>
        <p>Can’t find it? Check your spam or junk folder, or send a new link below.</p>
      </div>
      <div className="mt-6 border-t border-line pt-6">
        <h2 className="mb-4 font-semibold">Didn’t get the email?</h2>
        <ResendConfirmation />
      </div>
    </AuthCard>
  );
}
