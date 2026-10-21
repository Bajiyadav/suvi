import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FraudTrace AI — Financial Crime Investigation Platform',
  description: 'Mule Account Detection & Cybercrime Network Analytics (Cyber Hackathon 2026 PS-01, Team SUVI)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
