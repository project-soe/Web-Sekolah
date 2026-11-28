import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { buildMonthlyAttendanceCsv, type MonthlyAttendanceCsvRow } from "@/features/attendance/monthly-csv";

export const dynamic = "force-dynamic";

function isMonth(value: string | null): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
  const date = new Date(value + "-01T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 7) === value;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthenticated" }, { status: 401 });
  if (!can(session.access, "attendance:view_all")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const month = request.nextUrl.searchParams.get("month");
  if (!isMonth(month)) {
    return Response.json({ error: "Parameter month harus berformat YYYY-MM." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_attendance_monthly_summary", {
    p_month: month + "-01",
  });
  if (error) {
    console.error("attendance_monthly_export_failed", { code: error.code, message: error.message });
    return Response.json({ error: "Gagal membuat ekspor rekap absensi." }, { status: 500 });
  }

  const csv = buildMonthlyAttendanceCsv((data ?? []) as MonthlyAttendanceCsvRow[]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rekap-absensi-' + month + '.csv"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
