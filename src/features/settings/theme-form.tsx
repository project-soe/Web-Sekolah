"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { useFormBaseline } from "@/hooks/use-form-baseline";
import { contrastRatio } from "@/utils/color";
import { resetTheme, saveTheme, type ThemeFormState } from "./theme-actions";
import { DEFAULT_THEME, MIN_CONTRAST } from "./theme-schema";

type Values = { primary: string; secondary: string };

function Ratio({ label, value }: { label: string; value: number }) {
  const ok = value >= MIN_CONTRAST;
  return (
    <p className={ok ? "text-sm text-success" : "text-sm text-danger"}>
      {label}: {value.toFixed(1)}:1 {ok ? "(lulus)" : "(terlalu rendah, minimal 4,5:1)"}
    </p>
  );
}

export function ThemeForm({ initial }: { initial: Values }) {
  const { values, setField, dirty, reset, commit, replace } = useFormBaseline<Values>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [resetting, startReset] = useTransition();

  const [state, action, pending] = useActionState(
    async (prev: ThemeFormState, formData: FormData): Promise<ThemeFormState> => {
      const res = await saveTheme(prev, formData);
      if (res.ok) {
        commit();
        setSavedAt(new Date());
        toast.success("Tema berhasil disimpan");
      } else if (res.error) {
        toast.error(res.error);
      }
      return res;
    },
    {},
  );

  function onDefault() {
    if (!window.confirm("Kembalikan warna ke bawaan?")) return;
    startReset(async () => {
      const res = await resetTheme();
      if (res.ok) {
        replace({ primary: DEFAULT_THEME.primary, secondary: DEFAULT_THEME.secondary });
        setSavedAt(new Date());
        toast.success("Warna dikembalikan ke bawaan");
      } else {
        toast.error(res.error ?? "Gagal mengembalikan warna.");
      }
    });
  }

  const colorInput = "h-11 w-20 cursor-pointer rounded-lg border border-border bg-background p-1";

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <fieldset disabled={pending} className="min-w-0 border-0 p-0">
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
                value={values.primary}
                onChange={(e) => setField("primary", e.target.value)}
                className={colorInput}
              />
            </Field>
            <Field id="secondary" label="Warna sekunder" error={state.fieldErrors?.secondary}>
              <input
                id="secondary"
                name="secondary"
                type="color"
                value={values.secondary}
                onChange={(e) => setField("secondary", e.target.value)}
                className={colorInput}
              />
            </Field>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Ratio
                label="Teks putih di atas warna utama"
                value={contrastRatio(values.primary, "#ffffff")}
              />
              <Ratio
                label="Warna utama di atas warna sekunder"
                value={contrastRatio(values.primary, values.secondary)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2" aria-label="Pratinjau">
              <span
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: values.primary }}
              >
                Tombol utama
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: values.secondary, color: values.primary }}
              >
                Lencana
              </span>
            </div>
          </CardContent>
        </Card>
      </fieldset>
      <FormActions
        dirty={dirty}
        pending={pending}
        savedAt={savedAt}
        onReset={reset}
        saveLabel="Simpan tema"
      >
        <Button type="button" variant="ghost" size="lg" loading={resetting} onClick={onDefault}>
          Kembalikan bawaan
        </Button>
      </FormActions>
    </form>
  );
}
