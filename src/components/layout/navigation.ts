// Navigation for signed-out visitors (unchanged from Step 2).
export const publicNavLinks = [
  { to: '/sign-in', label: 'Sign in', variant: 'secondary' },
  { to: '/sign-up', label: 'Create account', variant: 'primary' },
] as const;

// Navigation for signed-in riders. "Sign out" is a button, added separately.
export const signedInNavLinks = [
  { to: '/profile', label: 'Profile', variant: 'secondary' },
] as const;

export type NavLink = (typeof publicNavLinks)[number] | (typeof signedInNavLinks)[number];
