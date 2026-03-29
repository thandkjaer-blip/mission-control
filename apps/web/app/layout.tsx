import './globals.css';
import { Sidebar } from '../components/layout/sidebar';
import { Topbar } from '../components/layout/topbar';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mission Control',
  description: 'Operator shell scaffold',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <Topbar />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
