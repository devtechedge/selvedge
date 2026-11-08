"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [
  ["/studio", "Desk"],
  ["/drafts", "Drafts"],
  ["/projects", "Projects"],
  ["/yarn", "Yarn"],
  ["/looms", "Looms"],
  ["/releases", "Releases"],
  ["/team", "Team"],
];

export function StudioNav() {
  const path = usePathname();
  return (
    <nav className="studio-nav" aria-label="Studio">
      {LINKS.map(([href, label]) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}