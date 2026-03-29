import './globals.css';
import { Sidebar } from '../components/layout/sidebar';
import { Topbar } from '../components/layout/topbar';
import { getShellStatus } from '../lib/shell-status';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mission Control',
  description: 'Operator shell scaffold',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const status = await getShellStatus();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <Topbar status={status} />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
