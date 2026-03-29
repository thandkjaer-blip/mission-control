'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

export function ShellNavLink({
  href,
  label,
  description,
}: {
  href: Route;
  label: string;
  description: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={`nav-link nav-link-rich${active ? ' active' : ''}`}>
      <div className="nav-link-row">
        <div style={{ fontWeight: 700 }}>{label}</div>
        <span className="nav-link-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="nav-link-description muted">{description}</div>
    </Link>
  );
}
