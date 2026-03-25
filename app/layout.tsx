import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Email To-Do',
  description: 'Gmail-inspired email client with smart task management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
