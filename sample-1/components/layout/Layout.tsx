'use client'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* <Header /> */}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}