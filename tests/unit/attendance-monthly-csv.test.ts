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

  it.each(["=1+1", "+1+1", "-1+1", "@SUM(1,1)", "\t=1+1", "\r+1+1", "\n-1+1", " \t@SUM(1,1)"])(
    "neutralizes formula prefixes even after leading whitespace or control characters (%j)",
    (value) => {
      const csv = buildMonthlyAttendanceCsv([{
        class_name: value,
        academic_year: "2026/2027",
        session_count: 1,
        student_day_count: 1,
        present_count: 1,
        late_count: 0,
        sick_count: 0,
        excused_count: 0,
        absent_count: 0,
        attendance_percentage: 100,
      }]);
      const escaped = "'" + value.replaceAll('"', '""');
      expect(csv).toContain('"' + escaped + '"');
    },
  );

  it.each(["\\u00a0=1+1", "\\u3000@SUM(1,1)", "\\uFEFF+1"])(
    "neutralizes formula prefixes after Unicode whitespace (%j)",
    (value) => {
      const csv = buildMonthlyAttendanceCsv([{
        class_name: value,
        academic_year: "2026/2027",
        session_count: 1,
        student_day_count: 1,
        present_count: 1,
        late_count: 0,
        sick_count: 0,
        excused_count: 0,
        absent_count: 0,
        attendance_percentage: 100,
      }]);
      expect(csv).toContain('"\\'" + value + '"');
    },
  );

  it("neutralizes formula-like values in numeric fields received as strings", () => {
    const csv = buildMonthlyAttendanceCsv([{
      class_name: "X RPL",
      academic_year: "2026/2027",
      session_count: "=1+1",
      student_day_count: 1,
      present_count: 1,
      late_count: 0,
      sick_count: 0,
      excused_count: 0,
      absent_count: 0,
      attendance_percentage: 100,
    }]);
    expect(csv).toContain('"\'=1+1"');
  });

  it("returns headers when there are no final sessions", () => {
    const csv = buildMonthlyAttendanceCsv([]);
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Persentase hadir (%)"');
  });
});
