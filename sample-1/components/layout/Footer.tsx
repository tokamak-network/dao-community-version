'use client'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Copyright ©2024 DAO Community Platform All Rights Reserved
          </p>
          <button
            className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 transition-colors"
            onClick={scrollToTop}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}