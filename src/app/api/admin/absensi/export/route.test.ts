import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { GET } from "@/app/api/admin/absensi/export/route";

function request(month?: string) {
  const url = new URL("http://localhost/api/admin/absensi/export");
  if (month !== undefined) url.searchParams.set("month", month);
  return { nextUrl: url } as NextRequest;
}

describe("GET /api/admin/absensi/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      userId: "user-1",
      email: "admin@example.test",
      access: { is_super_admin: false, roles: ["admin_sekolah"], permissions: ["attendance:view_all"] },
    });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("rejects unauthenticated requests without querying attendance data", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(request("2026-11"));

    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects accounts without attendance:view_all", async () => {
    mocks.getSession.mockResolvedValue({
      userId: "teacher-1",
      email: "teacher@example.test",
      access: { is_super_admin: false, roles: ["guru"], permissions: [] },
    });

    const response = await GET(request("2026-11"));

    expect(response.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["", "2026-00", "2026-13", "2026-1", "2026-11-01", "abcd-11"])(
    "rejects invalid month parameter %s",
    async (month) => {
      const response = await GET(request(month));

      expect(response.status).toBe(400);
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );

  it("returns a downloadable CSV using the selected month and the monthly summary RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        class_name: "X RPL",
        academic_year: "2026/2027",
        session_count: 2,
        student_day_count: 60,
        present_count: 50,
        late_count: 2,
        sick_count: 3,
        excused_count: 1,
        absent_count: 4,
        attendance_percentage: 86.6667,
      }],
      error: null,
    });

    const response = await GET(request("2026-11"));
    const csvBytes = new Uint8Array(await response.arrayBuffer());
    const csv = new TextDecoder().decode(csvBytes);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="rekap-absensi-2026-11.csv"');
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    // Response.text() strips a leading UTF-8 BOM during decoding, so assert its raw bytes.
    expect(Array.from(csvBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv).toContain('"X RPL"');
    expect(csv).toContain('"86.67"');
    expect(mocks.rpc).toHaveBeenCalledWith("admin_attendance_monthly_summary", { p_month: "2026-11-01" });
  });

  it("returns a safe server error when the monthly summary RPC fails", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "sensitive database detail" },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(request("2026-11"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Gagal membuat ekspor rekap absensi." });
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
    expect(errorSpy).toHaveBeenCalledWith("attendance_monthly_export_failed", {
      code: "XX000",
      message: "sensitive database detail",
    });
    errorSpy.mockRestore();
  });
});
