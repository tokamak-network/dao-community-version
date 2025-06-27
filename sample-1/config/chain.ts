export const chain = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  name: process.env.NEXT_PUBLIC_CHAIN_NAME as string,
  network: process.env.NEXT_PUBLIC_CHAIN_NETWORK as string,
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL as string],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL as string],
    },
  },
};
