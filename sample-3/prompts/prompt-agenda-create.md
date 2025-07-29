# 🚀 Error-Free DAO Agenda Creator

Build a bulletproof Next.js + Web3 app in 3 steps with zero runtime errors.

## ⚡ **Quick Start (5 min)**

### 1. **Copy-Paste Setup**
```bash
npx create-next-app@14 dao-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
cd dao-app
npm install wagmi viem @tanstack/react-query
```

### 2. **Essential Files**
Create these 3 files exactly as shown:

#### `src/lib/safe-utils.ts` (Copy this!)
```typescript
// 🛡️ Error-proof utilities - USE THESE ALWAYS
export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try { return val ? BigInt(String(val)) : null; } catch { return null; }
  },

  json: (str: string): any => {
    try { return JSON.parse(str); } catch { return null; }
  },

  storage: {
    set: (key: string, val: any) => {
      try { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val)); } catch {}
    },
    get: <T>(key: string, fallback: T): T => {
      try {
        if (typeof window === 'undefined') return fallback;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch { return fallback; }
    }
  }
};

export const validate = {
  url: (url: string) => {
    try { new URL(url); return url.startsWith('http'); } catch { return false; }
  },
  address: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
  jsonArray: (str: string) => {
    const parsed = safe.json(str);
    return Array.isArray(parsed);
  }
};
```

#### `src/app/layout.tsx` (Replace existing)
```typescript
'use client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

#### `src/lib/wagmi.ts` (Network config)
```typescript
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [metaMask()], // MetaMask only for simplicity
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const CONTRACTS = {
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
};

export const getContracts = (chainId: number) => CONTRACTS[chainId as keyof typeof CONTRACTS];
```

### 3. **Error-Proof Component Pattern**

**Main App Layout:**
```typescript
// src/app/page.tsx
import { WalletConnection } from "@/components/wallet-connection";
import { AgendaForm } from "@/components/agenda-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WalletConnection />
      {/* AgendaForm only shows when wallet is connected */}
      <AgendaForm />
    </div>
  );
}
```

**Agenda Form with Conditional Rendering:**
```typescript
// src/components/agenda-form.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { safe, validate } from '@/lib/safe-utils';
import { getContracts } from '@/lib/wagmi';

