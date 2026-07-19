import type { ActivityDay, ActivitySubmission } from "@/lib/types";

export type ActivityIntensity = 0 | 1 | 2 | 3 | 4;

export type ActivityCalendarCell = {
  date: string;
  solved: number;
  submissions: ActivitySubmission[];
  intensity: ActivityIntensity;
};

export type ActivityCalendarWindow = {
  days: ActivityCalendarCell[];
  totalSolved: number;
  maxSolved: number;
  lastActiveDate: string | null;
};

const seoulDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getSeoulDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = Object.fromEntries(
    seoulDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function getIntensity(solved: number, maxSolved: number): ActivityIntensity {
  if (solved <= 0 || maxSolved <= 0) {
    return 0;
  }

  if (maxSolved === 1) {
    return 4;
  }

  return Math.max(1, Math.ceil((solved / maxSolved) * 4)) as ActivityIntensity;
}

export function buildActivityCalendar(
  activity: ActivityDay[],
  dayCount: number,
  endDate: Date | string = new Date(),
): ActivityCalendarWindow {
  const normalizedDayCount = Math.max(1, Math.floor(dayCount));
  const endDateKey = getSeoulDateKey(endDate);
  const startDateKey = addDays(endDateKey, -(normalizedDayCount - 1));
  const activityByDate = new Map(activity.map((day) => [day.date, day]));

  const rawDays = Array.from({ length: normalizedDayCount }, (_, index) => {
    const date = addDays(startDateKey, index);
    const source = activityByDate.get(date);
    return {
      date,
      solved: source?.solved ?? 0,
      submissions: source?.submissions ?? [],
    };
  });
  const maxSolved = rawDays.reduce((max, day) => Math.max(max, day.solved), 0);
  const days = rawDays.map((day) => ({
    ...day,
    intensity: getIntensity(day.solved, maxSolved),
  }));
  const totalSolved = days.reduce((sum, day) => sum + day.solved, 0);
  const lastActiveDate =
    [...activity]
      .filter((day) => day.solved > 0 && day.date <= endDateKey)
      .sort((left, right) => left.date.localeCompare(right.date))
      .at(-1)?.date ?? null;

  return {
    days,
    totalSolved,
    maxSolved,
    lastActiveDate,
  };
}
