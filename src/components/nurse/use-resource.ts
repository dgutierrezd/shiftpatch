"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api-client";

export interface Resource<T> {
  data: T | null;
  error: string | null;
  /** True until the latest request settles (stale data stays visible meanwhile). */
  loading: boolean;
  reload: () => void;
}

interface Settled<T> {
  data: T | null;
  error: string | null;
  version: number;
}

/**
 * Fetches a JSON route and re-fetches whenever `reload()` is called. `select` maps the raw
 * response to the value the UI needs; pass a module-level function so it stays stable.
 */
export function useResource<R, T>(path: string, select: (raw: R) => T): Resource<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ data: null, error: null, version: -1 });

  useEffect(() => {
    let active = true;
    api<R>(path)
      .then((raw) => {
        if (active) setSettled({ data: select(raw), error: null, version });
      })
      .catch((err: unknown) => {
        if (active) setSettled((prev) => ({ data: prev.data, error: errorMessage(err), version }));
      });
    return () => {
      active = false;
    };
  }, [path, select, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: settled.data,
    error: settled.error,
    loading: settled.version !== version,
    reload,
  };
}
