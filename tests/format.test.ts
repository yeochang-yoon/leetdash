import { describe, expect, it } from "vitest";
import { formatDateKey, formatSnapshotDateTime } from "@/lib/format";

describe("formatDateKey", () => {
  it("formats Seoul date keys independently of the process timezone", () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";

    try {
      expect(formatDateKey("2026-07-19")).toBe("2026년 7월 19일");
      expect(formatDateKey(null)).toBe("-");
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });
});

describe("formatSnapshotDateTime", () => {
  it("formats dashboard snapshot timestamps with a 24-hour Seoul clock", () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";

    try {
      expect(formatSnapshotDateTime("2026-07-19T12:05:00.000Z")).toBe("7월 19일 21:05");
      expect(formatSnapshotDateTime(null)).toBe("없음");
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });
});
