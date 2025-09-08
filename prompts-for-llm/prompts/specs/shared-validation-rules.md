# ✅ Shared Validation Rules

## Overview
This document contains all validation rules and patterns used across the Tokamak DAO Agenda system. Reference this document instead of duplicating validation logic.

## Field Validation Rules

### 1. Required Field Validation

All metadata must contain these required fields:
- `id` > 0 (positive integer)
- `title` is non-empty string
- `description` is non-empty string
- `network` is either "mainnet" or "sepolia"
- `transaction` is valid transaction hash
- `creator.address` is valid Ethereum address
- `creator.signature` is non-empty string
- `actions` array has at least 1 element
- `createdAt` is valid ISO 8601 timestamp

### 2. Format Validation Patterns

#### Transaction Hash
```typescript
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

function isValidTxHash(hash: string): boolean {
  return TX_HASH_PATTERN.test(hash);
}
```

#### Ethereum Address
```typescript
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function isValidAddress(address: string): boolean {
  return ADDRESS_PATTERN.test(address);
}
```

#### Calldata
```typescript
const CALLDATA_PATTERN = /^0x[a-fA-F0-9]*$/;

function isValidCalldata(calldata: string): boolean {
  return CALLDATA_PATTERN.test(calldata);
}
```

#### ISO 8601 Timestamp
```typescript
function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
}
```

### 3. Action Validation Rules

For each action in the actions array:

#### Required Fields
- ✅ `action.title` is non-empty string (⚠️ CRITICAL)
- ✅ `action.contractAddress` is valid Ethereum address
- ✅ `action.method` is non-empty string
- ✅ `action.calldata` is valid hex string
- ✅ `action.abi` is valid ABI array

#### Title Validation
```typescript
// ❌ WRONG - Empty title
if (!action.title || action.title.trim() === '') {
  throw new Error('Action title cannot be empty');
}

// ✅ CORRECT - Default title generation
const defaultTitle = `Action ${index + 1}`;
```

#### ABI Validation
Each ABI item must have:
- `name`: string
- `type`: 'function'
- `inputs`: array of valid input objects
- `outputs`: array
- `stateMutability`: one of ['nonpayable', 'view', 'pure', 'payable']

Each ABI input must have:
- `name`: string
- `type`: string (valid Solidity type)
- `internalType`: string (⚠️ MUST match type field)

### 4. Signature Validation Rules

#### Signature Message Format
```typescript
// For new agenda creation
const newMessage = `I am the one who submitted agenda #${agendaId} via transaction ${txHash}. I am creating this metadata at ${timestamp}. This signature proves that I am the one who submitted this agenda.`;

// For agenda update
const updateMessage = `I am the one who submitted agenda #${agendaId} via transaction ${txHash}. I am updating this metadata at ${timestamp}. This signature proves that I am the one who submitted this agenda.`;
```

#### Timestamp Validation (1-hour validity)
```typescript
function validateSignatureTimestamp(timestamp: string): boolean {
  const createdTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  if (currentTime - createdTime > oneHour) {
    throw new Error('Signature timestamp is older than 1 hour');
  }
  return true;
}
```

#### Address Matching
```typescript
function validateCreatorAddress(
  transactionFrom: string,
  metadataCreator: string,
  connectedWallet: string
): boolean {
  // All addresses must match (case-insensitive)
  const txFrom = transactionFrom.toLowerCase();
  const creator = metadataCreator.toLowerCase();
  const wallet = connectedWallet.toLowerCase();
  
  if (txFrom !== creator) {
    throw new Error('Metadata creator must match transaction sender');
  }
  
  if (wallet !== creator) {
    throw new Error('Connected wallet must match agenda creator');
  }
  
  return true;
}
```

### 5. Parameter Type Validation

#### Solidity Type Validation
```typescript
const SOLIDITY_TYPES = {
  ADDRESS: /^address$/,
  UINT: /^uint\d*$/,
  INT: /^int\d*$/,
  BOOL: /^bool$/,
  BYTES: /^bytes\d*$/,
  STRING: /^string$/,
  ARRAY: /\[\]$/,
  TUPLE: /^\(.+\)$/
};

