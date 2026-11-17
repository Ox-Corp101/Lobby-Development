import { Link } from 'react-router';
import Logo from '../brand/Logo';
import { buttonClasses } from '../ui/Button';
import MobileMenu from './MobileMenu';
import { publicNavLinks } from './navigation';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="-m-1 rounded-lg p-1" aria-label="Lobby home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex items-center gap-3">
            {publicNavLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={buttonClasses(link.variant, 'md')}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
