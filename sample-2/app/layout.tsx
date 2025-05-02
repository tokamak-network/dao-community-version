import type { Metadata } from "next"
import "./globals.css"

import Navbar from "@/components/navbar"
export const metadata: Metadata = {
  title: "Compound Governance",
  description: "Compound Governance Interface",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">

      <body>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}