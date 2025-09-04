# 🚀 Production-Ready DAO Agenda Creator

Build a bulletproof Next.js 15 + Web3 app with comprehensive error handling, gas optimization, and perfect UX.

## ⚡ **Quick Start (5 min)**

### 1. **Copy-Paste Setup**
```bash
npx create-next-app@15 dao-agenda-creator --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbo --skip-install
cd dao-agenda-creator
npm install wagmi@^2.16.0 viem@^2.33.0 @tanstack/react-query@^5.83.0
```

## ⚠️ **CRITICAL: RPC Configuration (MANDATORY)**
```typescript
// lib/wagmi.ts - Use MetaMask's built-in RPC to avoid rate limits
export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(), // No URL = uses MetaMask RPC
    [sepolia.id]: http(), // No URL = uses MetaMask RPC
  },
})
```

**Performance Requirements:**
- ❌ NEVER use `refetchInterval` in useReadContract
- ✅ Use manual refetch() only after user actions
- ❌ Avoid automatic polling to prevent RPC rate limits

**UI Requirements (MANDATORY):**
- 🔄 Add manual refresh button for user-controlled updates
- ⏱️ Show loading states during refresh operations
- 📱 Ensure responsive design for all screen sizes

### 2. **Essential Files**
Create these files exactly as shown:

#### `next.config.ts` (Webpack Fix)
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  reactStrictMode: true,
}

export default nextConfig
```

#### `src/lib/types.ts` (TypeScript Definitions)
```typescript
// 🎯 Complete type definitions for type safety
export interface FormData {
  url: string
  transactions: Transaction[]
}

export interface Transaction {
  targetAddress: string
  functionAbi: string    // JSON string of function ABI
  parameters: string     // JSON string of parameters
}

export interface ContractAddresses {
  ton: `0x${string}`
  committee: `0x${string}`
  agendaManager: `0x${string}`
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  totalCost: bigint
}

export interface AgendaCreationResult {
  hash: `0x${string}`
  agendaId: string
  success: boolean
  error?: string
}

// Network types
export type SupportedChainId = 1 | 11155111
```

#### `src/lib/safe-utils.ts` (Enhanced Error-Proof Utilities)
```typescript
// 🛡️ Enhanced error-proof utilities with better validation
export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try {
      if (val === null || val === undefined || val === '') return null
      return BigInt(String(val))
    } catch { return null }
  },

  json: (str: string): any => {
    try {
      if (!str.trim()) return null
      return JSON.parse(str)
    } catch { return null }
  },

  formatTON: (wei: bigint | null): string => {
    if (!wei) return '0'
    const eth = Number(wei) / Math.pow(10, 18)
    return eth.toFixed(6)
  },

  formatGas: (gasWei: bigint | null): string => {
    if (!gasWei) return '0'
    const gwei = Number(gasWei) / Math.pow(10, 9)
    return gwei.toFixed(2)
  },

  storage: {
    set: (key: string, val: any) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(val))
        }
      } catch {}
    },
    get: <T>(key: string, fallback: T): T => {
      try {
        if (typeof window === 'undefined') return fallback
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : fallback
      } catch { return fallback }
    },
    clear: (key: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key)
        }
      } catch {}
    }
  },

  // Enhanced error messages
  getErrorMessage: (error: unknown): string => {
    if (!error) return 'Unknown error'

    if (typeof error === 'string') return error

    if (error instanceof Error) {
      // Common Web3 errors
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient ETH for gas fees. Please add more ETH to your wallet.'
      }
      if (error.message.includes('user rejected')) {
        return 'Transaction was rejected. Please approve the transaction to continue.'
      }
      if (error.message.includes('replacement fee too low')) {
        return 'Gas fee too low. Please increase gas price and try again.'
      }
      if (error.message.includes('nonce too low')) {
        return 'Transaction nonce error. Please reset your wallet and try again.'
      }
      return error.message
    }

    return 'An unexpected error occurred'
  }
}

