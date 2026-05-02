/**
 * Returns the current academic semester in "YYYY-N" format.
 * Semester 1: January–June; Semester 2: July–December.
 */
export function getCurrentSemester(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  const semester = month <= 6 ? 1 : 2
  return `${year}-${semester}`
}
