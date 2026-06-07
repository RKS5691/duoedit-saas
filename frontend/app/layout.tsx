import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DuoEdit — Professional Video Editor',
  description: 'Replace any segment of your video — audio or visual — in seconds. Built for creators, studios, and teams.',
  keywords: ['video editor', 'video editing', 'flutter', 'ffmpeg', 'professional'],
  openGraph: {
    title: 'DuoEdit — Professional Video Editor',
    description: 'Studio-grade video editing on mobile.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable}`}>
      <body className="font-sans bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  )
}
