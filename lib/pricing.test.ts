import { describe, it, expect } from 'vitest';
import { getAnnualPrice } from './pricing';

describe('getAnnualPrice', () => {
  it('returns the correct annual price for Starter', () => {
    expect(getAnnualPrice(10)).toBe(96);
  });

  it('returns the correct annual price for Pro', () => {
    expect(getAnnualPrice(30)).toBe(288);
  });

  it('returns the correct annual price for Team', () => {
    expect(getAnnualPrice(60)).toBe(576);
  });
});
