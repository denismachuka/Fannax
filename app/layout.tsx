import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Fannax - Football Social Network',
  description: 'The ultimate football fans social network. Share predictions, follow your favorite teams, and connect with fans worldwide.',
  keywords: ['football', 'soccer', 'social network', 'predictions', 'sports', 'fans'],
  authors: [{ name: 'Fannax' }],
  openGraph: {
    title: 'Fannax - Football Social Network',
    description: 'The ultimate football fans social network',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased bg-slate-900 text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
