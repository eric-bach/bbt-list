import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BBT List - Top Bubble Tea Shops & Drinks',
  description:
    'Discover, rank, and review the best bubble tea shops and drinks worldwide.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='antialiased min-h-screen flex flex-col'>{children}</body>
    </html>
  );
}
