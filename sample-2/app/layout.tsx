import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/navbar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Tokamak Network Governance",
  description: "Tokamak Network Governance Interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
