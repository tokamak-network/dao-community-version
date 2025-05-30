import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/navbar";
import { Providers } from "./providers";
import StatusMessage from "@/components/status-message";

export const metadata: Metadata = {
  title: "Tokamak Network Governance",
  description: "Tokamak Network Governance Interface",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            {children}
            <StatusMessage />
          </div>
        </Providers>
      </body>
    </html>
  );
}
