# 🏛️ Tokamak DAO Common Requirements & Standards

## 📋 Overview
This document defines the common technical requirements, configurations, and standards that apply to all Tokamak DAO applications. These standards ensure consistency across the entire DAO ecosystem.

---

## 🎯 Tech Stack Standards

### Core Framework
- **Next.js**: Version 15.4.3 (App Router)
- **React**: Version 19.1.0
- **TypeScript**: Version 5.x
- **TailwindCSS**: Version 3.4.1

### Web3 Integration
- **wagmi**: Version 2.16.0
- **viem**: Version 2.33.0
- **@tanstack/react-query**: Version 5.83.0
- **ethers**: Version 6.9.0 (for ABI operations and calldata generation)

### Development Tools
- **ESLint**: Version 8.x
- **PostCSS**: Version 8.x
- **Autoprefixer**: Version 10.4.16

---

## 🌐 Network & Contract Configuration

### Supported Networks
```typescript
// Ethereum Mainnet (chainId: 1)
const MAINNET_CONTRACTS = {
  ton: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5' as const,
  committee: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as const,
  agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484' as const,
}

// Sepolia Testnet (chainId: 11155111)
const SEPOLIA_CONTRACTS = {
  ton: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044' as const,
  committee: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as const,
  agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as const,
}
```

### Contract Address Mapping
```typescript
const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: MAINNET_CONTRACTS,
  11155111: SEPOLIA_CONTRACTS,
}

export const getContracts = (chainId: number): ContractAddresses | null => {
  return CONTRACT_ADDRESSES[chainId] || null
}
```

---

## 📦 Required Dependencies

### package.json Template
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.83.0",
    "ethers": "^6.9.0",
    "next": "15.4.3",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "viem": "^2.33.0",
    "wagmi": "^2.16.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.16",
    "eslint": "^8",
    "eslint-config-next": "15.4.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## ⚙️ Configuration Files

### next.config.ts
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

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

### postcss.config.mjs
```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

### eslint.config.mjs
```javascript
import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
    }
  }
]

export default eslintConfig
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 🔗 Web3 Configuration

### wagmi Configuration
```typescript
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected({
      target: 'metaMask',  // MetaMask를 타겟으로 지정
      shimDisconnect: true, // 연결 해제 시 안정성 향상
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
```

**⚠️ 중요 참고사항:**
- wagmi v2.16.0 이상에서는 `metaMask` connector가 deprecated됨
- 반드시 `injected` connector 사용 필요
- connector ID가 'injected'로 표시되므로 연결 시 이를 고려해야 함

