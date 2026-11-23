"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function Diag() {
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const add = (s: string) => setLog((l) => [...l.slice(-7), s]);
    const onErr = (e: ErrorEvent) => add("ERROR: " + e.message);
    const onRej = (e: PromiseRejectionEvent) => add("REJECT: " + String(e.reason));
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      add(`klik pada <${t.tagName.toLowerCase()}> ${String(t.className).slice(0, 40)}`);
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6">
      <p
        ref={(el) => {
          if (el) el.textContent = "Terhidrasi: YA";
        }}
        className="font-semibold"
      >
        Terhidrasi: belum
      </p>

      <button className="min-h-11 rounded-lg border px-4" onClick={() => setN(n + 1)}>
        A. Tombol biasa, hitungan: {n}
      </button>

      <Button variant="outline" onClick={() => setOpen((o) => !o)}>
        B. Komponen Button, open: {String(open)}
      </Button>

      <button
        className="min-h-11 rounded-lg border px-4"
        aria-expanded={open}
        aria-controls="panel-diag"
        onClick={() => setOpen((o) => !o)}
      >
        C. Pola menu (aria), open: {String(open)}
      </button>
      {open && (
        <div id="panel-diag" className="rounded-lg border bg-muted p-4">
          Panel terbuka
        </div>
      )}

      <pre className="min-h-24 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {log.length ? log.join("\n") : "(log klik dan error muncul di sini)"}
      </pre>
    </div>
  );
}