export const validate = {
  url: (url: string): boolean => {
    if (!url || url.length < 10) return false
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch { return false }
  },

  address: (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  },

  jsonArray: (str: string): boolean => {
    const parsed = safe.json(str)
    return Array.isArray(parsed)
  },

  functionAbi: (str: string): boolean => {
    const parsed = safe.json(str)
    if (!parsed) return false

    // Handle both single function and array formats
    const func = Array.isArray(parsed) ? parsed[0] : parsed
    return func &&
           typeof func.name === 'string' &&
           func.type === 'function' &&
           Array.isArray(func.inputs)
  },

  parameters: (str: string, expectedCount: number): boolean => {
    const parsed = safe.json(str)
    return Array.isArray(parsed) && parsed.length === expectedCount
  },

  // Comprehensive form validation
  form: (formData: any): ValidationResult => {
    const errors: string[] = []

    // URL validation
    if (!validate.url(formData.url)) {
      errors.push('Please enter a valid HTTP/HTTPS URL for the agenda')
    }

    // Transactions validation
    if (!Array.isArray(formData.transactions) || formData.transactions.length === 0) {
      errors.push('At least one transaction is required')
    }

    formData.transactions?.forEach((tx: any, index: number) => {
      const txNum = index + 1

      if (!validate.address(tx.targetAddress)) {
        errors.push(`Transaction ${txNum}: Invalid target address format`)
      }

      if (!validate.functionAbi(tx.functionAbi)) {
        errors.push(`Transaction ${txNum}: Invalid function ABI format`)
      }

      if (!validate.jsonArray(tx.parameters)) {
        errors.push(`Transaction ${txNum}: Parameters must be a valid JSON array`)
      }

      // Cross-validation: parameter count vs ABI inputs
      const abi = safe.json(tx.functionAbi)
      const params = safe.json(tx.parameters)
      if (abi && params) {
        const func = Array.isArray(abi) ? abi[0] : abi
        const expectedParams = func?.inputs?.length || 0
        if (params.length !== expectedParams) {
          errors.push(`Transaction ${txNum}: Expected ${expectedParams} parameters but got ${params.length}`)
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// User experience helpers
export const ux = {
  formatTimeRemaining: (seconds: number): string => {
    if (seconds <= 0) return 'Ready now'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) return `${hours}h ${minutes}m remaining`
    if (minutes > 0) return `${minutes}m ${secs}s remaining`
    return `${secs}s remaining`
  },

  truncateHash: (hash: string, length = 6): string => {
    if (!hash) return ''
    return `${hash.slice(0, length)}...${hash.slice(-4)}`
  },

  getNetworkName: (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 11155111: return 'Sepolia Testnet'
      default: return `Chain ${chainId}`
    }
  }
}
```

#### `src/lib/wagmi.ts` (Enhanced Network Configuration)
```typescript
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'
import { ContractAddresses, SupportedChainId } from './types'

// Simple connector configuration - MetaMask and injected wallets only
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

// Etherscan URLs
export const getEtherscanUrl = (hash: string, chainId: number, type: 'tx' | 'address' = 'tx'): string => {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
  return `${baseUrl}/${type}/${hash}`
}
```

#### `src/lib/abis.ts` (Complete ABI Definitions)
```typescript
// 🔧 Complete ABI definitions with only required functions

export const TON_ABI = [
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "extraData", "type": "bytes"}
    ],
    "name": "approveAndCall",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const COMMITTEE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": false, "name": "targets", "type": "address[]"},
      {"indexed": false, "name": "noticePeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "votingPeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "atomicExecute", "type": "bool"}
    ],
    "name": "AgendaCreated",
    "type": "event"
  }
] as const

