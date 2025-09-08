# 🔍 Tokamak DAO Transaction Parser Requirements

## 📋 Overview

This document outlines the requirements for the transaction parser used in the Tokamak DAO Agenda Metadata Generator and methods for handling CORS errors.

## 🎯 Transaction Parser Purpose

- Extract metadata from agenda creation transaction hash
- Collect agenda information through event log parsing
- Extract memo URL through calldata decoding
- Network-specific transaction validation

## 🌐 RPC Configuration and CORS Error Handling

### RPC URL Configuration

```typescript
// RPC URL configuration to avoid CORS issues
const rpcUrls: Record<number, string> = {
  1: 'https://eth.llamarpc.com',                    // Mainnet - CORS supported
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com'  // Sepolia - CORS supported
}
```

### CORS Error Resolution Methods

#### 1. CORS Error Detection
```typescript
try {
  const tx = await this.provider.getTransaction(txHash)
} catch (error) {
  const errorMessage = safe.getErrorMessage(error)

  // CORS error detection
  if (errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control') ||
      errorMessage.includes('blocked by CORS policy') ||
      errorMessage.includes('ERR_FAILED')) {

    throw new Error('Network access blocked by browser security policy. Please try again or contact support.')
  }

  throw new Error(errorMessage)
}
```

#### 2. Fallback RPC System (Recommended)
```typescript
const rpcUrls: Record<number, string[]> = {
  1: ['https://eth.llamarpc.com', 'https://ethereum.publicnode.com'],
  11155111: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org']
}

private async tryNextProvider(currentIndex: number = 0): Promise<ethers.JsonRpcProvider> {
  if (currentIndex >= this.fallbackUrls.length) {
    throw new Error('All RPC endpoints failed')
  }

  const url = this.fallbackUrls[currentIndex]
  try {
    const provider = new ethers.JsonRpcProvider(url)
    console.log(`Trying RPC: ${url}`)
    return provider
  } catch (error) {
    console.warn(`Failed to connect to ${url}:`, error)
    return this.tryNextProvider(currentIndex + 1)
  }
}
```

## 🔧 Transaction Parsing Implementation

### 1. Basic Parsing Structure

```typescript
export class TransactionParser {
  private provider: ethers.JsonRpcProvider;

  constructor(chainId: number) {
    const rpcUrls: Record<number, string> = {
      1: 'https://eth.llamarpc.com',
      11155111: 'https://ethereum-sepolia-rpc.publicnode.com'
    }

    const rpcUrl = rpcUrls[chainId]
    if (!rpcUrl) {
      throw new Error(`Unsupported network: ${chainId}`)
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async parseAgendaTransaction(txHash: string, chainId: number): Promise<ParsedTransaction> {
    try {
      const tx = await this.provider.getTransaction(txHash)
      if (!tx) {
        throw new Error('Transaction not found on selected network')
      }

      const receipt = await this.provider.getTransactionReceipt(txHash)
      if (!receipt) {
        throw new Error('Transaction receipt not found')
      }

      // Find agenda creation event
      const agendaCreatedEvent = this.findAgendaCreatedEvent([...receipt.logs], contracts.committee)
      if (!agendaCreatedEvent) {
        throw new Error('This transaction does not contain an agenda creation event')
      }

      // Parse memo URL
      const memo = this.parseMemoFromCalldata(tx.data)

      return {
        id: Number(agendaCreatedEvent.id),
        creator: agendaCreatedEvent.from,
        targets: agendaCreatedEvent.targets,
        noticePeriodSeconds: Number(agendaCreatedEvent.noticePeriodSeconds),
        votingPeriodSeconds: Number(agendaCreatedEvent.votingPeriodSeconds),
        atomicExecute: agendaCreatedEvent.atomicExecute,
        calldata: this.parseCalldataFromTransaction(tx.data),
        memo,
        network: getNetworkName(chainId) as 'mainnet' | 'sepolia',
        txHash
      }
    } catch (error) {
      throw new Error(safe.getErrorMessage(error))
    }
  }
}
```

### 2. Event Log Parsing

#### AgendaCreated Event ABI (Committee Contract)

```typescript
export const COMMITTEE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "address[]", "name": "targets", "type": "address[]" },
      { "indexed": false, "internalType": "uint128", "name": "noticePeriodSeconds", "type": "uint128" },
      { "indexed": false, "internalType": "uint128", "name": "votingPeriodSeconds", "type": "uint128" },
      { "indexed": false, "internalType": "bool", "name": "atomicExecute", "type": "bool" }
    ],
    "name": "AgendaCreated",
    "type": "event"
  }
] as const;
```

#### Event Parsing Implementation

```typescript
private findAgendaCreatedEvent(logs: any[], committeeAddress: string) {
  const eventInterface = new ethers.Interface(COMMITTEE_ABI)

  // First, find any AgendaCreated event
  for (const log of logs) {
    try {
      const parsedLog = eventInterface.parseLog({
        topics: log.topics,
        data: log.data
      })

      if (parsedLog && parsedLog.name === 'AgendaCreated') {
        // Validate that the event came from the expected Committee contract
        if (log.address.toLowerCase() !== committeeAddress.toLowerCase()) {
          console.warn(`AgendaCreated event found from ${log.address}, expected ${committeeAddress}`)
          // Continue processing but log the discrepancy
        }
        
        return {
          from: parsedLog.args.from,
          id: parsedLog.args.id,
          targets: parsedLog.args.targets,
          noticePeriodSeconds: parsedLog.args.noticePeriodSeconds,
          votingPeriodSeconds: parsedLog.args.votingPeriodSeconds,
          atomicExecute: parsedLog.args.atomicExecute,
          contractAddress: log.address // Include actual contract address
        }
      }
    } catch {
      continue
    }
  }
  return null
}
```

