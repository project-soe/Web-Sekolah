import { describe, expect, it } from "vitest";
import { resolveAttendanceHistory } from "@/features/attendance/attendance-history";

describe("resolveAttendanceHistory", () => {
  it("distinguishes an RPC error from an empty history", () => {
    expect(resolveAttendanceHistory(null, new Error("RPC unavailable"))).toEqual({
      kind: "error",
      rows: [],
    });
  });

  it("returns an empty state when the RPC succeeds without records", () => {
    expect(resolveAttendanceHistory(null, null)).toEqual({
      kind: "empty",
      rows: [],
    });
  });

  it("returns the records when the RPC succeeds", () => {
    const rows = [{ attendance_date: "2026-11-28", status: "present" }];
    expect(resolveAttendanceHistory(rows, null)).toEqual({
      kind: "records",
      rows,
    });
  });
});
