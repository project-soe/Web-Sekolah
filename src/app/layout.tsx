import { ThemeStyle } from "@/features/settings/theme-style";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Website Sekolah",
    template: "%s | Website Sekolah",
  },
  description: "Website resmi sekolah — informasi profil, layanan pendidikan, berita, dan pengumuman.",
  applicationName: "Website Sekolah",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeStyle />
        {children}
      </body>
    </html>
  );
}
