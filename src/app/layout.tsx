import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FoodRescue AI — Intelligent Food Redistribution Network',
  description: 'Multi-agent food surplus redistribution powered by Google Gemini 2.5 Flash on Vertex AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
