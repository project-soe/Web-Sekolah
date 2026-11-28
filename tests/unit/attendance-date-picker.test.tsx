import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceDatePicker } from "@/features/attendance/attendance-date-picker";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("AttendanceDatePicker", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("shows the selected date and enforces the seven-day calendar window", () => {
    render(
      <AttendanceDatePicker
        initialDate="2026-11-28"
        minDate="2026-11-21"
        maxDate="2026-11-28"
      />,
    );

    const input = screen.getByLabelText("Tanggal absensi");
    expect(input).toHaveValue("2026-11-28");
    expect(input).toHaveAttribute("min", "2026-11-21");
    expect(input).toHaveAttribute("max", "2026-11-28");
  });

  it("navigates with the newly selected date instead of the initial date", () => {
    render(
      <AttendanceDatePicker
        initialDate="2026-11-28"
        minDate="2026-11-21"
        maxDate="2026-11-28"
      />,
    );

    const input = screen.getByLabelText("Tanggal absensi");
    fireEvent.change(input, { target: { value: "2026-11-21" } });
    fireEvent.submit(input.closest("form")!);

    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/ruang-guru?date=2026-11-21");
  });

  it("does not navigate when the selected date is empty", () => {
    render(
      <AttendanceDatePicker
        initialDate=""
        minDate="2026-11-21"
        maxDate="2026-11-28"
      />,
    );

    const input = screen.getByLabelText("Tanggal absensi");
    fireEvent.submit(input.closest("form")!);

    expect(push).not.toHaveBeenCalled();
  });
});
