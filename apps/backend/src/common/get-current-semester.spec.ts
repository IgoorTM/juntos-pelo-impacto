import { getCurrentSemester } from './get-current-semester';

describe('getCurrentSemester', () => {
  it('returns YYYY-1 for January', () => {
    expect(getCurrentSemester(new Date('2025-01-15T00:00:00Z'))).toBe('2025-1');
  });

  it('returns YYYY-1 for June', () => {
    expect(getCurrentSemester(new Date('2025-06-30T00:00:00Z'))).toBe('2025-1');
  });

  it('returns YYYY-2 for July', () => {
    expect(getCurrentSemester(new Date('2025-07-01T00:00:00Z'))).toBe('2025-2');
  });

  it('returns YYYY-2 for December', () => {
    expect(getCurrentSemester(new Date('2025-12-31T00:00:00Z'))).toBe('2025-2');
  });

  it('handles different years', () => {
    expect(getCurrentSemester(new Date('2026-03-10T00:00:00Z'))).toBe('2026-1');
    expect(getCurrentSemester(new Date('2024-09-22T00:00:00Z'))).toBe('2024-2');
  });

  it('uses current date when no argument is provided', () => {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    expect(getCurrentSemester()).toBe(`${year}-${semester}`);
  });
});
