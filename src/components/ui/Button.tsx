import type { ReactNode } from 'react';
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

export function ButtonLink({ variant, size, className, ...rest }: CommonProps & LinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
