import { describe, expect, it } from "vitest";
import { buildMonthlyAttendanceCsv } from "@/features/attendance/monthly-csv";

describe("buildMonthlyAttendanceCsv", () => {
  it("writes UTF-8 BOM, quoted headings, escaped values, and two-decimal percentages", () => {
    const csv = buildMonthlyAttendanceCsv([{
      class_name: 'X "RPL", Pagi',
      academic_year: "2026/2027",
      session_count: 12,
      student_day_count: 420,
      present_count: 350,
      late_count: 20,
      sick_count: 15,
      excused_count: 10,
      absent_count: 25,
      attendance_percentage: 88.095,
    }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Rombel","Tahun ajaran","Jumlah sesi"');
    expect(csv).toContain('"X ""RPL"", Pagi"');
    expect(csv).toContain('"88.10"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("neutralizes spreadsheet formula prefixes in untrusted text fields", () => {
    const csv = buildMonthlyAttendanceCsv([{
      class_name: '=HYPERLINK("https://evil.example","click")',
      academic_year: "@SUM(1,1)",
      session_count: 1, student_day_count: 1, present_count: 1, late_count: 0,
      sick_count: 0, excused_count: 0, absent_count: 0, attendance_percentage: 100,
    }]);
    expect(csv).toContain('"\'=HYPERLINK(""https://evil.example"",""click"")"');
    expect(csv).toContain('"\'@SUM(1,1)"');
  });

  it("returns headers when there are no final sessions", () => {
    const csv = buildMonthlyAttendanceCsv([]);
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Persentase hadir (%)"');
  });
});
