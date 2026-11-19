import { diasEntre } from './date';

describe('diasEntre', () => {
  it('conta os dias corridos até a data', () => {
    expect(diasEntre('2026-11-18', '2027-07-17')).toBe(241);
  });

  it('é zero no próprio dia e negativo depois', () => {
    expect(diasEntre('2027-07-17', '2027-07-17')).toBe(0);
    expect(diasEntre('2027-07-18', '2027-07-17')).toBe(-1);
  });
});
