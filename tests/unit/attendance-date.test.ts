import { describe, expect, it } from "vitest";
import { isCalendarDate } from "@/features/attendance/date";

describe("isCalendarDate", () => {
  it.each(["2024-02-29", "2026-11-28", "0001-01-01", "9999-12-31"])(
    "accepts valid calendar date %s",
    (value) => expect(isCalendarDate(value)).toBe(true),
  );

  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "0000-01-01", "2026-2-01", "not-a-date"])(
    "rejects invalid calendar date %s",
    (value) => expect(isCalendarDate(value)).toBe(false),
  );
});
