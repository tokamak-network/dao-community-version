"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { AgendaProvider } from "@/contexts/AgendaContext";

import { chain } from "@/config/chain";

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(RPC_URL),
    [sepolia.id]: http(RPC_URL),
  },
  // defaultConfig: {
  //   chain: chain.id === sepolia.id ? sepolia : mainnet,
  // },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AgendaProvider>{children}</AgendaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
