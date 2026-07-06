import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/src/context/AuthContext';

export const metadata: Metadata = {
  title: 'WellSync - Connected Personal Health & Care Platform',
  description:
    'A secure connected personal health, nutrition, hydration, sleep, medication, appointments, and family care coordination workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
