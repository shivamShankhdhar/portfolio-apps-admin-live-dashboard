import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Control Center | Portfolio & Apps Hub',
  description: 'Unified administrative dashboard for managing Apps, Games, and Portfolio data.',
  icons: {
    icon: '/favicon.ico',
  },
};

import QueryProvider from '@/components/providers/QueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#09090b] text-[#f4f4f5] min-h-screen antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: '#1A1D1F',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            },
          }}
        />
      </body>
    </html>
  );
}
