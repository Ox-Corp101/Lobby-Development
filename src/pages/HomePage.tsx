import type { ReactNode } from 'react';
import { ButtonLink } from '../components/ui/Button';

type UpcomingFeature = { title: string; description: string; icon: ReactNode };

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

// Informational only: these describe planned features. Nothing here links to
// or simulates functionality that doesn't exist yet.
const upcomingFeatures: UpcomingFeature[] = [
  {
    title: 'Plan group rides',
    description: 'Set a meeting point, destination and departure time, and choose who can join.',
    icon: (
      <svg {...iconProps}>
        <path d="M6 20c0-5 12-6 12-12" />
        <circle cx="6" cy="20" r="1.5" />
        <path d="M18 4.5v-1M18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
  },
  {
    title: 'Find rides near you',
    description: 'Browse upcoming rides that meet close to your city.',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M15 9l-2 4-4 2 2-4 4-2z" />
      </svg>
    ),
  },
  {
    title: 'Your ride calendar',
    description: 'See the rides you organize and join, upcoming and past, in one place.',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      <title>Lobby — Ride together</title>

      <section className="relative overflow-hidden">
        {/* Decorative road centre line on wide screens */}
        <div
          aria-hidden="true"
          className="road-line-vertical absolute inset-y-0 right-[12%] hidden opacity-70 lg:block"
        />
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
          <h1 className="max-w-2xl text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Ride together<span className="text-accent-ink">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-ink-muted sm:text-xl">
            Lobby brings riders together to plan group rides and meet up with the riding community.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/sign-up" variant="primary" size="lg" className="w-full sm:w-auto">
              Create account
            </ButtonLink>
            <ButtonLink to="/sign-in" variant="secondary" size="lg" className="w-full sm:w-auto">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="road-line mx-auto max-w-6xl" />

      <section
        aria-labelledby="coming-soon-heading"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="coming-soon-heading" className="text-2xl font-bold tracking-tight">
            Coming soon
          </h2>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
            In development
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-ink-muted">
          These features are being built and aren’t available yet.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {upcomingFeatures.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-dashed border-line bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                  {feature.icon}
                </span>
                <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
