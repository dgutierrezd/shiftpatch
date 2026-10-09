"use client";

import { useEffect, useState } from "react";
import { api, apiList, errorMessage } from "@/lib/api-client";

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
}

interface State<T> {
  key: string;
  data: T | undefined;
  error: string | null;
}

/**
 * GETs `path` and refetches whenever `version` changes (bump it after a mutation) and,
 * optionally, every `intervalMs`. Keeps the last good data while a refetch fails.
 * Pass `listKey` for list routes that wrap their array (e.g. `{ timesheets: [...] }`).
 */
export function useResource<T>(
  path: string,
  version: number,
  intervalMs?: number,
  listKey?: string,
): Resource<T> {
  const [state, setState] = useState<State<T>>({ key: path, data: undefined, error: null });

  useEffect(() => {
    let active = true;
    const load = () => {
      const request = listKey ? (apiList(path, listKey) as Promise<T>) : api<T>(path);
      request
        .then((data) => {
          if (active) setState({ key: path, data, error: null });
        })
        .catch((err: unknown) => {
          if (!active) return;
          setState((prev) => ({
            key: path,
            data: prev.key === path ? prev.data : undefined,
            error: errorMessage(err),
          }));
        });
    };
    load();
    const timer = intervalMs ? setInterval(load, intervalMs) : undefined;
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [path, version, intervalMs, listKey]);

  const current = state.key === path;
  const data = current ? state.data : undefined;
  const error = current ? state.error : null;
  return { data, error, loading: data === undefined && error === null };
}
