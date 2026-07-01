export function getAnnualPrice(monthlyPrice: number): number {
  return monthlyPrice * 12 * 0.8;
}