export const AGENDA_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "createAgendaFees",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minimumNoticePeriodSeconds",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minimumVotingPeriodSeconds",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const
```

### 3. **Enhanced Component Pattern**

#### `src/app/layout.tsx` (Client Provider Setup)
```typescript
'use client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Tokamak DAO Agenda Creator</title>
        <meta name="description" content="Create DAO agendas with advanced transaction management" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <div className="container mx-auto px-4 py-6">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🚀 Tokamak DAO Agenda Creator
                </h1>
                <p className="text-gray-600">
                  Create comprehensive DAO proposals with multi-transaction support
                </p>
              </header>
              {children}
            </div>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

#### `src/components/WalletConnection.tsx` (Enhanced Wallet Management)
```typescript
'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { getContracts, isChainSupported } from '@/lib/wagmi'
import { ux } from '@/lib/safe-utils'

export function WalletConnection() {
  const [mounted, setMounted] = useState(false)
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const contracts = getContracts(chainId)
  const isSupported = isChainSupported(chainId)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNetworkSwitch = async (targetChainId: number) => {
    setIsNetworkSwitching(true)
    try {
      await switchChain({ chainId: targetChainId })
    } catch (error) {
      console.error('Network switch failed:', error)
    } finally {
      setIsNetworkSwitching(false)
    }
  }

  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Wallet & Network</h2>
        {!isSupported && (
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
            ⚠️ Unsupported Network
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* Wallet Info */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
            <div>
              <p className="text-sm text-gray-600">Connected Address:</p>
              <p className="font-mono text-sm font-medium">{ux.truncateHash(address || '', 8)}</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Network:</p>
              <p className="text-sm font-medium">{ux.getNetworkName(chainId)}</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleNetworkSwitch(1)}
                disabled={chainId === 1 || isNetworkSwitching || isSwitching}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chainId === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                {isNetworkSwitching && chainId !== 1 ? '⏳' : 'Mainnet'}
              </button>
              <button
                onClick={() => handleNetworkSwitch(11155111)}
                disabled={chainId === 11155111 || isNetworkSwitching || isSwitching}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chainId === 11155111
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                {isNetworkSwitching && chainId !== 11155111 ? '⏳' : 'Sepolia'}
              </button>
            </div>
          </div>

          {/* Contract Addresses */}
          {contracts && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600 mb-2">Contract Addresses:</p>
              <div className="space-y-1 text-xs font-mono">
                <div>TON: {contracts.ton}</div>
                <div>Committee: {contracts.committee}</div>
                <div>AgendaManager: {contracts.agendaManager}</div>
              </div>
            </div>
          )}

          {/* Network Warning */}
          {!isSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ Please switch to Ethereum Mainnet or Sepolia Testnet to create agendas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Connect your wallet to create DAO agendas</p>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isConnecting ? '⏳ Connecting...' : `Connect ${connector.name}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## 🎯 **Enhanced Development Process**

### **Step 1: Foundation (20 min)**
- [ ] Copy all enhanced files above
- [ ] Test wallet connection with both networks
- [ ] Test network switching functionality
- [ ] Verify contract address display
- [ ] Test error states and loading indicators

### **Step 2: Core Logic (45 min)**
- [ ] Add enhanced form validation with detailed error messages
- [ ] Add gas estimation before transaction
- [ ] Add TON balance check with formatted display
- [ ] Add dynamic fee/period fetching with user-friendly formatting
- [ ] Add transaction encoding with parameter validation
- [ ] Implement enhanced agenda submission with comprehensive error handling
- [ ] Add transaction status tracking with retry mechanism
- [ ] Add agenda ID extraction from transaction logs
- [ ] Add success state with Etherscan links and agenda info

### **Step 3: Advanced Features (30 min)**
- [ ] Add form auto-save with visual indicators
- [ ] Add dynamic transaction list (Add/Remove with validation)
- [ ] Add gas optimization suggestions
- [ ] Add transaction simulation (dry-run)
- [ ] Add comprehensive error recovery flows
- [ ] Add mobile-responsive design
- [ ] Add keyboard shortcuts and accessibility

## 🚨 **Enhanced Critical Rules**

