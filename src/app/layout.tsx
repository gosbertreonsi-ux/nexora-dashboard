import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NEXORA Gravity - Console Panel Matrix',
  description: 'Autonomous Zero-Trust Proof-of-Presence Dashboard Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-slate-950">
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
