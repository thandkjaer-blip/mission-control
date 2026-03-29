import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getShellStatus } from '@/lib/shell-status';

/**
 * Legacy compatibility wrapper.
 *
 * The app shell now standardizes on app/layout.tsx + components/layout/*.
 * Keep this component aligned so older imports do not drift into a second shell path.
 */
export async function OperatorShell({ children }: { children: ReactNode }) {
  const status = await getShellStatus();

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar status={status} />
        {children}
      </main>
    </div>
  );
}
