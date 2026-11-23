import { getTheme } from "./theme-queries";

/** Nilai sudah divalidasi ketat (#RRGGBB) oleh themeSchema, jadi aman dipasang sebagai CSS. */
export async function ThemeStyle() {
  const theme = await getTheme();
  if (!theme) return null;
  const css = `:root{--primary:${theme.primary};--secondary:${theme.secondary};--secondary-foreground:${theme.primary};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
