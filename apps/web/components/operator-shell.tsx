import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

/**
 * Legacy compatibility wrapper.
 *
 * The app shell now standardizes on app/layout.tsx + components/layout/*.
 * Keep this component aligned so older imports do not drift into a second shell path.
 */
export function OperatorShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
