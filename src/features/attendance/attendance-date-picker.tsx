"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AttendanceDatePickerProps = {
  initialDate: string;
  minDate: string;
  maxDate: string;
};

export function AttendanceDatePicker({
  initialDate,
  minDate,
  maxDate,
}: AttendanceDatePickerProps) {
  const [date, setDate] = useState(initialDate);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    router.push(`/ruang-guru?date=${encodeURIComponent(date)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pt-2">
      <label htmlFor="attendance-date" className="grid gap-1 text-sm">
        Tanggal absensi
        <input
          id="attendance-date"
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(event) => setDate(event.target.value)}
          required
          className="min-h-10 rounded-md border border-border bg-background px-3"
        />
      </label>
      <button
        type="submit"
        className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Tampilkan
      </button>
    </form>
  );
}
