"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { saveSchoolIdentity } from "./actions";
import { LEVELS, OWNERSHIP } from "./schema";
import type { SchoolSettings } from "./types";

type TextField = {
  name: keyof SchoolSettings;
  label: string;
  hint?: string;
  type?: string;
  wide?: boolean;
};

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

export function IdentityForm({ initial }: { initial: SchoolSettings }) {
  const [state, action, pending] = useActionState(saveSchoolIdentity, {});

  useEffect(() => {
    if (state.ok) toast.success("Identitas sekolah berhasil disimpan");
    else if (state.error) toast.error(state.error);
  }, [state]);

  const val = (name: keyof SchoolSettings) =>
    state.values?.[name] ?? (initial[name] === null ? "" : String(initial[name]));

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      {groups.map((g) => (
        <Card key={g.title}>
          <CardHeader>
            <CardTitle>{g.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {g.title === "Identitas" && (
              <>
                <Field id="ownership" label="Status">
                  <Select id="ownership" name="ownership" defaultValue={val("ownership")}>
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
                    defaultValue={val("education_level")}
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
                    defaultValue={val(f.name)}
                    invalid={!!state.fieldErrors?.[f.name]}
                    required={f.name === "name"}
                  />
                </Field>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div>
        <Button type="submit" size="lg" loading={pending}>
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}
