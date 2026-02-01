import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TB Infections Simulator',
  description:
    'Interactive tuberculosis vaccination simulator for the UK - visualize the impact of vaccination policies on disease spread',
  keywords: ['TB', 'tuberculosis', 'vaccination', 'simulator', 'UK', 'public health', 'SEIR model'],
  authors: [{ name: 'TB Simulator Team' }],
  openGraph: {
    title: 'TB Infections Simulator',
    description: 'Visualize the impact of vaccination policies on tuberculosis spread in the UK',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
