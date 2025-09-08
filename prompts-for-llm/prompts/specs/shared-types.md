# 📚 Shared Types and Interfaces

## Overview
This document contains all shared TypeScript types and interfaces used across the Tokamak DAO Agenda system. Other documents should reference these definitions instead of duplicating them.

## Core Interfaces

### AgendaMetadata
```typescript
interface AgendaMetadata {
  id: number;                    // Agenda ID
  title: string;                 // Agenda title
  description: string;           // Agenda description
  network: "mainnet" | "sepolia"; // Network
  transaction: string;           // Transaction hash
  creator: {
    address: string;             // Creator address
    signature: string;           // Creator signature
  };
  actions: Action[];             // Execution actions array
  createdAt: string;            // Creation time (ISO 8601)
  updatedAt?: string;           // Update time (only on updates)
  snapshotUrl?: string;         // Snapshot URL (optional)
  discourseUrl?: string;        // Discourse URL (optional)
}
```

### Action
```typescript
interface Action {
  title: string;           // ⚠️ REQUIRED: Must not be empty (e.g., "Action 1", "Transfer TON")
  contractAddress: string; // Target contract address
  method: string;          // Function signature (e.g., "transfer(address,uint256)")
  calldata: string;        // Encoded calldata
  abi: AbiItem[];          // ⚠️ CRITICAL: Must use proper ABI structure
  sendEth?: boolean;       // Whether to send ETH with the call
  id?: string;             // Optional action ID
  type?: string;           // Optional action type
}
```

### ABI Structure
```typescript
// ⚠️ CRITICAL: Correct ABI structure required for validation
interface AbiItem {
  name: string;
  type: 'function';
  inputs: AbiInput[];
  outputs: any[];
  stateMutability: 'nonpayable' | 'view' | 'pure' | 'payable';
}

interface AbiInput {
  name: string;
  type: string;
  internalType: string;    // ⚠️ REQUIRED: Must match type field
}
```

### Signature Data
```typescript
interface SignatureData {
  message: string;
  signature: string;
  timestamp: string;
}
```

### Transaction Data
```typescript
interface ParsedTransaction {
  network: 'mainnet' | 'sepolia';
  txHash: string;
  blockNumber: number;
  from: string;           // Creator address
  to: string;            // DAO contract address
  agendaId: number;
  targets: string[];     // Array of target contract addresses
  values: string[];      // Array of ETH values
  calldatas: string[];   // Array of encoded calldatas
  description: string;
}
```

### GitHub Configuration
```typescript
interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  message: string;
}
```

### Validation Result
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface CallDataValidationResult {
  isValid: boolean;
  generated: string;
  original: string;
  error?: string;
}
```

### Function Parameter
```typescript
interface FunctionParameter {
  name: string;
  type: string;
  value: string;
}
```

## Network Types

```typescript
type NetworkType = 'mainnet' | 'sepolia';

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  daoContract: string;
  blockExplorer: string;
}
```

## Component Props Interfaces

```typescript
interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface TransactionInputProps {
  onTransactionParsed: (transaction: ParsedTransaction) => void;
  onError: (error: string) => void;
  initialNetwork?: NetworkType;
}

interface MetadataInputProps {
  parsedTransaction: ParsedTransaction;
  onMetadataComplete: (metadata: AgendaMetadata) => void;
  onError: (error: string) => void;
}

interface SignatureStepProps {
  metadata: AgendaMetadata;
  onSignatureComplete: (signature: string) => void;
  onError: (error: string) => void;
}

interface ValidationStepProps {
  metadata: AgendaMetadata;
  onValidationComplete: () => void;
  onError: (error: string) => void;
}

interface GitHubSetupProps {
  onSetupComplete: (config: GitHubConfig) => void;
  onError: (error: string) => void;
}

interface PRCreationProps {
  metadata: AgendaMetadata;
  githubConfig: GitHubConfig;
  onPRCreated: (url: string) => void;
  onError: (error: string) => void;
}
```

## Usage

To use these types in your implementation:

```typescript
import type { 
  AgendaMetadata, 
  Action, 
  ParsedTransaction,
  ValidationResult 
} from '@/types/shared';
```

## Important Notes

1. **Action Title**: Must never be empty. Default to "Action 1", "Action 2", etc.
2. **ABI InternalType**: Must always match the type field value
3. **Timestamp Format**: Always use ISO 8601 format (e.g., "2024-01-01T00:00:00.000Z")
4. **Address Format**: Always lowercase for comparison
5. **Transaction Hash**: Must be 66 characters (0x + 64 hex characters)