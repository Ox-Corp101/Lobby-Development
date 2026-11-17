import { useState } from 'react';
import TextField, { type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

/**
 * Password input with a show/hide toggle.
 * The toggle is a real button with aria-pressed, so its state is announced.
 * Clicking it with a mouse keeps focus (and the caret) in the password field.
 * The password itself is never logged, stored or put in a URL.
 */
export default function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-1 right-1 min-w-20 rounded-lg px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          {visible ? 'Hide' : 'Show'}
          <span className="sr-only"> password</span>
        </button>
      }
    />
  );
}
