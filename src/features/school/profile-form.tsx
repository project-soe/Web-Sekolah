"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { useFormBaseline } from "@/hooks/use-form-baseline";
import { saveSchoolProfile, type ProfileFormState } from "./profile-actions";
import { PROFILE_FIELDS } from "./profile-schema";
import type { SchoolProfile } from "./types";

type Key = (typeof PROFILE_FIELDS)[number]["name"];
type Values = Record<Key, string>;

function toValues(p: SchoolProfile): Values {
  return Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, p[f.name] ?? ""])) as Values;
}

export function ProfileForm({ initial }: { initial: SchoolProfile }) {
  const { values, setField, dirty, reset, commit } = useFormBaseline<Values>(toValues(initial));
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> => {
      const res = await saveSchoolProfile(prev, formData);
      if (res.ok) {
        commit();
        setSavedAt(new Date());
        toast.success("Profil sekolah berhasil disimpan");
      } else if (res.error) {
        toast.error(res.error);
      }
      return res;
    },
    {},
  );

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-6 border-0 p-0">
        {PROFILE_FIELDS.map((f) => (
          <Card key={f.name}>
            <CardContent>
              <Field
                id={f.name}
                label={f.label}
                hint={"hint" in f ? f.hint : undefined}
                error={state.fieldErrors?.[f.name]}
              >
                <Textarea
                  id={f.name}
                  name={f.name}
                  rows={f.rows}
                  value={values[f.name]}
                  onChange={(e) => setField(f.name, e.target.value)}
                  invalid={!!state.fieldErrors?.[f.name]}
                />
              </Field>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {values[f.name].length}/{f.max}
              </p>
            </CardContent>
          </Card>
        ))}
      </fieldset>
      <FormActions dirty={dirty} pending={pending} savedAt={savedAt} onReset={reset} />
    </form>
  );
}
