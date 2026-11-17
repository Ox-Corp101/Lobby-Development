import { Link } from 'react-router';

// Placeholder for Step 2. The sign-in form is built in Step 3.
export default function SignInPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <title>Sign in · Lobby</title>
      <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-3 text-ink-muted">Signing in isn’t available yet.</p>
      <p className="mt-8 text-sm text-ink-muted">
        New to Lobby?{' '}
        <Link
          to="/sign-up"
          className="font-semibold text-accent-ink underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
