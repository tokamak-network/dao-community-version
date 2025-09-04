import './globals.css'
import { Providers } from './providers'
import StatusMessage from '@/components/StatusMessage'
import RPCWorkerStatus from '@/components/RPCWorkerStatus'
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Tokamak DAO Community Platform",
  description: "A decentralized autonomous organization platform for community governance and decision making.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🌍 RootLayout: Rendering...')

  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <Header />
          <StatusMessage />
          <RPCWorkerStatus />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}