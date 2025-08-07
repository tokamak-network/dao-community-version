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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('🔧 RootLayout: Inline script executed!');
          `
        }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <Header/>
          <main>
            {children}
          </main>
          <StatusMessage />
          {/* 개발 모드에서만 멀티워커 상태 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <RPCWorkerStatus showDetails={true} />
          )}
        </Providers>
      </body>
    </html>
  )
}