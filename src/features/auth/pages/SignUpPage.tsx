import { Link } from 'react-router';

// Placeholder for Step 2. The registration form is built in Step 3.
export default function SignUpPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <title>Create account · Lobby</title>
      <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-3 text-ink-muted">Account registration isn’t available yet.</p>
      <p className="mt-8 text-sm text-ink-muted">
        Already have an account?{' '}
        <Link
          to="/sign-in"
          className="font-semibold text-accent-ink underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}