### React Query Configuration
```typescript
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## 📋 Common ABI Definitions

### AgendaManager ABI
```typescript
export const AGENDA_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "numAgendas",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_index", "type": "uint256" }],
    "name": "agendas",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "createdTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "noticeEndTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "votingPeriodInSeconds", "type": "uint256" },
        { "internalType": "uint256", "name": "votingStartedTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "votingEndTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "executableLimitTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "executedTimestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "countingYes", "type": "uint256" },
        { "internalType": "uint256", "name": "countingNo", "type": "uint256" },
        { "internalType": "uint256", "name": "countingAbstain", "type": "uint256" },
        { "internalType": "uint8", "name": "status", "type": "uint8" },
        { "internalType": "uint8", "name": "result", "type": "uint8" },
        { "internalType": "address[]", "name": "voters", "type": "address[]" },
        { "internalType": "bool", "name": "executed", "type": "bool" }
      ],
      "internalType": "struct LibAgenda.Agenda",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_agendaID", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getVoteStatus",
    "outputs": [
      { "internalType": "bool", "name": "hasVoted", "type": "bool" },
      { "internalType": "uint256", "name": "vote", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
```

### Committee ABI
```typescript
export const COMMITTEE_ABI = [
  {
    "inputs": [],
    "name": "maxMember",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "members",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "currentAgendaStatus",
    "outputs": [
      { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
      { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "agendaId", "type": "uint256" }],
    "name": "executeAgenda",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const
```

### TON ABI
```typescript
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
  }
] as const
```

---

## 🛠️ Common Utility Functions


### Safe Utilities
```typescript
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

  formatDate: (timestamp: bigint | number): string => {
    try {
      const date = new Date(Number(timestamp) * 1000)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch { return 'Invalid Date' }
  },

  formatAddress: (address: string): string => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  },

  validateAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  validateTxHash: (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash)
  },

  getErrorMessage: (error: unknown): string => {
    if (!error) return 'Unknown error'
    if (typeof error === 'string') return error
    if (error instanceof Error) {
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
```

### Status Mapping
```typescript
export const AGENDA_STATUS = {
  0: { text: 'NONE', color: 'gray', description: 'No status' },
  1: { text: 'NOTICE', color: 'blue', description: 'Notice period' },
  2: { text: 'VOTING', color: 'green', description: 'Voting in progress' },
  3: { text: 'WAITING_EXEC', color: 'orange', description: 'Waiting for execution' },
  4: { text: 'EXECUTED', color: 'purple', description: 'Executed' },
  5: { text: 'ENDED', color: 'red', description: 'Ended' }
} as const

export const AGENDA_RESULT = {
  0: { text: 'PENDING', color: 'gray', description: 'Pending result' },
  1: { text: 'ACCEPT', color: 'green', description: 'Accepted' },
  2: { text: 'REJECT', color: 'red', description: 'Rejected' },
  3: { text: 'DISMISS', color: 'yellow', description: 'Dismissed' }
} as const

export const COMMITTEE_STATUS = {
  0: { text: 'PENDING', color: 'gray' },
  1: { text: 'NOTICE PERIOD', color: 'blue' },
  2: { text: 'VOTING', color: 'green' },
  3: { text: 'WAITING FOR EXECUTION', color: 'orange' },
  4: { text: 'EXECUTED', color: 'purple' },
  5: { text: 'ENDED', color: 'red' },
  6: { text: 'NO AGENDA', color: 'gray' }
} as const

export const COMMITTEE_RESULT = {
  0: { text: 'PENDING', color: 'gray' },
  1: { text: 'APPROVED', color: 'green' },
  2: { text: 'REJECTED', color: 'red' },
  3: { text: 'DISMISS', color: 'yellow' },
  4: { text: 'NO CONSENSUS', color: 'orange' },
  5: { text: 'NO AGENDA', color: 'gray' }
} as const
```

---

## 🎨 UI/UX Standards

### Common Components
- **WalletConnection**: MetaMask 연결 상태 및 주소 표시
  - wagmi v2에서는 connector ID가 'injected'로 표시됨
  - `connectors.find(c => c.id === 'injected' || c.name === 'MetaMask')`로 찾아야 함
  - MetaMask 미설치 시 안내 메시지: "Please install MetaMask to continue"
  - 연결 거부 시: "Connection rejected by user"
  - 네트워크 불일치 시: "Please switch to Ethereum Mainnet/Sepolia"
- **NetworkSelector**: Mainnet/Sepolia 네트워크 선택
- **LoadingSpinner**: 로딩 상태 표시
- **ErrorBoundary**: 에러 처리 및 복구
- **StatusBadge**: 상태 표시 배지

### Color Scheme
```typescript
const COLORS = {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Yellow
  error: '#EF4444',      // Red
  info: '#6B7280',       // Gray
  background: '#F9FAFB', // Light gray
  surface: '#FFFFFF',    // White
} as const
```

### Typography
```typescript
const TYPOGRAPHY = {
  heading: 'text-2xl font-bold text-gray-900',
  subheading: 'text-lg font-semibold text-gray-800',
  body: 'text-base text-gray-700',
  caption: 'text-sm text-gray-500',
  code: 'font-mono text-sm',
} as const
```

---

## ⚠️ Critical Implementation Rules

### 1. BigInt Handling
```typescript
// ❌ WRONG - BigInt literals cause build errors
const agendaId = 0n
const amount = 1000000000000000000n

// ✅ CORRECT - Use BigInt constructor
const agendaId = BigInt(0)
const amount = BigInt('1000000000000000000')
```

### 2. Type Safety
```typescript
// ❌ WRONG - Using 'any' type
const data: any = result

// ✅ CORRECT - Cast through unknown
const data = result as unknown as ExpectedType
```

### 3. Performance Optimization & Infinite Loop Prevention

#### RPC Call Optimization
```typescript
// ❌ BAD: Multiple separate calls
const member1 = await readContract({...})
const member2 = await readContract({...})
const member3 = await readContract({...})

// ✅ GOOD: Parallel calls with Promise.all
const [member1, member2, member3] = await Promise.all([
  readContract({...}),
  readContract({...}),
  readContract({...})
])
```

#### React Hooks Best Practices
```typescript
// ❌ WRONG - Infinite loop caused by unstable function reference
const handleDataChange = (data: any) => {
  setData(data)
}

useEffect(() => {
  onDataChange(data)
}, [data, onDataChange]) // onDataChange is recreated every render

// ✅ CORRECT - Stable function reference with useCallback
const handleDataChange = useCallback((data: any) => {
  setData(data)
}, []) // Empty dependency array for stable reference

useEffect(() => {
  onDataChange(data)
}, [data, onDataChange]) // onDataChange is now stable
```

#### useEffect Dependency Array Rules
```typescript
// ❌ WRONG - Object/array in dependency array causes infinite loops
const config = { network: 'mainnet', address: '0x...' }
useEffect(() => {
  fetchData(config)
}, [config]) // config object is recreated every render

// ✅ CORRECT - Extract primitive values from objects
useEffect(() => {
  fetchData(config)
}, [config.network, config.address]) // Only primitive dependencies

// ✅ CORRECT - Use useMemo for expensive objects
const config = useMemo(() => ({
  network: 'mainnet',
  address: '0x...'
}), [network, address])
```

#### Conditional State Updates
```typescript
// ❌ WRONG - Unconditional setState in useEffect
useEffect(() => {
  setMetadata(prev => ({ ...prev, ...updates }))
}, [updates]) // updates object changes every render

// ✅ CORRECT - Conditional setState with proper checks
useEffect(() => {
  if (updates && Object.keys(updates).length > 0) {
    setMetadata(prev => ({ ...prev, ...updates }))
  }
}, [updates])
```

#### Validation Step Pattern (Prevents Infinite Loops)
```typescript
// ❌ WRONG - Function recreated every render, causes infinite loop
const performValidation = async () => {
  setIsValidating(true)
  // ... validation logic
  setValidationResult(result)
  if (result.isValid) {
    onValidationComplete() // This triggers parent re-render
  }
}

useEffect(() => {
  if (metadata) {
    performValidation() // Function reference changes every render
  }
}, [metadata, performValidation]) // performValidation changes every render

// ✅ CORRECT - useCallback with proper dependencies
const performValidation = useCallback(async () => {
  setIsValidating(true)

  try {
    const result = {
      isValid: true,
      errors: [],
      checks: { schema: false, signature: false, timestamp: false, integrity: false }
    }

    // Validation logic here...

    setValidationResult(result)

    if (result.isValid) {
      onValidationComplete()
    } else {
      onError(`Validation failed: ${result.errors.join(', ')}`)
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Validation error occurred')
  } finally {
    setIsValidating(false)
  }
}, [metadata, onValidationComplete, onError]) // Stable dependencies

useEffect(() => {
  if (metadata && Object.keys(metadata).length > 0) {
    performValidation()
  }
}, [performValidation]) // Only depend on the memoized function
```

#### Web3 Contract Calls Optimization
```typescript
// ❌ WRONG - Automatic polling causes RPC rate limits
const { data } = useReadContract({
  refetchInterval: 1000
})

// ✅ CORRECT - Manual refresh only
const { data, refetch } = useReadContract({
  refetchOnWindowFocus: false
})
```

### 4. Error Handling
```typescript
// ✅ CORRECT - Comprehensive error handling
try {
  const result = await contractCall()
  return result
} catch (error) {
  console.error('Contract call failed:', error)
  throw new Error(safe.getErrorMessage(error))
}
```

---

## 🌍 Internationalization Standards

### Language Requirements
**IMPORTANT: All UI text, labels, buttons, and messages must be in English.**

- **Primary Language**: English (US)
- **Date Format**: MM/DD/YYYY HH:MM:SS
- **Number Format**: Use locale-aware formatting
- **Currency**: Display in ETH/TON with appropriate decimals

### Common UI Text
```typescript
export const UI_TEXT = {
  // Wallet
  CONNECT_WALLET: 'Connect Wallet',
  DISCONNECT: 'Disconnect',
  WALLET_CONNECTED: 'Wallet Connected',
  WALLET_DISCONNECTED: 'Wallet Disconnected',

  // Network
  MAINNET: 'Ethereum Mainnet',
  SEPOLIA: 'Sepolia Testnet',
  SWITCH_NETWORK: 'Switch Network',

  // Status
  LOADING: 'Loading...',
  ERROR: 'Error',
  SUCCESS: 'Success',
  PENDING: 'Pending',

  // Actions
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  RETRY: 'Retry',

  // Navigation
  PREVIOUS: 'Previous',
  NEXT: 'Next',
  BACK: 'Back',
  FORWARD: 'Forward',
} as const
```

---

## 🧪 Testing Standards

### Required Test Coverage
- **Unit Tests**: Utility functions, hooks, components
- **Integration Tests**: Contract interactions, API calls
- **E2E Tests**: Complete user workflows
- **Performance Tests**: RPC call optimization

### Test Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```

---

## 🚀 Deployment Standards

### Build Requirements
- **Build Command**: `npm run build`
- **Output Directory**: `.next/`
- **Static Assets**: `/public/`
- **Environment Variables**: `.env.local`

### Performance Requirements
- **First Load JS**: < 200KB
- **Lighthouse Score**: > 90
- **Core Web Vitals**: Pass all metrics
- **Accessibility**: WCAG 2.1 AA compliance

### Infinite Loop Prevention Checklist
- ✅ **Function Props**: Use useCallback for all function props to ensure stable references
- ✅ **useEffect Dependencies**: Never include state variables in dependency arrays if you're setting those same state variables inside the effect
- ✅ **Object Dependencies**: Extract primitive values from objects instead of using objects directly in dependency arrays
- ✅ **Conditional Updates**: Use conditional checks before calling setState in useEffect
- ✅ **Memoization**: Use useMemo for expensive calculations and object creations
- ✅ **ESLint Rules**: Follow react-hooks/exhaustive-deps rules strictly
- ✅ **Debugging**: Monitor console for infinite re-renders during development
- ✅ **Testing**: Test useEffect logic to ensure no infinite loops occur

### Security Requirements
- **HTTPS Only**: All production deployments
- **Content Security Policy**: Implemented
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based validation

---

## 🔧 Development Guidelines

### React Best Practices
```typescript
// ✅ RECOMMENDED - Stable component structure
import { useState, useEffect, useCallback, useMemo } from 'react'

const MyComponent = ({ onDataChange, initialData }) => {
  const [data, setData] = useState(initialData)

  // Stable function reference
  const handleDataChange = useCallback((newData) => {
    setData(newData)
    onDataChange?.(newData)
  }, [onDataChange])

  // Memoized expensive calculations
  const processedData = useMemo(() => {
    return expensiveCalculation(data)
  }, [data])

  // Safe useEffect with proper dependencies
  useEffect(() => {
    if (data && data.id) {
      fetchAdditionalData(data.id)
    }
  }, [data.id]) // Only depend on the specific property

  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

### Common Anti-Patterns to Avoid
```typescript
// ❌ AVOID - Creating functions inside render
const MyComponent = ({ data }) => {
  const handleClick = () => { // Recreated every render
    console.log(data)
  }

  return <button onClick={handleClick}>Click</button>
}

// ❌ AVOID - Unstable object references
const MyComponent = ({ user }) => {
  const config = { // Recreated every render
    userId: user.id,
    network: 'mainnet'
  }

  useEffect(() => {
    fetchData(config)
  }, [config]) // Infinite loop!
}

// ❌ AVOID - Missing dependency arrays
useEffect(() => {
  fetchData() // Runs on every render
}) // Missing dependency array
```

---


## 🌐 Network Error Handling

### CORS Error Resolution
- **Problem**: Browser blocks direct RPC calls due to CORS policy
- **Solution**: Use CORS-enabled RPC endpoints or implement fallback systems
- **Common Error**: `Access to fetch at 'https://sepolia.publicnode.com/' from origin 'http://localhost:3000' has been blocked by CORS policy`

### Recommended RPC Endpoints
```typescript
// CORS-enabled RPC URLs
const RPC_URLS = {
  mainnet: {
    primary: 'https://eth.llamarpc.com',
    fallback: 'https://ethereum.publicnode.com'
  },
  sepolia: {
    primary: 'https://ethereum-sepolia-rpc.publicnode.com',
    fallback: 'https://rpc.sepolia.org'
  }
}
```

### Error Handling Implementation
```typescript
// CORS error detection and fallback
try {
  const tx = await provider.getTransaction(txHash)
} catch (error) {
  const errorMessage = error.message

  if (errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control') ||
      errorMessage.includes('ERR_FAILED')) {

    // Try fallback RPC
    const fallbackProvider = new ethers.JsonRpcProvider(fallbackUrl)
    const tx = await fallbackProvider.getTransaction(txHash)
  }
}
```

### Best Practices
- **Primary RPC**: Use CORS-enabled endpoints (e.g., `eth.llamarpc.com`)
- **Fallback RPC**: Implement automatic fallback to alternative endpoints
- **Error Messages**: Provide user-friendly CORS error messages
- **Retry Logic**: Implement exponential backoff for failed requests

---

## 🔧 Common Troubleshooting Guide

### MetaMask Connection Issues
**Problem**: "Connect Wallet" button doesn't respond
- **Check 1**: Verify MetaMask is installed
- **Check 2**: Ensure using `injected` connector, not deprecated `metaMask`
- **Check 3**: Console check: `window.ethereum` should exist
- **Solution**: Use `injected({ target: 'metaMask' })` in wagmi config

**Problem**: "No injected provider found"
- **Cause**: MetaMask not installed or disabled
- **Solution**: Direct user to https://metamask.io/download/

**Problem**: Connection rejected repeatedly
- **Check**: Previous pending requests in MetaMask
- **Solution**: Open MetaMask and reject/approve pending requests

### Network Issues
**Problem**: Wrong network after connection
- **Solution**: Implement auto-switch with `useSwitchChain` hook
- **Fallback**: Show clear message with network switch button

### Transaction Issues
**Problem**: "User rejected transaction"
- **UX Fix**: Show friendly message, not raw error
- **Retry**: Provide clear "Try Again" button

**Problem**: Gas estimation failed
- **Common Cause**: Insufficient balance or contract revert
- **Solution**: Check balance first, show specific error message


---

This document serves as the foundation for all Tokamak DAO applications, ensuring consistency, maintainability, and quality across the entire ecosystem.
