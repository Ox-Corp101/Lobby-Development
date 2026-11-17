import { Link } from 'react-router';
import AuthCard, { authLinkClasses } from '../components/AuthCard';

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
        <p>Can’t find it? Check your spam or junk folder.</p>
      </div>
    </AuthCard>
  );
}
