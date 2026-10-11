import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Press_Start_2P, Silkscreen } from 'next/font/google'
import { AppShell } from '@/components/layout/AppShell'
import { bootScript } from '@/config/boot-script'
import { site } from '@/config/site'
import { siteUrl } from '@/lib/site-url'
import './globals.css'

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
})
const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-silkscreen',
})
const plexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-plex-sans',
})
const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#141416' },
    { media: '(prefers-color-scheme: light)', color: '#dcdcd6' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-effects="full"
      data-sound="off"
      suppressHydrationWarning
      className={`${pressStart.variable} ${silkscreen.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