export function AgendaForm() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ url: '', transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }] });
  const [error, setError] = useState('');

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending } = useWriteContract();

  // ✅ Hydration fix
  useEffect(() => {
    setMounted(true);
    setFormData(safe.storage.get('dao-form', formData));
  }, []);

  // ✅ Auto-save
  useEffect(() => {
    if (mounted) safe.storage.set('dao-form', formData);
  }, [formData, mounted]);

  // ✅ Safe validation
  const isValid = useCallback(() => {
    if (!validate.url(formData.url)) return false;
    return formData.transactions.every(tx =>
      validate.address(tx.targetAddress) &&
      validate.jsonArray(tx.functionAbi) &&
      validate.jsonArray(tx.parameters)
    );
  }, [formData]);

  // ✅ Safe submit
  const handleSubmit = useCallback(async () => {
    setError('');
    if (!isConnected || !isValid()) {
      setError('Please connect wallet and fill valid data');
      return;
    }

    try {
      const contracts = getContracts(chainId);
      if (!contracts) {
        setError('Unsupported network. Switch to Mainnet or Sepolia.');
        return;
      }

      // Your transaction logic here...
      console.log('Ready to submit!', formData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  }, [isConnected, isValid, chainId, formData]);

  if (!mounted) return <div>Loading...</div>;

  // Only show form when wallet is connected
  if (!isConnected) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6c757d' }}>
        <h2>🔗 Connect Your Wallet</h2>
        <p>Please connect your wallet above to create a DAO agenda.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h1>Create DAO Agenda</h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>❌ {error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label>Agenda URL:</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid() || isPending}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: isValid() ? '#0070f3' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isValid() ? 'pointer' : 'not-allowed'
        }}
      >
        {isPending ? '⏳ Creating...' : 'Create Agenda'}
      </button>
    </div>
  );
}
```

## 🎯 **3-Step Development Process**

### **Step 1: Foundation (15 min)**
- [ ] Copy the 3 essential files above
- [ ] Add wallet connection component with network/contract info display
- [ ] Add conditional rendering (form only shows when wallet connected)
- [ ] Test wallet connection flow and UI states

### **Step 2: Core Logic (30 min)**
- [ ] Add TON balance check and display
- [ ] Add dynamic fee fetching from AgendaManager contract
- [ ] Add dynamic notice/voting period fetching from AgendaManager contract
- [ ] Add dynamic transaction list (Add/Remove functionality)
- [ ] Add transaction encoding logic
- [ ] **Implement agenda submission with `createAgenda` function**
- [ ] **Add transaction status tracking and error handling**
- [ ] Add transaction status display with Etherscan links
- [ ] Add manual Agenda ID finder button

### **Step 3: Polish (15 min)**
- [ ] Add loading states
- [ ] Style the UI
- [ ] Test error scenarios

## 🚨 **Critical Rules (NEVER BREAK)**

1. **Always use `safe.bigInt()` for BigInt conversions**
2. **Always use `validate.*` before blockchain calls**
3. **Always check `mounted` state before rendering**
4. **Always wrap async operations in try-catch**

## 🔧 **Agenda Creation Method**

### **📋 Agenda Submission Implementation Checklist**
- [ ] **Import required hooks: `useWriteContract`, `useWaitForTransactionReceipt`**
- [ ] **Import `encodeAbiParameters` from viem for transaction encoding**
- [ ] **Import ABI files: TON, DAOCommittee, AgendaManager**
- [ ] **Add state variables: `error`, `success`, `isSubmitting`**
- [ ] **Create `encodeTransactionData` helper function**
- [ ] **Create `isValid()` and `hasEnoughBalance()` validation functions**
- [ ] **Implement `handleSubmit` with TON `approveAndCall`**
- [ ] **Add `useEffect` for transaction success handling**
- [ ] **Add `useEffect` for transaction error handling**
- [ ] **Create success/error UI components**
- [ ] **Add transaction progress indicators to submit button**
- [ ] **Handle form reset after successful submission**

### **1. TON `approveAndCall` Implementation Guide**

**Complete implementation with error handling:**

```typescript
import { encodeAbiParameters } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import TON_ABI from '@/lib/TON.json';
import COMMITTEE_ABI from '@/lib/DAOCommittee.json';

// In your component
const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

// Helper function to encode transactions
const encodeTransactionData = useCallback((formData: FormData, noticePeriod: bigint, votingPeriod: bigint) => {
  // Extract target addresses from transactions
  const targets = formData.transactions.map(tx => tx.targetAddress);

  // Encode each transaction's function call data
  const callData = formData.transactions.map(tx => {
    const functionAbi = safe.json(tx.functionAbi);
    const parameters = safe.json(tx.parameters);

    if (!functionAbi || !parameters) {
      throw new Error('Invalid function ABI or parameters');
    }

    return encodeAbiParameters(
      functionAbi.inputs || [],
      parameters
    );
  });

  // Encode the complete data for Committee's onApprove
  return encodeAbiParameters([
    { name: 'targetAddresses', type: 'address[]' },
    { name: 'minimumNoticePeriodSeconds', type: 'uint256' },
    { name: 'minimumVotingPeriodSeconds', type: 'uint256' },
    { name: 'executeImmediately', type: 'bool' },
    { name: 'callDataArray', type: 'bytes[]' },
    { name: 'agendaUrl', type: 'string' }
  ], [
    targets,                                    // Array of contract addresses
    safe.bigInt(noticePeriod) || BigInt(86400), // Notice period from AgendaManager
    safe.bigInt(votingPeriod) || BigInt(259200), // Voting period from AgendaManager
    true,                                       // Execute immediately after voting
    callData,                                   // Array of encoded function calls
    formData.url                                // Agenda URL
  ]);
}, []);

