import { Link } from 'react-router';
import { useAuth } from '../../features/auth/useAuth';
import { useSignOut } from '../../features/auth/useSignOut';
import Logo from '../brand/Logo';
import { Button, buttonClasses } from '../ui/Button';
import MobileMenu from './MobileMenu';
import { publicNavLinks, signedInNavLinks } from './navigation';

export default function SiteHeader() {
  const auth = useAuth();
  const { signOut, signingOut, failed } = useSignOut();
  const signedIn = auth.status === 'signedIn';
  const links = signedIn ? signedInNavLinks : publicNavLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="-m-1 rounded-lg p-1" aria-label="Lobby home">
          <Logo />
        </Link>

        {/* While the stored session is being read, show no links to avoid a flash of the wrong menu. */}
        {auth.status !== 'loading' && (
          <>
            <nav aria-label="Main" className="hidden sm:block">
              <ul className="flex items-center gap-3">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={buttonClasses(link.variant, 'md')}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {signedIn && (
                  <li>
                    <Button
                      variant="ghost"
                      loading={signingOut}
                      loadingLabel="Signing out…"
                      onClick={signOut}
                    >
                      Sign out
                    </Button>
                  </li>
                )}
              </ul>
            </nav>

            <MobileMenu
              links={links}
              signOut={signedIn ? { onClick: signOut, loading: signingOut } : undefined}
            />
          </>
        )}
      </div>
      <p role="status" className="sr-only">
        {failed ? 'Sign out failed. Check your connection and try again.' : ''}
      </p>
      {failed && (
        <p className="mx-auto max-w-6xl px-4 pb-3 text-sm font-medium text-red-700 sm:px-6 dark:text-red-300">
          Sign out failed. Check your connection and try again.
        </p>
      )}
    </header>
  );
}
