import type { SupabaseConfigResult } from '../lib/env';
import Logo from '../components/brand/Logo';

type Problem = Extract<SupabaseConfigResult, { ok: false }>['problem'];

const messages: Record<Problem, { title: string; body: string }> = {
  missing: {
    title: 'Supabase isn’t configured',
    body: 'Lobby needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local, add your Project URL and publishable key, then restart the development server.',
  },
  invalid_url: {
    title: 'Supabase URL looks wrong',
    body: 'VITE_SUPABASE_URL must be your project’s https:// address (for example https://your-project.supabase.co). Fix it in .env.local, then restart the development server.',
  },
  secret_key: {
    title: 'A secret key was found — Lobby will not start',
    body: 'VITE_SUPABASE_PUBLISHABLE_KEY contains a Supabase secret or service-role key, which must never be used in a web app. Remove it from .env.local, use the publishable key (sb_publishable_…), and rotate the exposed secret key in the Supabase dashboard.',
  },
};

/** Shown instead of the app when the Supabase settings are missing or unsafe. */
export default function ConfigErrorPage({ problem }: { problem: Problem }) {
  const { title, body } = messages[problem];
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <title>{`${title} · Lobby`}</title>
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
        <p role="alert" className="mt-3 text-ink-muted">
          {body}
        </p>
      </div>
    </main>
  );
}