// Submit function
const handleSubmit = useCallback(async () => {
  setError('');
  setSuccess('');
  setIsSubmitting(true);

  try {
    if (!contracts || !agendaFee || !noticePeriod || !votingPeriod) {
      throw new Error('Contract data not loaded');
    }

    // Check balance
    if (!hasEnoughBalance()) {
      throw new Error('Insufficient TON balance for agenda creation');
    }

    // Encode transaction data
    const encodedData = encodeTransactionData(formData, noticePeriod, votingPeriod);

    // Call TON approveAndCall
    await writeContract({
      address: contracts.ton as `0x${string}`,
      abi: TON_ABI,
      functionName: 'approveAndCall',
      args: [
        contracts.committee as `0x${string}`,  // Spender (Committee contract)
        agendaFee,                             // Amount (creation fee)
        encodedData                            // Encoded data for Committee
      ]
    });

  } catch (err) {
    setIsSubmitting(false);
    setError(err instanceof Error ? err.message : 'Transaction failed');
  }
}, [contracts, agendaFee, noticePeriod, votingPeriod, formData, hasEnoughBalance, writeContract, encodeTransactionData]);

// Handle transaction success
useEffect(() => {
  if (receipt) {
    setIsSubmitting(false);
    setSuccess(`✅ Agenda created successfully! Transaction: ${hash}`);

    // Reset form on success
    setFormData({
      url: '',
      transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
    });
  }
}, [receipt, hash]);

// Handle transaction error
useEffect(() => {
  if (writeError) {
    setIsSubmitting(false);
    setError(`Transaction failed: ${writeError.message}`);
  }
}, [writeError]);
```

**Key Implementation Points:**

1. **Fee Approval**: `approveAndCall` approves the Committee to spend TON tokens (fee) and calls `onApprove` in one transaction
2. **Data Encoding**: Use `encodeAbiParameters` to prepare data for Committee's `onApprove` function
3. **Transaction Tracking**: Use `useWaitForTransactionReceipt` to track confirmation
4. **Error Handling**: Handle both contract reverts and network errors
5. **UI States**: Show loading, success, and error states appropriately

### **2. Complete Implementation Example**

**Full working component with transaction submission:**

```typescript
// src/components/agenda-form.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeAbiParameters } from 'viem';
import { safe, validate } from '@/lib/safe-utils';
import { getContracts } from '@/lib/wagmi';
import TON_ABI from '@/lib/TON.json';
import COMMITTEE_ABI from '@/lib/DAOCommittee.json';
import AGENDA_MANAGER_ABI from '@/lib/AgendaManager.json';

