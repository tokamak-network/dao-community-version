import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/Providers"
import { WalletConnection } from "@/components/WalletConnection"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Tokamak DAO - Agenda Metadata PR Generator",
  description: "Generate and submit agenda metadata for Tokamak DAO",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-gray-900">
                      Tokamak DAO Agenda Metadata
                    </h1>
                    <nav className="flex gap-4">
                      <Link
                        href="/"
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Generator
                      </Link>
                      <Link
                        href="/validate"
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Validator
                      </Link>
                    </nav>
                  </div>
                  <WalletConnection />
                </div>
              </div>
            </header>

            <main className="flex-1 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>

            <footer className="bg-white border-t border-gray-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  Tokamak DAO Agenda Metadata Generator v1.0.0
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
