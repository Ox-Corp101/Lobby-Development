type Tone = 'error' | 'success' | 'info';

const tones: Record<Tone, string> = {
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
  info: 'border-line bg-surface-muted text-ink',
};

/**
 * Form-level message. The outer live region is always present so screen
 * readers reliably announce messages when they appear: errors assertively,
 * success and neutral notices politely.
 */
export default function FormAlert({ tone = 'info', message }: { tone?: Tone; message?: string }) {
  return (
    <div aria-live={tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      {message && (
        <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${tones[tone]}`}>
          {message}
        </p>
      )}
    </div>
  );
}
