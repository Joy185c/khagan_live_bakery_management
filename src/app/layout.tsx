import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth/auth-context';
import { DatabaseProvider } from '@/lib/db/store';

export const metadata: Metadata = {
  title: 'Khagan Live Bakery — ERP & POS System',
  description: 'Complete bilingual bakery ERP, production management, inventory, costing and POS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F9F8] text-[#172B22] antialiased">
        <I18nProvider>
          <AuthProvider>
            <DatabaseProvider>{children}</DatabaseProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
