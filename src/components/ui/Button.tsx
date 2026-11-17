import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors select-none';

const variants: Record<Variant, string> = {
  // Amber is reserved for the single most important action on a screen.
  primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink hover:bg-surface-muted',
};

const sizes: Record<Size, string> = {
  md: 'px-4 text-sm',
  lg: 'px-6 text-base min-h-12',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Shows a spinner and blocks repeat activation while work is in progress. */
    loading?: boolean;
    /** Label announced and shown while loading, e.g. "Signing in…". */
    loadingLabel?: string;
  };

/**
 * Form button. While loading it stays focusable (so keyboard focus isn't lost)
 * but is marked aria-disabled and ignores clicks and Enter-key submissions.
 */
export function Button({
  variant,
  size,
  className,
  type = 'button',
  loading = false,
  loadingLabel,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(
        variant,
        size,
        `${loading ? 'cursor-progress opacity-80' : ''} ${className ?? ''}`,
      )}
      aria-disabled={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {loading && (
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 animate-spin"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...rest }: CommonProps & LinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