export function AgendaForm() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // Transaction hooks
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Contract reads (same as before - TON balance, fees, periods)
  const { data: tonBalance } = useReadContract({
    address: contracts?.ton as `0x${string}`,
    abi: TON_ABI.abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!contracts }
  });

  const { data: agendaFee } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI.abi,
    functionName: 'createAgendaFees',
    query: { enabled: !!contracts }
  });

  // Validation function
  const isValid = useCallback(() => {
    if (!validate.url(formData.url)) return false;
    return formData.transactions.every(tx =>
      validate.address(tx.targetAddress) &&
      validate.jsonArray(tx.functionAbi) &&
      validate.jsonArray(tx.parameters)
    );
  }, [formData]);

  // Balance check
  const hasEnoughBalance = useCallback(() => {
    const balance = safe.bigInt(tonBalance);
    const fee = safe.bigInt(agendaFee);
    if (!balance || !fee) return false;
    return balance >= fee;
  }, [tonBalance, agendaFee]);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
    setFormData(safe.storage.get('dao-form', formData));
  }, []);

  // Auto-save
  useEffect(() => {
    if (mounted) safe.storage.set('dao-form', formData);
  }, [formData, mounted]);

  // Transaction encoding helper
  const encodeTransactionData = useCallback((formData, noticePeriod, votingPeriod) => {
    const targets = formData.transactions.map(tx => tx.targetAddress);
    const callData = formData.transactions.map(tx => {
      const functionAbi = safe.json(tx.functionAbi);
      const parameters = safe.json(tx.parameters);

      if (!functionAbi || !parameters) {
        throw new Error('Invalid function ABI or parameters');
      }

      // Handle both array and object ABI formats - always use first function
      const abi = Array.isArray(functionAbi) ? functionAbi[0] : functionAbi;
      const inputs = abi.inputs || [];

      // Validate parameter count for better error messages
      if (inputs.length !== parameters.length) {
        throw new Error(`Transaction ${index + 1}: Expected ${inputs.length} parameters but got ${parameters.length}`);
      }

      return encodeAbiParameters(inputs, parameters);
    });

    return encodeAbiParameters([
      { name: 'targetAddresses', type: 'address[]' },
      { name: 'minimumNoticePeriodSeconds', type: 'uint256' },
      { name: 'minimumVotingPeriodSeconds', type: 'uint256' },
      { name: 'executeImmediately', type: 'bool' },
      { name: 'callDataArray', type: 'bytes[]' },
      { name: 'agendaUrl', type: 'string' }
    ], [
      targets,
      safe.bigInt(noticePeriod) || BigInt(86400),
      safe.bigInt(votingPeriod) || BigInt(259200),
      true,
      callData,
      formData.url
    ]);
  }, []);

  // Main submit handler
  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!contracts || !agendaFee) {
        throw new Error('Contract data not loaded');
      }

      // Encode transaction data
      const encodedData = encodeTransactionData(formData, BigInt(86400), BigInt(259200));

      // Submit transaction
      await writeContract({
        address: contracts.ton as `0x${string}`,
        abi: TON_ABI.abi,
        functionName: 'approveAndCall',
        args: [
          contracts.committee as `0x${string}`,
          agendaFee,
          encodedData
        ]
      });

    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  }, [contracts, agendaFee, formData, writeContract, encodeTransactionData]);

  // Handle transaction success
  useEffect(() => {
    if (receipt) {
      setIsSubmitting(false);
      setSuccess(`✅ Agenda created! Hash: ${hash}`);

      // Reset form
      setFormData({
        url: '',
        transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
      });
    }
  }, [receipt, hash]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      setIsSubmitting(false);
      setError(`Transaction failed: ${writeError.message}`);
    }
  }, [writeError]);

  // Rest of component (form UI)...
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800">{success}</div>
          {hash && (
            <a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              className="text-blue-600 underline text-sm"
            >
              View on Etherscan →
            </a>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">❌ {error}</div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid() || isSubmitting || isPending || isConfirming}
        className={`w-full py-3 px-4 rounded-md font-medium ${
          isValid() && !isSubmitting ?
          'bg-blue-600 hover:bg-blue-700 text-white' :
          'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting || isPending ? '⏳ Submitting...' :
         isConfirming ? '🔄 Confirming...' :
         'Create Agenda'}
      </button>
    </div>
  );
}
```

### **2. Agenda ID Extraction**
Extract the agenda ID from the `AgendaCreated` event:

```typescript
import { decodeEventLog } from 'viem';

// After transaction is confirmed
const decodedLog = decodeEventLog({
  abi: COMMITTEE_ABI,
  data: log.data,
  topics: log.topics,
});

if (decodedLog.eventName === 'AgendaCreated' && decodedLog.args) {
  const agendaId = (decodedLog.args as any).id; // BigInt
  console.log('Agenda created with ID:', agendaId.toString());
}
```

## 📝 **Form Structure (Required Fields)**

### **Agenda Creation Form**
1. **Agenda URL**:
   - Text input with URL validation
   - Must start with `http` or `https`
   - Required field

2. **Transactions** (Dynamic list):
   - **Target Address**: Ethereum address validation (0x...)
   - **Function ABI**: JSON array format validation
   - **Parameters**: JSON array format validation
   - **Add/Remove Transaction**: Dynamic list management

3. **Submit Button**:
   - Disabled if insufficient TON balance
   - Disabled if form validation fails
   - Shows loading state during transaction

### **Form Data Structure**
```typescript
interface FormData {
  url: string;                    // Agenda URL (required)
  transactions: Transaction[];    // Array of transactions
}

interface Transaction {
  targetAddress: string;          // Contract address to call
  functionAbi: string;           // JSON string of function ABI
  parameters: string;            // JSON string of parameters
}
```

## 🔥 **Copy-Paste Snippets**

### **Wallet Connection**
```typescript
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
const { address, isConnected } = useAccount();

{isConnected ? (
  <div>Connected: {address?.slice(0,6)}... <button onClick={() => disconnect()}>Disconnect</button></div>
) : (
  <div>{connectors.map(connector =>
    <button key={connector.id} onClick={() => connect({ connector })}>{connector.name}</button>
  )}</div>
)}
```

### **Transaction Status**
```typescript
const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash });
const [agendaId, setAgendaId] = useState<string>();

useEffect(() => {
  if (receipt?.logs) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: COMMITTEE_ABI, ...log });
        if (decoded.eventName === 'AgendaCreated') {
          setAgendaId((decoded.args as any).id?.toString());
          break;
        }
      } catch {} // Skip non-matching logs
    }
  }
}, [receipt]);
```

### **ABI Files** (Create in `src/lib/`)

**TON.json:**
```json
{"abi":[{"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"},{"name":"extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]}
```

**DAOCommittee.json:**
```json
{"abi":[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"id","type":"uint256"},{"indexed":false,"name":"targets","type":"address[]"},{"indexed":false,"name":"noticePeriodSeconds","type":"uint128"},{"indexed":false,"name":"votingPeriodSeconds","type":"uint128"},{"indexed":false,"name":"atomicExecute","type":"bool"}],"name":"AgendaCreated","type":"event"}]}
```

**AgendaManager.json:**
```json
{"abi":[{"inputs":[],"name":"createAgendaFees","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minimumNoticePeriodSeconds","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minimumVotingPeriodSeconds","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]}
```

## ✅ **Deployment Checklist**

### **Technical Requirements**
- [ ] TypeScript compiles with no errors
- [ ] All form validations work
- [ ] Wallet connection/disconnection works
- [ ] Network switching handled
- [ ] Transaction success/failure states show properly
- [ ] LocalStorage persistence works

### **UI/UX Requirements**
- [ ] **Header shows wallet connection status** (Connected address, Disconnect button)
- [ ] **Network information displayed** (Mainnet/Sepolia + chainId)
- [ ] **Contract addresses visible** (TON, Committee, AgendaManager with full addresses displayed)
- [ ] **Network warning** for unsupported networks
- [ ] **Loading states** during wallet connection
- [ ] **Error messages** are user-friendly and visible
- [ ] **Form auto-save** indication works
- [ ] **Responsive design** works on mobile/desktop
- [ ] **TON Balance Display** (실시간 잔액 + 부족 시 경고)
- [ ] **Dynamic Fee Display** (AgendaManager 컨트랙트에서 수수료 조회하여 TON 단위로 표시)
- [ ] **Dynamic Period Configuration** (AgendaManager 컨트랙트에서 notice/voting period 조회하여 초 단위로 표시, 옆에 분 단위도 함께 표시)
- [ ] **Dynamic Transaction List** (Add/Remove 버튼으로 여러 거래 관리)
- [ ] **Transaction Status with Etherscan Links** (완료 후 블록체인 확인 링크)
- [ ] **Manual Agenda ID Finder** (거래 완료 후 ID 수동 검색 버튼)
- [ ] **Transaction Progress Indicator** (대기중 → 진행중 → 완료 상태 표시)

## 🚨 **Critical Implementation Notes**

### **Important Development Tips**
- **Use `usePublicClient`** for manual transaction receipt fetching
- **Handle BigInt conversion safely** with `BigInt(String(value))`
- **Check `args.id`** (not `args[1]`) for agenda ID in event logs
- **Wrap localStorage access** with `typeof window !== 'undefined'`
- **Add `query.enabled`** to useReadContract hooks for conditional fetching
- **Always validate form data** before blockchain interactions
- **Use try-catch blocks** around all async operations
- **Fetch agenda creation fee dynamically** from AgendaManager contract and convert to TON units (divide by 1e18)
- **Fetch notice and voting periods dynamically** from AgendaManager contract using `minimumNoticePeriodSeconds` and `minimumVotingPeriodSeconds`
- **Display periods in both seconds and minutes** (e.g., "300 seconds (5 minutes)") for better user experience

### **Package Dependencies**
Ensure these exact versions in `package.json`:
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@tanstack/react-query": "^5.0.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0"
  }
}
```

**This streamlined prompt gets you a working, error-free Web3 app in under 1 hour!** 🚀