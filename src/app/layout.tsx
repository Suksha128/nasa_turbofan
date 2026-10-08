import type { Metadata } from 'next';
import './globals.css';
import { PdmProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'NASA C-MAPSS Turbofan Predictive Maintenance (PdM) Dashboard',
  description: 'Mission-critical aerospace Remaining Useful Life (RUL) forecasting and fleet reliability twin based on NASA C-MAPSS FD001.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <PdmProvider>{children}</PdmProvider>
      </body>
    </html>
  );
}
