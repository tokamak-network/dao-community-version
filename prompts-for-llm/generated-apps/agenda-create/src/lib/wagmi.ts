import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'
import { ContractAddresses, SupportedChainId } from './types'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask(),
    injected()
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

const CONTRACTS: Record<SupportedChainId, ContractAddresses> = {
  1: { // Mainnet
    ton: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5' as const,
    committee: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as const,
    agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484' as const,
  },
  11155111: { // Sepolia
    ton: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044' as const,
    committee: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as const,
    agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as const,
  }
}

export const getContracts = (chainId: number): ContractAddresses | null => {
  return CONTRACTS[chainId as SupportedChainId] || null
}

export const getSupportedChains = () => Object.keys(CONTRACTS).map(Number)

export const isChainSupported = (chainId: number): chainId is SupportedChainId => {
  return chainId in CONTRACTS
}

export const getEtherscanUrl = (hash: string, chainId: number, type: 'tx' | 'address' = 'tx'): string => {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
  return `${baseUrl}/${type}/${hash}`
}