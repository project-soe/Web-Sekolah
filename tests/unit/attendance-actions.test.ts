import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAttendanceDraft, submitAttendance } from "@/features/attendance/actions";

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

const classGroupId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function validForm() {
  return form({
    class_group_id: classGroupId,
    attendance_date: "2026-11-28",
    ["status:" + studentId]: "present",
    ["note:" + studentId]: "  Hadir tepat waktu  ",
  });
}

describe("teacher attendance server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ access: { permissions: [] } });
    mocks.can.mockReturnValue(true);
    mocks.rpc.mockResolvedValue({ data: "33333333-3333-4333-8333-333333333333", error: null });
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("rejects invalid calendar dates before checking authentication", async () => {
    await expect(saveAttendanceDraft(form({
      class_group_id: classGroupId,
      attendance_date: "2026-02-31",
    }))).rejects.toThrow("REDIRECT:/ruang-guru?error=validasi");

    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed student ID", { ["status:not-a-uuid"]: "present" }],
    ["unknown status", { ["status:" + studentId]: "unknown" }],
    ["oversized note", { ["status:" + studentId]: "present", ["note:" + studentId]: "x".repeat(501) }],
  ])("rejects %s before calling the database", async (_label, fields) => {
    const data = form({ class_group_id: classGroupId, attendance_date: "2026-11-28" });
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    await expect(saveAttendanceDraft(data)).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&error=validasi");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects duplicate student status fields rather than allowing last-value-wins", async () => {
    const data = validForm();
    data.append("status:" + studentId, "absent");
    await expect(saveAttendanceDraft(data)).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&error=validasi");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("requires authentication and attendance-taking permission", async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    await expect(saveAttendanceDraft(validForm())).rejects.toThrow("REDIRECT:/login");

    mocks.can.mockReturnValueOnce(false);
    await expect(saveAttendanceDraft(validForm())).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&error=akses");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("sends trimmed, validated entries to the draft RPC and revalidates teacher and student views", async () => {
    await expect(saveAttendanceDraft(validForm())).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&saved=draft");
    expect(mocks.rpc).toHaveBeenCalledWith("save_class_attendance", {
      p_class_group_id: classGroupId,
      p_date: "2026-11-28",
      p_entries: [{ student_id: studentId, status: "present", note: "Hadir tepat waktu" }],
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ruang-guru");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/portal");
  });

  it("checks submit permission and submits only after the draft save succeeds", async () => {
    mocks.can.mockImplementation((_access: unknown, permission: string) => permission === "attendance:take");
    await expect(submitAttendance(validForm())).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&error=akses");
    expect(mocks.createClient).not.toHaveBeenCalled();

    mocks.can.mockReturnValue(true);
    mocks.rpc
      .mockResolvedValueOnce({ data: "33333333-3333-4333-8333-333333333333", error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(submitAttendance(validForm())).rejects.toThrow("REDIRECT:/ruang-guru?date=2026-11-28&saved=terkirim");
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "save_class_attendance", expect.any(Object));
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "submit_class_attendance", {
      p_session_id: "33333333-3333-4333-8333-333333333333",
    });
  });
});
