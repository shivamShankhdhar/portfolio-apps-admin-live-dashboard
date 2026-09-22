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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090b] text-slate-100 min-h-screen antialiased bg-developer-grid bg-radial-glow`}>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          toastOptions={{
            style: {
              background: '#12131c',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#ffffff',
            },
          }}
        />
      </body>
    </html>
  );
}
