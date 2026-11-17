// Navigation shown to signed-out visitors. The signed-in menu (Profile, Sign out)
// is added in Step 4 once authentication exists.
export const publicNavLinks = [
  { to: '/sign-in', label: 'Sign in', variant: 'secondary' },
  { to: '/sign-up', label: 'Create account', variant: 'primary' },
] as const;
