import type { ReactNode } from 'react';

type AuthCardProps = {
  /** Page heading (also used in the browser tab title). */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Links shown under the card, e.g. "Already have an account? Sign in". */
  footer?: ReactNode;
};

/** Shared frame for every authentication screen. */
export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <title>{`${title} · Lobby`}</title>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 text-ink-muted">{description}</div>}
        {children && <div className="mt-6">{children}</div>}
      </div>
      {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
    </section>
  );
}

/** Text link styled for auth screens. */
export const authLinkClasses =
  'font-semibold text-accent-ink underline-offset-4 hover:underline rounded-sm';
