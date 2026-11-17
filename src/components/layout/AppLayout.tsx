import { Outlet, ScrollRestoration } from 'react-router';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold text-ink shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