### 3. Calldata Parsing

```typescript
private parseMemoFromCalldata(input: string): string | undefined {
  try {
    const approveAndCallInterface = new ethers.Interface([
      'function approveAndCall(address spender, uint256 amount, bytes calldata data)'
    ])

    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: input })
    if (!decodedApproveAndCall) {
      return undefined
    }

    const { data: approveData } = decodedApproveAndCall.args
    const createAgendaData = approveData

    // Parse agenda creation function
    const createAgendaInterface = new ethers.Interface([
      'function createAgenda(address[] calldata targetAddresses, uint256 minimumNoticePeriodSeconds, uint256 minimumVotingPeriodSeconds, bool executeImmediately, bytes[] calldata callDataArray, string calldata agendaUrl)'
    ])

    const decodedCreateAgenda = createAgendaInterface.parseTransaction({ data: createAgendaData })
    if (!decodedCreateAgenda) {
      return undefined
    }

    return decodedCreateAgenda.args.agendaUrl
  } catch {
    return undefined
  }
}
```

## 📊 Error Handling and User Experience

### Error Message Classification

```typescript
const ERROR_MESSAGES = {
  INVALID_HASH: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
  NOT_FOUND: 'Transaction not found on selected network. Please check the network and hash.',
  NOT_AGENDA: 'This transaction does not contain an agenda creation event.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  CORS_ERROR: 'Network access blocked. Please try again or contact support if the issue persists.'
} as const
```

### Error Handling Logic

```typescript
try {
  const parsedTx = await parseAgendaTransaction(txHash, chainId)
  onTransactionParsed(parsedTx)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction'

  if (errorMessage.includes('not found')) {
    setValidationError(ERROR_MESSAGES.NOT_FOUND)
  } else if (errorMessage.includes('agenda creation event')) {
    setValidationError(ERROR_MESSAGES.NOT_AGENDA)
  } else if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
    setValidationError(ERROR_MESSAGES.CORS_ERROR)
  } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    setValidationError(ERROR_MESSAGES.NETWORK_ERROR)
  } else {
    setValidationError(errorMessage)
  }

  onError(errorMessage)
}
```

## 🔍 Validation and Testing

### Transaction Hash Validation

```typescript
export const validateTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}
```

### Network Support Validation

```typescript
export const isChainSupported = (chainId: number): boolean => {
  return [1, 11155111].includes(chainId)
}
```

### Test Cases

```typescript
// Valid agenda creation transaction
const validTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

// CORS error test
const corsErrorTest = async () => {
  try {
    await parser.parseAgendaTransaction(validTxHash, 11155111)
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.log('CORS error detected, implementing fallback...')
    }
  }
}
```

## ⚠️ Known Issues and Solutions

### 1. ABI Type Mismatch Issue

**Problem**: Documentation may show `uint256` for notice/voting period fields, but actual contract uses `uint128`.

**Solution**: Always verify ABI types with actual contract implementation:

```typescript
// Correct ABI (verified from actual contract)
{ "indexed": false, "internalType": "uint128", "name": "noticePeriodSeconds", "type": "uint128" },
{ "indexed": false, "internalType": "uint128", "name": "votingPeriodSeconds", "type": "uint128" },

// Incorrect (may cause parsing failures)
{ "indexed": false, "internalType": "uint256", "name": "noticePeriodSeconds", "type": "uint256" },
```

### 2. Contract Address Validation

**Problem**: Events might be emitted from proxy contracts or different addresses than expected.

**Solution**: Flexible validation approach:
1. First find any `AgendaCreated` event
2. Then validate contract address with warnings, not errors
3. Log discrepancies for debugging

### 3. Hardcoding Prevention

**Problem**: Transaction hashes, magic numbers, and ABI definitions hardcoded in components.

**Solution**: Move all constants to configuration files:

```typescript
// ❌ Bad: Hardcoded values
if (transaction.data.length > 10) {
  values = new Array(targets.length).fill('0');
}

// ✅ Good: Configurable values
if (transaction.data.length > SIZE_LIMITS.MIN_TRANSACTION_DATA_LENGTH) {
  values = new Array(targets.length).fill(DEFAULT_VALUES.ETH_AMOUNT);
}
```

## 🔧 Example Transaction Testing

### Sepolia Test Transaction
- **Hash**: `0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b`
- **Committee Contract**: `0xa2101482b28e3d99ff6ced517ba41eff4971a386`
- **Agenda ID**: 197
- **Status**: Should parse successfully with correct ABI

## 📝 Implementation Checklist

- [ ] Use CORS-supported RPC URLs
- [ ] Implement fallback RPC system
- [ ] Error message classification and handling
- [ ] Transaction hash validation
- [ ] ✅ Event log parsing with correct ABI types
- [ ] Calldata decoding
- [ ] User-friendly error messages
- [ ] Network-specific validation
- [ ] ✅ Remove all hardcoding
- [ ] ✅ Flexible contract address validation
- [ ] Write test cases

---

This document provides guidelines for stable implementation of the transaction parser and CORS error resolution. **Updated with real-world implementation fixes and known issues.**