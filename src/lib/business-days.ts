import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  startOfDay,
} from "date-fns";

export function businessDaysInMonth(date: Date = new Date()): number {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
}

export function elapsedBusinessDays(date: Date = new Date()): number {
  const start = startOfMonth(date);
  const today = startOfDay(date);
  return eachDayOfInterval({ start, end: today }).filter(
    (d) => !isWeekend(d)
  ).length;
}

export function remainingBusinessDays(date: Date = new Date()): number {
  return businessDaysInMonth(date) - elapsedBusinessDays(date);
}

export function requiredPace(
  goal: number,
  done: number,
  date: Date = new Date()
): number {
  const remaining = remainingBusinessDays(date);
  if (remaining <= 0) return 0;
  return Math.max(0, Math.ceil((goal - done) / remaining));
}
