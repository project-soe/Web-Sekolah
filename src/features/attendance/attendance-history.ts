export type AttendanceHistoryState<T> =
  | { kind: "error"; rows: [] }
  | { kind: "empty"; rows: [] }
  | { kind: "records"; rows: T[] };

export function resolveAttendanceHistory<T>(
  data: T[] | null,
  error: unknown,
): AttendanceHistoryState<T> {
  if (error) return { kind: "error", rows: [] };
  const rows = data ?? [];
  return rows.length > 0
    ? { kind: "records", rows }
    : { kind: "empty", rows: [] };
}
