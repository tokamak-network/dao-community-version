"use client";
import { FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getInitials = (address: string) => {
    return address.slice(2, 4).toUpperCase();
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

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
            href="/"
            className={`flex items-center text-sm ${
              pathname === "/" ? "text-purple-600 font-medium" : "text-gray-600"
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
        </nav>

        <div className="flex items-center">
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full text-sm flex items-center gap-2 border-gray-300"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(address || "")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{formatAddress(address || "")}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => disconnect()}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
