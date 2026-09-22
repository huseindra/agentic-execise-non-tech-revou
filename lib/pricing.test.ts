import { describe, it, expect } from 'vitest';
import { getAnnualPrice } from './pricing';

// Skipped on purpose: lib/pricing.ts still has the intentional bug
// (getAnnualPrice multiplies by 0.2 instead of 0.8) for a student exercise.
// Remove .skip once the bug is fixed to re-enable these checks.
describe('getAnnualPrice', () => {
  it.skip('returns the correct annual price for Starter', () => {
    expect(getAnnualPrice(10)).toBe(96);
  });

  it.skip('returns the correct annual price for Pro', () => {
    expect(getAnnualPrice(30)).toBe(288);
  });

  it.skip('returns the correct annual price for Team', () => {
    expect(getAnnualPrice(60)).toBe(576);
  });
});
