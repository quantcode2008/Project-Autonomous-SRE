import type { Metadata } from 'next'
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { SkipLink } from '@/components/core/SkipLink'
import { LenisProvider } from '@/lib/lenis'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SentinelAI — Autonomous Software Reliability Engineer',
  description: 'SentinelAI detects, investigates, reproduces, fixes, and prevents production bugs. Your 3 a.m. pager, resolved.',
  openGraph: {
    title: 'SentinelAI — Your 3 a.m. pager, resolved.',
    description: 'AI-powered autonomous SRE that detects, investigates, reproduces, fixes, and prevents production bugs.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="overflow-x-hidden">
        <SkipLink />
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
