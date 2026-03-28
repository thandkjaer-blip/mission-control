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
    <Link href={href} className={`nav-link${active ? ' active' : ''}`}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.86rem', marginTop: 4 }}>{description}</div>
    </Link>
  );
}
