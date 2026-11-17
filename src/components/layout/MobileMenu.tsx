import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { Button, buttonClasses } from '../ui/Button';
import type { NavLink } from './navigation';

type MobileMenuProps = {
  links: readonly NavLink[];
  /** Present only for signed-in riders. */
  signOut?: { onClick: () => void; loading: boolean };
};

/**
 * Phone-sized navigation (hidden from 640px up).
 * Accessible disclosure menu:
 *  - the toggle announces its state with aria-expanded / aria-controls
 *  - opening moves focus to the first item
 *  - Esc closes and returns focus to the toggle
 *  - tapping outside, tabbing out, choosing an item, or widening the
 *    screen past the phone breakpoint closes it
 */
export default function MobileMenu({ links, signOut }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [open]);

  // Close on outside tap, and when the viewport grows past the phone breakpoint.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 640px)');
    const onWide = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className="sm:hidden"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // Close when keyboard focus leaves the menu entirely.
        if (open && !containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        className={buttonClasses('ghost', 'md', 'size-11 px-0')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <svg
          viewBox="0 0 24 24"
          className="size-6 shrink-0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
        </svg>
      </button>

      <nav
        ref={panelRef}
        id={panelId}
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-lg"
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={buttonClasses(link.variant, 'lg', 'w-full')}
                onClick={() => close(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {signOut && (
            <li>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                loading={signOut.loading}
                loadingLabel="Signing out…"
                onClick={() => {
                  close(false);
                  signOut.onClick();
                }}
              >
                Sign out
              </Button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
