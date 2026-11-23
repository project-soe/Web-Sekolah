/** Fungsi murni: membentuk URL publik objek storage. */
export function buildPublicUrl(base: string, bucket: string, path: string) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
}