1. **Type Safety**: Always use TypeScript interfaces and proper type guards
2. **Error Handling**: Use `safe.getErrorMessage()` for user-friendly error display
3. **Gas Management**: Always estimate gas before transaction submission
4. **Network Handling**: Check `isChainSupported()` before any contract interaction
5. **Validation**: Use comprehensive `validate.form()` before submission
6. **UX**: Provide clear loading states, progress indicators, and recovery options

## ⚠️ **Critical useEffect Rules to Prevent Infinite Loops**

**NEVER include state variables in useEffect dependency arrays if you're setting those same state variables inside the effect!**

```typescript
// ❌ WRONG - Causes infinite loop
useEffect(() => {
  const saved = safe.storage.get('form-data', formData)
  setFormData(saved) // This updates formData, triggering the effect again!
}, [formData]) // formData in dependency array = infinite loop

// ✅ CORRECT - Use empty dependency array for one-time initialization
useEffect(() => {
  const saved = safe.storage.get('form-data', {
    url: '',
    transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
  })
  setFormData(saved)
}, []) // Empty array = runs once on mount

// ✅ CORRECT - Only include dependencies you DON'T modify in the effect
useEffect(() => {
  if (hasUserInteracted) {
    const result = validate.form(formData)
    setValidationResult(result) // Safe because validationResult not in deps
  }
}, [formData, hasUserInteracted]) // These are safe dependencies
```

**Key Rules:**
- **Initialization effects**: Use empty `[]` dependency array
- **Auto-save effects**: Include only the data you're reading, not the setter function
- **Validation effects**: Include input data, but not the validation result state
- **Always check**: If you call `setState` inside `useEffect`, ensure that state is NOT in the dependency array

## 🔧 **Enhanced Implementation Examples**

