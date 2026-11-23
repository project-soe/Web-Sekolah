"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { useFormBaseline } from "@/hooks/use-form-baseline";
import { saveSchoolIdentity, type SchoolFormState } from "./actions";
import { LEVELS, OWNERSHIP } from "./schema";
import type { SchoolSettings } from "./types";

const KEYS = [
  "name",
  "slogan",
  "npsn",
  "nss",
  "ownership",
  "education_level",
  "accreditation",
  "founded_year",
  "headmaster_name",
  "address",
  "kecamatan",
  "kabupaten_kota",
  "provinsi",
  "postal_code",
  "phone",
  "whatsapp",
  "email",
  "website",
] as const;
type Key = (typeof KEYS)[number];
type Values = Record<Key, string>;

type TextField = { name: Key; label: string; hint?: string; type?: string; wide?: boolean };

const groups: { title: string; fields: TextField[] }[] = [
  {
    title: "Identitas",
    fields: [
      { name: "name", label: "Nama sekolah", wide: true },
      { name: "slogan", label: "Slogan", wide: true },
      { name: "npsn", label: "NPSN", hint: "8 digit" },
      { name: "nss", label: "NSS (jika ada)" },
      { name: "accreditation", label: "Akreditasi", hint: "Contoh: A" },
      { name: "founded_year", label: "Tahun berdiri", hint: "4 digit" },
      { name: "headmaster_name", label: "Nama kepala sekolah", wide: true },
    ],
  },
  {
    title: "Alamat",
    fields: [
      { name: "address", label: "Alamat lengkap", wide: true },
      { name: "kecamatan", label: "Kecamatan" },
      { name: "kabupaten_kota", label: "Kabupaten/Kota" },
      { name: "provinsi", label: "Provinsi" },
      { name: "postal_code", label: "Kode pos", hint: "5 digit" },
    ],
  },
  {
    title: "Kontak",
    fields: [
      { name: "phone", label: "Telepon", type: "tel" },
      { name: "whatsapp", label: "WhatsApp", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "website", label: "Website", type: "url", hint: "Diawali https://" },
    ],
  },
];

function toValues(s: SchoolSettings): Values {
  return Object.fromEntries(KEYS.map((k) => [k, s[k] === null ? "" : String(s[k])])) as Values;
}

export function IdentityForm({ initial }: { initial: SchoolSettings }) {
  const { values, setField, dirty, reset, commit } = useFormBaseline<Values>(toValues(initial));
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> => {
      const res = await saveSchoolIdentity(prev, formData);
      if (res.ok) {
        commit();
        setSavedAt(new Date());
        toast.success("Identitas sekolah berhasil disimpan");
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
        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader>
              <CardTitle>{g.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {g.title === "Identitas" && (
                <>
                  <Field id="ownership" label="Status">
                    <Select
                      id="ownership"
                      name="ownership"
                      value={values.ownership}
                      onChange={(e) => setField("ownership", e.target.value)}
                    >
                      <option value="">Pilih status</option>
                      {OWNERSHIP.map((o) => (
                        <option key={o} value={o}>
                          {o === "negeri" ? "Negeri" : "Swasta"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="education_level" label="Jenjang">
                    <Select
                      id="education_level"
                      name="education_level"
                      value={values.education_level}
                      onChange={(e) => setField("education_level", e.target.value)}
                    >
                      <option value="">Pilih jenjang</option>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              )}
              {g.fields.map((f) => (
                <div key={f.name} className={f.wide ? "sm:col-span-2" : undefined}>
                  <Field
                    id={f.name}
                    label={f.label}
                    hint={f.hint}
                    error={state.fieldErrors?.[f.name]}
                    required={f.name === "name"}
                  >
                    <Input
                      id={f.name}
                      name={f.name}
                      type={f.type ?? "text"}
                      value={values[f.name]}
                      onChange={(e) => setField(f.name, e.target.value)}
                      invalid={!!state.fieldErrors?.[f.name]}
                      required={f.name === "name"}
                    />
                  </Field>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </fieldset>
      <FormActions dirty={dirty} pending={pending} savedAt={savedAt} onReset={reset} />
    </form>
  );
}
