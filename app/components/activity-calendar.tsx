import type { ActivityCalendarWindow } from "@/lib/activity";
import { formatDate } from "@/lib/format";

export function ActivityCalendar({ calendar, label }: { calendar: ActivityCalendarWindow; label: string }) {
  return (
    <div className="activity-calendar" aria-label={label}>
      {calendar.days.map((day) => {
        const solvedLabel = day.solved === 0 ? "풀이 없음" : `${day.solved}개 풀이`;
        return (
          <span
            aria-label={`${formatDate(day.date)} ${solvedLabel}`}
            className={`activity-day activity-level-${day.intensity}`}
            key={day.date}
            title={`${formatDate(day.date)}: ${solvedLabel}`}
          />
        );
      })}
    </div>
  );
}
