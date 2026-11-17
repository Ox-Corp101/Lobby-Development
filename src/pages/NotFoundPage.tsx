import { ButtonLink } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <title>Page not found · Lobby</title>
      <p className="text-sm font-semibold text-accent-ink">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        This road doesn’t go anywhere
      </h1>
      <p className="mt-3 max-w-xl text-ink-muted">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <ButtonLink to="/" variant="secondary" className="mt-8">
        Back to home
      </ButtonLink>
    </section>
  );
}
