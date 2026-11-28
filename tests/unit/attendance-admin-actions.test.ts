import { beforeEach, describe, expect, it, vi } from "vitest";
import { correctAttendance, setAttendanceLock } from "@/features/attendance/admin-actions";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  can: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/rbac/access", () => ({ can: mocks.can }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

const entryId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("attendance admin server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ access: { permissions: [] } });
    mocks.can.mockReturnValue(true);
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  describe("correctAttendance", () => {
    it("rejects invalid entry IDs, statuses, and correction reasons before accessing the session", async () => {
      await expect(correctAttendance(form({
        entry_id: "not-a-uuid",
        status: "present",
        reason: "Koreksi data",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=validasi");

      await expect(correctAttendance(form({
        entry_id: entryId,
        status: "unknown",
        reason: "Koreksi data",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=validasi");

      await expect(correctAttendance(form({
        entry_id: entryId,
        status: "present",
        reason: "oops",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=validasi");

      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it("requires an authenticated session and the attendance correction permission", async () => {
      mocks.getSession.mockResolvedValueOnce(null);
      await expect(correctAttendance(form({
        entry_id: entryId,
        status: "late",
        reason: "Perbaikan data",
      }))).rejects.toThrow("REDIRECT:/login");

      mocks.can.mockReturnValueOnce(false);
      await expect(correctAttendance(form({
        entry_id: entryId,
        status: "late",
        reason: "Perbaikan data",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=akses");

      expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it("sends normalized correction data to the RPC and revalidates affected pages", async () => {
      await expect(correctAttendance(form({
        entry_id: entryId,
        status: "sick",
        note: "  Surat dokter  ",
        reason: "  Surat dokter diterima  ",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?saved=koreksi");

      expect(mocks.rpc).toHaveBeenCalledWith("correct_attendance_entry", {
        p_entry_id: entryId,
        p_status: "sick",
        p_note: "Surat dokter",
        p_reason: "Surat dokter diterima",
      });
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/absensi");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/portal");
    });
  });

  describe("setAttendanceLock", () => {
    it("requires a reason when unlocking and rejects malformed session IDs", async () => {
      await expect(setAttendanceLock(form({
        session_id: sessionId,
        locked: "false",
        reason: "no",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=validasi");

      await expect(setAttendanceLock(form({
        session_id: "invalid",
        locked: "true",
        reason: "",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=validasi");

      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it("requires the attendance lock permission before calling the RPC", async () => {
      mocks.can.mockReturnValueOnce(false);
      await expect(setAttendanceLock(form({
        session_id: sessionId,
        locked: "true",
        reason: "",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?error=akses");

      expect(mocks.createClient).not.toHaveBeenCalled();
    });

    it("allows locking without a reason and records the requested lock state", async () => {
      await expect(setAttendanceLock(form({
        session_id: sessionId,
        locked: "true",
        reason: "",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?saved=dikunci");

      expect(mocks.rpc).toHaveBeenCalledWith("set_attendance_session_lock", {
        p_session_id: sessionId,
        p_locked: true,
        p_reason: null,
      });
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/absensi");
    });

    it("requires a meaningful reason and forwards it when unlocking", async () => {
      await expect(setAttendanceLock(form({
        session_id: sessionId,
        locked: "false",
        reason: "  Data sudah diperiksa  ",
      }))).rejects.toThrow("REDIRECT:/admin/absensi?saved=dibuka");

      expect(mocks.rpc).toHaveBeenCalledWith("set_attendance_session_lock", {
        p_session_id: sessionId,
        p_locked: false,
        p_reason: "Data sudah diperiksa",
      });
    });
  });
});
