"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function SearchToggle() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) {
      setError("Masukkan minimal 2 karakter.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setOpen(false);
    router.push(`/cari?q=${encodeURIComponent(term)}`);
  }

  return (
    <>
      <Button
        variant="ghost"
        className="px-3"
        aria-label={open ? "Tutup pencarian" : "Buka pencarian"}
        aria-expanded={open}
        aria-controls="search-panel"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
      </Button>
      {open && (
        <div
          id="search-panel"
          className="absolute inset-x-0 top-full border-b border-border bg-background p-3 shadow-lg"
        >
          <form role="search" onSubmit={onSubmit} className="mx-auto flex max-w-2xl gap-2">
            <Input
              ref={inputRef}
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari berita, pengumuman, jurusan..."
              aria-label="Kata kunci pencarian"
              invalid={!!error}
              autoComplete="off"
            />
            <Button type="submit">Cari</Button>
          </form>
          {error && (
            <p role="alert" className="mx-auto mt-2 max-w-2xl text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
