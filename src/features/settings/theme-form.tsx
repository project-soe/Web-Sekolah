"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { contrastRatio } from "@/utils/color";
import { resetTheme, saveTheme } from "./theme-actions";
import { DEFAULT_THEME, MIN_CONTRAST, type Theme } from "./theme-schema";

function Ratio({ label, value }: { label: string; value: number }) {
  const ok = value >= MIN_CONTRAST;
  return (
    <p className={ok ? "text-sm text-success" : "text-sm text-danger"}>
      {label}: {value.toFixed(1)}:1 {ok ? "(lulus)" : "(terlalu rendah, minimal 4,5:1)"}
    </p>
  );
}

export function ThemeForm({ initial }: { initial: Theme }) {
  const [state, action, pending] = useActionState(saveTheme, {});
  const [primary, setPrimary] = useState<string>(initial.primary);
  const [secondary, setSecondary] = useState<string>(initial.secondary);
  const [resetting, startReset] = useTransition();

  useEffect(() => {
    if (state.ok) toast.success("Tema berhasil disimpan");
    else if (state.error) toast.error(state.error);
  }, [state]);

  function onReset() {
    if (!window.confirm("Kembalikan warna ke bawaan?")) return;
    startReset(async () => {
      const res = await resetTheme();
      if (res.ok) {
        setPrimary(DEFAULT_THEME.primary);
        setSecondary(DEFAULT_THEME.secondary);
        toast.success("Warna dikembalikan ke bawaan");
      } else {
        toast.error(res.error ?? "Gagal mengembalikan warna.");
      }
    });
  }

  const colorInput = "h-11 w-20 cursor-pointer rounded-lg border border-border bg-background p-1";

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Warna situs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Perubahan berlaku untuk situs publik dan dashboard. Warna yang sulit dibaca akan
            ditolak.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Field id="primary" label="Warna utama" error={state.fieldErrors?.primary}>
            <input
              id="primary"
              name="primary"
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className={colorInput}
            />
          </Field>
          <Field id="secondary" label="Warna sekunder" error={state.fieldErrors?.secondary}>
            <input
              id="secondary"
              name="secondary"
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className={colorInput}
            />
          </Field>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Ratio
              label="Teks putih di atas warna utama"
              value={contrastRatio(primary, "#ffffff")}
            />
            <Ratio
              label="Warna utama di atas warna sekunder"
              value={contrastRatio(primary, secondary)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2" aria-label="Pratinjau">
            <span
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: primary }}
            >
              Tombol utama
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: secondary, color: primary }}
            >
              Lencana
            </span>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={pending}>
          Simpan tema
        </Button>
        <Button type="button" variant="outline" size="lg" loading={resetting} onClick={onReset}>
          Kembalikan bawaan
        </Button>
      </div>
    </form>
  );
}
