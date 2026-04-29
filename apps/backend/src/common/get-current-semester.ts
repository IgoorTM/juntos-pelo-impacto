export function getCurrentSemester(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const semester = date.getUTCMonth() < 6 ? 1 : 2;
  return `${year}-${semester}`;
}
