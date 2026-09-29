const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/;

/** Client-side check before the lookup call — the backend re-validates regardless. */
export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

/** Mirrors `_normalize_email` in beanquest/auth.py — trim + lowercase. */
export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

export const PASSWORD_HELPER = 'At least 10 characters, using 2 of: lowercase, uppercase, number, symbol.';

/** Port of `_validate_password_strength` in beanquest/auth.py: 10+ characters, 2+ of
 * {lowercase, uppercase, digit, special character}. */
export function checkPassword(v: string): { ok: boolean; reason: string | null } {
  if (v.length < 10) {
    return { ok: false, reason: 'Password must be at least 10 characters long.' };
  }
  const categoriesMet = [
    /[a-z]/.test(v),
    /[A-Z]/.test(v),
    /[0-9]/.test(v),
    SPECIAL_CHAR_RE.test(v),
  ].filter(Boolean).length;
  if (categoriesMet < 2) {
    return {
      ok: false,
      reason: 'Password must include at least 2 of: lowercase, uppercase, number, special character.',
    };
  }
  return { ok: true, reason: null };
}

/** "4:38" — minutes:seconds, zero-padded seconds. Negative/zero clamps to "0:00". */
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** The count only appears from the third failure (attemptsLeft <= 2) so the lockout
 * isn't a surprise — design screen 5. */
export function loginErrorMessage(attemptsLeft: number | null): string {
  if (attemptsLeft !== null && attemptsLeft <= 2) {
    return `That password isn't right. ${attemptsLeft} attempts left.`;
  }
  return "That password isn't right.";
}
