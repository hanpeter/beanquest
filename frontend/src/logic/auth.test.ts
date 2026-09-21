import { checkPassword, formatCountdown, isValidEmail, loginErrorMessage, normalizeEmail } from './auth';

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmail('sam@example.com')).toBe(true);
  });

  it('accepts an address with surrounding whitespace', () => {
    expect(isValidEmail('  sam@example.com  ')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects a missing @', () => {
    expect(isValidEmail('samexample.com')).toBe(false);
  });

  it('rejects a missing domain dot', () => {
    expect(isValidEmail('sam@example')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Sam@Example.COM  ')).toBe('sam@example.com');
  });
});

describe('checkPassword', () => {
  it('rejects fewer than 10 characters', () => {
    const result = checkPassword('Short1!');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/10 characters/);
  });

  it('rejects 10+ characters meeting only one category', () => {
    const result = checkPassword('lowercaseonly');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/2 of/);
  });

  it('accepts lowercase + uppercase', () => {
    expect(checkPassword('LowerUpper').ok).toBe(true);
  });

  it('accepts lowercase + digit', () => {
    expect(checkPassword('lowercase1').ok).toBe(true);
  });

  it('accepts lowercase + special character', () => {
    expect(checkPassword('lowercase!').ok).toBe(true);
  });

  it('accepts all four categories', () => {
    expect(checkPassword('Str0ngPass!word').ok).toBe(true);
  });
});

describe('formatCountdown', () => {
  it('formats minutes and seconds, zero-padded', () => {
    expect(formatCountdown(278)).toBe('4:38');
  });

  it('formats under a minute', () => {
    expect(formatCountdown(45)).toBe('0:45');
  });

  it('rounds up fractional seconds', () => {
    expect(formatCountdown(0.4)).toBe('0:01');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('loginErrorMessage', () => {
  it('omits the count when attemptsLeft is null', () => {
    expect(loginErrorMessage(null)).toBe("That password isn't right.");
  });

  it('omits the count above the third failure (attemptsLeft > 2)', () => {
    expect(loginErrorMessage(3)).toBe("That password isn't right.");
  });

  it('shows the count at the boundary (attemptsLeft === 2)', () => {
    expect(loginErrorMessage(2)).toBe("That password isn't right. 2 attempts left.");
  });

  it('shows the count on the last attempt', () => {
    expect(loginErrorMessage(1)).toBe("That password isn't right. 1 attempts left.");
  });
});