### **Complete Enhanced Agenda Form**
```typescript
// src/components/AgendaForm.tsx
'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useChainId, useWriteContract, useReadContract, useWaitForTransactionReceipt, useEstimateGas } from 'wagmi'
import { encodeAbiParameters, decodeEventLog, formatEther, encodeFunctionData } from 'viem'
import { safe, validate, ux } from '@/lib/safe-utils'
import { getContracts, isChainSupported, getEtherscanUrl } from '@/lib/wagmi'
import { TON_ABI, COMMITTEE_ABI, AGENDA_MANAGER_ABI } from '@/lib/abis'
import { FormData, ValidationResult, AgendaCreationResult, Transaction } from '@/lib/types'

export function AgendaForm() {
  // State management
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    url: '',
    transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
  })
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: false, errors: [] })
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<AgendaCreationResult | null>(null)

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const isSupported = isChainSupported(chainId)

  // Transaction hooks
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  // Contract reads
  const { data: tonBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.ton,
    abi: TON_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts }
  })

  const { data: agendaFee, isLoading: feeLoading } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'createAgendaFees',
    query: { enabled: !!contracts }
  })

  const { data: noticePeriod } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumNoticePeriodSeconds',
    query: { enabled: !!contracts }
  })

  const { data: votingPeriod } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumVotingPeriodSeconds',
    query: { enabled: !!contracts }
  })

  // Gas estimation
  const encodedData = useMemo(() => {
    if (!validationResult.isValid || !noticePeriod || !votingPeriod) return null

    try {
      return encodeTransactionData(formData, noticePeriod, votingPeriod)
    } catch {
      return null
    }
  }, [formData, validationResult.isValid, noticePeriod, votingPeriod])

  const { data: estimatedGas } = useEstimateGas({
    to: contracts?.ton,
    data: encodedData ? `0x${encodedData.slice(2)}` : undefined,
    query: { enabled: !!encodedData && !!contracts && validationResult.isValid }
  })

  // Validation - only show errors after user interaction
  useEffect(() => {
    if (hasUserInteracted) {
      const result = validate.form(formData)
      setValidationResult(result)
    }
  }, [formData, hasUserInteracted])

  // Hydration fix
  useEffect(() => {
    setMounted(true)
    const saved = safe.storage.get('agenda-form', {
      url: '',
      transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
    })
    setFormData(saved)

    // If loaded data is empty (default state), reset interaction
    if (!saved.url && saved.transactions.length === 1 &&
        !saved.transactions[0].targetAddress &&
        !saved.transactions[0].functionAbi &&
        !saved.transactions[0].parameters) {
      setHasUserInteracted(false)
      setValidationResult({ isValid: false, errors: [] })
    }
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!mounted) return

    const timeout = setTimeout(() => {
      safe.storage.set('agenda-form', formData)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [formData, mounted])

  // Transaction encoding
  const encodeTransactionData = useCallback((formData: FormData, noticePeriod: bigint, votingPeriod: bigint) => {
    const targets = formData.transactions.map(tx => tx.targetAddress as `0x${string}`)

    const callData = formData.transactions.map((tx, index) => {
      const functionAbi = safe.json(tx.functionAbi)
      const parameters = safe.json(tx.parameters)

      if (!functionAbi || !parameters) {
        throw new Error(`Transaction ${index + 1}: Invalid ABI or parameters`)
      }

      const abi = Array.isArray(functionAbi) ? functionAbi[0] : functionAbi
      const inputs = abi.inputs || []

      if (inputs.length !== parameters.length) {
        throw new Error(`Transaction ${index + 1}: Expected ${inputs.length} parameters, got ${parameters.length}`)
      }

      // 함수 시그니처를 포함한 callData 생성
      try {
        const abiFunction = abi as { name: string; inputs: unknown[] }
        return encodeFunctionData({
          abi: [abiFunction as any], // eslint-disable-line @typescript-eslint/no-explicit-any
          functionName: abiFunction.name,
          args: parameters as any // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      } catch (error) {
        throw new Error(`Transaction ${index + 1}: Failed to encode function data - ${error}`)
      }
    })

    return encodeAbiParameters([
      { name: 'targetAddresses', type: 'address[]' },
      { name: 'minimumNoticePeriodSeconds', type: 'uint256' },
      { name: 'minimumVotingPeriodSeconds', type: 'uint256' },
      { name: 'executeImmediately', type: 'bool' },
      { name: 'callDataArray', type: 'bytes[]' },
      { name: 'agendaUrl', type: 'string' }
    ], [
      targets,
      noticePeriod,
      votingPeriod,
      true,
      callData,
      formData.url
    ])
  }, [])

  // Balance validation
  const hasEnoughBalance = useMemo(() => {
    if (!tonBalance || !agendaFee) return false
    return safe.bigInt(tonBalance)! >= safe.bigInt(agendaFee)!
  }, [tonBalance, agendaFee])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Force validation on submit
    const currentValidation = validate.form(formData)
    setValidationResult(currentValidation)
    setHasUserInteracted(true)

    if (!isSupported || !contracts || !agendaFee || !currentValidation.isValid) return

    setIsSubmitting(true)
    setResult(null)

    try {
      if (!hasEnoughBalance) {
        throw new Error(`Insufficient TON balance. Need ${safe.formatTON(agendaFee)} TON but have ${safe.formatTON(tonBalance)}`)
      }

      const encodedData = encodeTransactionData(formData, noticePeriod!, votingPeriod!)

      await writeContract({
        address: contracts.ton,
        abi: TON_ABI,
        functionName: 'approveAndCall',
        args: [contracts.committee, agendaFee, encodedData]
      })

    } catch (error) {
      setIsSubmitting(false)
      setResult({
        hash: '0x0',
        agendaId: '',
        success: false,
        error: safe.getErrorMessage(error)
      })
    }
  }, [isSupported, contracts, agendaFee, validationResult.isValid, hasEnoughBalance, formData, noticePeriod, votingPeriod, writeContract, tonBalance])

  // Handle success
  useEffect(() => {
    if (receipt) {
      setIsSubmitting(false)

      // Extract agenda ID from logs
      let agendaId = ''
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: COMMITTEE_ABI,
            data: log.data,
            topics: log.topics
          })

          if (decoded.eventName === 'AgendaCreated' && decoded.args) {
            agendaId = (decoded.args as any).id.toString()
            break
          }
        } catch {}
      }

      setResult({
        hash: receipt.transactionHash,
        agendaId,
        success: true
      })

      // Clear form and refetch balance
      setFormData({
        url: '',
        transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
      })
      // Reset interaction and validation states
      setHasUserInteracted(false)
      setValidationResult({ isValid: false, errors: [] })
      safe.storage.clear('agenda-form')
      refetchBalance()
    }
  }, [receipt, refetchBalance])

  // Handle errors
  useEffect(() => {
    if (writeError) {
      setIsSubmitting(false)
      setResult({
        hash: '0x0',
        agendaId: '',
        success: false,
        error: safe.getErrorMessage(writeError)
      })
    }
  }, [writeError])

  // Add transaction
  const addTransaction = () => {
    setFormData(prev => ({
      ...prev,
      transactions: [...prev.transactions, { targetAddress: '', functionAbi: '', parameters: '' }]
    }))
  }

  // Remove transaction
  const removeTransaction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index)
    }))
  }

  // Update transaction
  const updateTransaction = (index: number, field: keyof Transaction, value: string) => {
    setHasUserInteracted(true)
    setFormData(prev => ({
      ...prev,
      transactions: prev.transactions.map((tx, i) =>
        i === index ? { ...tx, [field]: value } : tx
      )
    }))
  }

  if (!mounted) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">🔗 Wallet Connection Required</div>
        <p className="text-gray-600">Please connect your wallet above to create DAO agendas.</p>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ Unsupported Network</div>
        <p className="text-gray-600">Please switch to Ethereum Mainnet or Sepolia Testnet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance & Fee Info */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">TON Balance</p>
            <p className="text-xl font-mono">{safe.formatTON(tonBalance)} TON</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Creation Fee</p>
            <p className="text-xl font-mono">{feeLoading ? '⏳' : `${safe.formatTON(agendaFee)} TON`}</p>
          </div>
        </div>

        {!hasEnoughBalance && agendaFee && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">
              ❌ Insufficient balance. Need {safe.formatTON(agendaFee)} TON for agenda creation.
            </p>
          </div>
        )}
      </div>

      {/* Period Configuration */}
      {(noticePeriod || votingPeriod) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Agenda Periods</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {noticePeriod && (
              <div>
                <span className="text-blue-700">Notice Period:</span>
                <span className="ml-2 font-mono">{Number(noticePeriod)}s ({Math.floor(Number(noticePeriod) / 60)}m)</span>
              </div>
            )}
            {votingPeriod && (
              <div>
                <span className="text-blue-700">Voting Period:</span>
                <span className="ml-2 font-mono">{Number(votingPeriod)}s ({Math.floor(Number(votingPeriod) / 60)}m)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Messages */}
      {result && (
        <div className={`rounded-lg p-4 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success ? (
            <div>
              <div className="text-green-800 font-medium">✅ Agenda Created Successfully!</div>
              {result.agendaId && <div className="text-green-700 mt-1">Agenda ID: #{result.agendaId}</div>}
              <div className="mt-3 flex items-center justify-between">
                <a
                  href={getEtherscanUrl(result.hash, chainId, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm hover:text-blue-800"
                >
                  View Transaction on Etherscan →
                </a>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-red-800">❌ {result.error}</div>
          )}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Agenda</h2>
          <div className="text-xs text-gray-500">Auto-saved</div>
        </div>

        <div className="space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => {
                setHasUserInteracted(true)
                setFormData(prev => ({ ...prev, url: e.target.value }))
              }}
              placeholder="https://example.com/agenda-proposal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Transactions ({formData.transactions.length})
              </label>
              <button
                onClick={addTransaction}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                + Add Transaction
              </button>
            </div>

            {formData.transactions.map((transaction, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Transaction #{index + 1}</h4>
                  {formData.transactions.length > 1 && (
                    <button
                      onClick={() => removeTransaction(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Target Address</label>
                    <input
                      type="text"
                      value={transaction.targetAddress}
                      onChange={(e) => updateTransaction(index, 'targetAddress', e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Function ABI (JSON)</label>
                    <textarea
                      value={transaction.functionAbi}
                      onChange={(e) => updateTransaction(index, 'functionAbi', e.target.value)}
                      placeholder='{"name": "transfer", "type": "function", "inputs": [...]}'
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Parameters (JSON Array)</label>
                    <textarea
                      value={transaction.parameters}
                      onChange={(e) => updateTransaction(index, 'parameters', e.target.value)}
                      placeholder='["0x...", "1000000000000000000"]'
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Errors */}
          {hasUserInteracted && validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-red-800 font-medium mb-2">Please fix these errors:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gas Estimate */}
          {estimatedGas && validationResult.isValid && (
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <span className="text-gray-600">Estimated Gas: </span>
              <span className="font-mono">{estimatedGas.toString()} units</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={(!validationResult.isValid && hasUserInteracted) || !hasEnoughBalance || isSubmitting || isPending || isConfirming}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              (!hasUserInteracted || validationResult.isValid) && hasEnoughBalance && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting || isPending ? '⏳ Creating Agenda...' :
             isConfirming ? '🔄 Confirming Transaction...' :
             !hasEnoughBalance ? '💰 Insufficient TON Balance' :
             (hasUserInteracted && !validationResult.isValid) ? '❌ Please Fix Validation Errors' :
             '🚀 Create Agenda'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>• <strong>Agenda URL:</strong> Link to your proposal document (GitHub, IPFS, etc.)</p>
          <p>• <strong>Transactions:</strong> Smart contract calls to execute if agenda passes</p>
          <p>• <strong>Target Address:</strong> Contract address to call</p>
          <p>• <strong>Function ABI:</strong> JSON definition of the function to call</p>
          <p>• <strong>Parameters:</strong> Array of parameter values matching the ABI</p>
          <p>• <strong>Fee:</strong> TON tokens required to create agenda (refundable if rejected)</p>
        </div>
      </div>
    </div>
  )
}
```

## 📋 **Enhanced Deployment Checklist**

### **Technical Requirements**
- [ ] Next.js 15 compiles with no errors or warnings
- [ ] All TypeScript types are properly defined
- [ ] Comprehensive form validation works correctly
- [ ] Gas estimation displays accurately
- [ ] Network switching handles all error cases
- [ ] Transaction success/failure recovery flows work
- [ ] localStorage persistence with auto-save indication
- [ ] Mobile responsive design verified
- [ ] Accessibility features implemented

### **Web3 Integration**
- [ ] Wallet connection works with multiple providers
- [ ] Network detection and switching robust
- [ ] Contract calls handle network errors gracefully
- [ ] Transaction status tracking with retry mechanisms
- [ ] Event log parsing extracts agenda IDs correctly
- [ ] Etherscan links work for both networks
- [ ] Balance updates reflect immediately after transactions

### **User Experience**
- [ ] Loading states for all async operations
- [ ] Error messages are user-friendly and actionable
- [ ] Success flows provide clear next steps
- [ ] Form auto-save with visual feedback
- [ ] Gas estimation helps users plan transactions
- [ ] Transaction progress is clearly communicated
- [ ] Recovery options for failed transactions

### **Production Features**
- [ ] Comprehensive error boundary handling
- [ ] Performance optimized with proper caching
- [ ] SEO meta tags and descriptions
- [ ] Analytics integration ready
- [ ] Security best practices implemented
- [ ] Rate limiting considerations
- [ ] Monitoring and logging setup

**🎉 This enhanced prompt creates a production-ready DAO agenda creator that handles real-world edge cases, provides excellent user experience, and maintains perfect type safety!**