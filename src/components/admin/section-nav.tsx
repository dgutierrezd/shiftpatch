"use client";

import { useEffect, useState } from "react";

export interface Anchor {
  id: string;
  label: string;
}

/**
 * Sticky in-page contents line. Marks the section currently in the reading band of the
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
      className="sticky top-0 z-30 -mx-5 border-b border-rule bg-paper px-5 sm:-mx-8 sm:px-8 print:hidden"
    >
      <ul className="flex gap-6 overflow-x-auto py-3 text-small [scrollbar-width:none]">
        {anchors.map((a) => {
          const current = active === a.id;
          return (
            <li key={a.id} className="shrink-0">
              <a
                href={`#${a.id}`}
                aria-current={current ? "location" : undefined}
                className={`rounded-[2px] whitespace-nowrap underline-offset-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  current ? "text-ink underline decoration-ink/60" : "text-muted hover:text-ink"
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