function validateParameterValue(type: string, value: string): ValidationResult {
  // Address validation
  if (type === 'address') {
    if (!isValidAddress(value)) {
      return { isValid: false, error: 'Invalid address format' };
    }
  }
  
  // Uint validation
  if (type.startsWith('uint')) {
    if (!/^\d+$/.test(value)) {
      return { isValid: false, error: 'Must be a positive integer' };
    }
  }
  
  // Bool validation
  if (type === 'bool') {
    if (value !== 'true' && value !== 'false') {
      return { isValid: false, error: 'Must be true or false' };
    }
  }
  
  // Bytes validation
  if (type.startsWith('bytes')) {
    if (!isValidCalldata(value)) {
      return { isValid: false, error: 'Must be hex string' };
    }
  }
  
  return { isValid: true };
}
```

### 6. Calldata Validation

#### Function Signature Parsing
```typescript
function parseFunctionSignature(signature: string): ParsedFunction | null {
  // Format: functionName(type1,type2,...)
  const match = signature.match(/^(\w+)\((.*)\)$/);
  
  if (!match) return null;
  
  const [, name, params] = match;
  const inputs = params
    .split(',')
    .filter(p => p.trim())
    .map(type => ({ type: type.trim() }));
  
  return { name, inputs };
}
```

#### Calldata Generation and Validation
```typescript
function validateCalldata(
  original: string,
  generated: string
): CallDataValidationResult {
  const normalizedOriginal = original.toLowerCase();
  const normalizedGenerated = generated.toLowerCase();
  
  if (normalizedOriginal !== normalizedGenerated) {
    return {
      isValid: false,
      generated,
      original,
      error: 'Generated calldata does not match original'
    };
  }
  
  return {
    isValid: true,
    generated,
    original
  };
}
```

## Validation Checklist

Before submitting metadata, ensure ALL validations pass:

### ✅ Metadata Level
- [ ] All required fields present
- [ ] Network is valid ("mainnet" or "sepolia")
- [ ] Transaction hash format correct
- [ ] Creator address format correct
- [ ] At least one action present
- [ ] Timestamp is ISO 8601 format

### ✅ Action Level
- [ ] Every action has non-empty title
- [ ] Contract addresses are valid
- [ ] Methods have valid signatures
- [ ] Calldata is valid hex
- [ ] ABI structure is correct
- [ ] All ABI inputs have internalType

### ✅ Signature Level
- [ ] Signature message format correct
- [ ] Timestamp less than 1 hour old
- [ ] Creator address matches transaction
- [ ] Connected wallet matches creator
- [ ] Signature can be recovered

## Error Messages

Standard error messages for validation failures:

```typescript
const ERROR_MESSAGES = {
  EMPTY_TITLE: 'Action title cannot be empty',
  INVALID_ADDRESS: 'Invalid Ethereum address format',
  INVALID_TX_HASH: 'Invalid transaction hash format',
  INVALID_CALLDATA: 'Calldata must be hex string',
  MISSING_INTERNAL_TYPE: 'ABI input missing internalType field',
  SIGNATURE_EXPIRED: 'Signature timestamp is older than 1 hour',
  ADDRESS_MISMATCH: 'Connected wallet does not match agenda creator',
  CALLDATA_MISMATCH: 'Generated calldata does not match original',
  INVALID_NETWORK: 'Network must be mainnet or sepolia',
  NO_ACTIONS: 'At least one action is required'
};
```

## Usage Example

```typescript
import { validateMetadata } from '@/lib/validation';

try {
  const result = await validateMetadata(metadata);
  if (!result.isValid) {
    console.error('Validation failed:', result.errors);
  }
} catch (error) {
  console.error('Validation error:', error.message);
}
```