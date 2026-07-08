import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meeting Copilot',
  description: 'Turn meeting notes into action items, strategic advice, and deadline reminders.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
