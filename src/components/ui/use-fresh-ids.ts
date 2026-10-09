"use client";

import { useState } from "react";

interface Tracked {
  known: ReadonlySet<string> | null;
  fresh: ReadonlySet<string>;
}

const NONE: ReadonlySet<string> = new Set();

/**
 * Ids that appeared after the first loaded batch (e.g. a shift posted or claimed just now),
 * so their rows can flash once on mount. The first batch never counts as fresh.
 * Uses the "adjust state while rendering" pattern, so fresh rows get the class on mount.
 */
export function useFreshIds(ids: readonly string[] | null | undefined): ReadonlySet<string> {
  const [tracked, setTracked] = useState<Tracked>({ known: null, fresh: NONE });
  if (!ids) return tracked.fresh;

  const { known } = tracked;
  if (known === null) {
    setTracked({ known: new Set(ids), fresh: NONE });
    return NONE;
  }
  const added = ids.filter((id) => !known.has(id));
  if (added.length > 0) {
    const fresh = new Set(added);
    setTracked({ known: new Set([...known, ...ids]), fresh });
    return fresh;
  }
  return tracked.fresh;
}
