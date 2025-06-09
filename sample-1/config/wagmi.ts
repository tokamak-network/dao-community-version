import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(), // MetaMask, Brave Wallet 등 브라우저 지갑
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// 현재 사용 중인 체인 ID 확인
export const getCurrentChainId = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  return chainId ? parseInt(chainId) : mainnet.id
}

// 현재 체인이 메인넷인지 확인
export const isMainnet = () => {
  return getCurrentChainId() === mainnet.id
}

// 현재 체인이 Sepolia인지 확인
export const isSepolia = () => {
  return getCurrentChainId() === sepolia.id
}