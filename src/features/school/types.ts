export type SchoolSettings = {
  name: string;
  slogan: string | null;
  npsn: string | null;
  nss: string | null;
  ownership: "negeri" | "swasta" | null;
  education_level: string | null;
  accreditation: string | null;
  founded_year: number | null;
  headmaster_name: string | null;
  address: string | null;
  kecamatan: string | null;
  kabupaten_kota: string | null;
  provinsi: string | null;
  postal_code: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  hero_image_path: string | null;
};

export type SchoolProfile = {
  vision: string | null;
  mission: string | null;
  history: string | null;
  objectives: string | null;
  headmaster_message: string | null;
};
