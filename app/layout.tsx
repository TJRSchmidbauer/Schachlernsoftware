import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const metadata: Metadata = { title: 'Schachlabor · Lernen durch Züge', description: 'Ein visuelles Schachlabor mit gestuften Hilfen.' };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="de"><body>{children}</body></html>;
}
