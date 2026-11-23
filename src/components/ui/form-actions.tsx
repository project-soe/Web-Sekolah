"use client";

import { Button } from "./button";

type Props = {
  dirty: boolean;
  pending: boolean;
  savedAt: Date | null;
  onReset: () => void;
  saveLabel?: string;
  children?: React.ReactNode;
};

export function FormActions({
  dirty,
  pending,
  savedAt,
  onReset,
  saveLabel = "Simpan perubahan",
  children,
}: Props) {
  const time = savedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const status = pending
    ? "Menyimpan..."
    : dirty
      ? "Ada perubahan yang belum disimpan."
      : time
        ? `Perubahan tersimpan pukul ${time}.`
        : "Belum ada perubahan.";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={pending} disabled={!dirty}>
          {pending ? "Menyimpan..." : saveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!dirty || pending}
          onClick={onReset}
        >
          Batalkan perubahan
        </Button>
        {children}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={
          dirty && !pending ? "text-sm font-medium text-warning" : "text-sm text-muted-foreground"
        }
      >
        {status}
      </p>
    </div>
  );
}
