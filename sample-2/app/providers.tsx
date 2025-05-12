"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(RPC_URL),
    [sepolia.id]: http(RPC_URL),
  },
  defaultChain: CHAIN_ID === sepolia.id ? sepolia : mainnet,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
