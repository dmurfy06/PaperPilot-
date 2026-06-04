import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaperPilot - Understand Research Papers Quickly',
  description: 'AI-powered research paper analysis for students. Get summaries, findings, and key concepts from scientific papers instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
