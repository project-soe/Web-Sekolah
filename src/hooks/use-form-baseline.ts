"use client";

import { useCallback, useEffect, useState } from "react";

/** Melacak nilai form terhadap versi tersimpan terakhir (baseline) untuk status "ada perubahan". */
export function useFormBaseline<T extends Record<string, string>>(initial: T) {
  const [baseline, setBaseline] = useState<T>(initial);
  const [values, setValues] = useState<T>(initial);

  const dirty = (Object.keys(baseline) as (keyof T)[]).some((k) => values[k] !== baseline[k]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = useCallback(
    (name: keyof T, value: string) => setValues((prev) => ({ ...prev, [name]: value })),
    [],
  );
  const reset = useCallback(() => setValues(baseline), [baseline]);
  const commit = useCallback(() => setBaseline(values), [values]);
  const replace = useCallback((next: T) => {
    setBaseline(next);
    setValues(next);
  }, []);

  return { values, setField, dirty, reset, commit, replace };
}
