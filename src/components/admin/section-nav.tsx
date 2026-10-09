"use client";

import { useEffect, useState } from "react";

export interface Anchor {
  id: string;
  label: string;
}

/**
 * Sticky in-page navigation. Highlights the section currently in the reading band of the
 * viewport (IntersectionObserver; no scroll listeners). Plain anchor links, so it works
 * with the keyboard and without JavaScript.
 */
export function SectionNav({ anchors }: { anchors: Anchor[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = anchors
      .map((a) => document.getElementById(a.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [anchors]);

  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-0 z-30 -mx-4 border-b border-border/70 bg-background/85 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 print:hidden"
    >
      <ul className="flex gap-2 overflow-x-auto text-sm [scrollbar-width:none]">
        {anchors.map((a) => {
          const current = active === a.id;
          return (
            <li key={a.id} className="shrink-0">
              <a
                href={`#${a.id}`}
                aria-current={current ? "location" : undefined}
                className={`inline-block rounded-full border px-3 py-1 whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  current
                    ? "border-brand bg-brand-soft font-medium text-brand-strong"
                    : "border-border bg-surface text-muted hover:border-brand hover:text-brand-strong"
                }`}
              >
                {a.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
