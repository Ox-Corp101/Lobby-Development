import { describe, expect, it } from 'vitest';
import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath } from './redirects';

describe('safeRedirectPath', () => {
  it('keeps safe in-app paths, including query and hash', () => {
    expect(safeRedirectPath('/profile')).toBe('/profile');
    expect(safeRedirectPath('/profile?tab=bikes#top')).toBe('/profile?tab=bikes#top');
  });

  it('normalises dot segments while staying in the app', () => {
    expect(safeRedirectPath('/ok/../profile')).toBe('/profile');
  });

  it('falls back for non-string values', () => {
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(null)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(42)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it('blocks external and protocol-relative destinations (open redirects)', () => {
    for (const value of [
      'https://evil.example/steal',
      '//evil.example',
      'javascript:alert(1)',
      'evil.example',
    ]) {
      expect(safeRedirectPath(value)).toBe(DEFAULT_SIGNED_IN_PATH);
    }
  });

  it('blocks backslash tricks and control characters', () => {
    expect(safeRedirectPath('/\\evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('\\\\evil.example')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('/profile\n')).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it('treats encoded slashes as an in-app path, never an external host', () => {
    expect(safeRedirectPath('/%2F%2Fevil.example')).toBe('/%2F%2Fevil.example');
  });

  it('never sends riders back to sign-in or sign-up (avoids loops)', () => {
    expect(safeRedirectPath('/sign-in')).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath('/sign-up?x=1')).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it('uses /profile as the default destination', () => {
    expect(DEFAULT_SIGNED_IN_PATH).toBe('/profile');
  });
});
