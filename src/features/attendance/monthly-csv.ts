export type MonthlyAttendanceCsvRow = {
  class_name: string;
  academic_year: string;
  session_count: number | string;
  student_day_count: number | string;
  present_count: number | string;
  late_count: number | string;
  sick_count: number | string;
  excused_count: number | string;
  absent_count: number | string;
  attendance_percentage: number | string;
};

function csvCell(value: string | number): string {
  let text = String(value);
  // Prevent spreadsheet formula execution when CSV is opened in Excel/Sheets.
  if (/^\s*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

function formatPercentage(value: number | string): string {
  const percentage = Number(value);
  const rounded = Math.round((percentage + Number.EPSILON * Math.abs(percentage)) * 100) / 100;
  return rounded.toFixed(2);
}

export function buildMonthlyAttendanceCsv(rows: MonthlyAttendanceCsvRow[]): string {
  const header = [
    "Rombel", "Tahun ajaran", "Jumlah sesi", "Catatan siswa-hari",
    "Hadir", "Terlambat", "Sakit", "Izin", "Alpa", "Persentase hadir (%)",
  ];
  const records = rows.map((row) => [
    row.class_name, row.academic_year, row.session_count, row.student_day_count,
    row.present_count, row.late_count, row.sick_count, row.excused_count,
    row.absent_count, formatPercentage(row.attendance_percentage),
  ]);
  return "\uFEFF" + [header, ...records].map((record) => record.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
