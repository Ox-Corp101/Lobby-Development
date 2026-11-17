import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  /** Validation message. When set, the field is marked invalid and the message is linked to it. */
  error?: string;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
  /** Extra content placed inside the input's frame, e.g. a show/hide button. */
  trailing?: ReactNode;
};

export const inputClasses =
  'block min-h-12 w-full rounded-xl border bg-surface px-4 text-base text-ink ' +
  'placeholder:text-ink-muted transition-colors';

export default function TextField({
  label,
  error,
  hint,
  trailing,
  className = '',
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <div className="relative mt-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${inputClasses} ${
            error ? 'border-red-700 dark:border-red-400' : 'border-ink-muted/70'
          } ${trailing ? 'pr-24' : ''}`}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
