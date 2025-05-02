"use client"
import {
  FileEdit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, ChevronDown, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center space-x-6">
            <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
              <span className="text-white text-lg">⚡</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Tokamak Network</span>
              <span className="text-gray-500 ml-1">DAO</span>
              {/* <div className="w-6 h-6 rounded-full bg-teal-300 ml-2"></div> */}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/governance"
              className={`flex items-center text-sm ${
                pathname === "/governance"
                  ? "text-purple-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <Link
              href="/proposals"
              className={`flex items-center text-sm ${
                pathname === "/proposals"
                  ? "text-purple-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Proposals
            </Link>
            <a href="/#" className="flex items-center text-sm text-gray-600">
              <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2">
                <path
                  d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                  fill="currentColor"
                />
              </svg>
              Community
            </a>
            <a href="/#" className="flex items-center text-sm text-gray-600">
              <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2">
                <path
                  d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"
                  fill="currentColor"
                />
              </svg>
              Treasury
            </a>
            <a href="/#" className="flex items-center text-sm text-gray-600">
              <svg viewBox="0 0 24 24" width="16" height="16" className="mr-2">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor" />
              </svg>
              More
            </a>
          </nav>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full text-sm flex items-center gap-2 border-gray-300">
                <div className="h-5 w-5 rounded-full bg-red-500"></div>
                <span>0xfE0E...B202</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Disconnect</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
