import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tokamak DAO Agenda Manager",
  description: "Manage and participate in Tokamak DAO governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}