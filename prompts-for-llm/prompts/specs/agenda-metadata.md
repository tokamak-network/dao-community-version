## 📊 DAO Agenda Metadata Repository

### Repository Configuration
> See [Shared Configuration](./shared-config.md#github-repository-configuration) for repository settings

### Type Definitions
> See [Shared Types](./shared-types.md) for all TypeScript interfaces:
> - `AgendaMetadata`
> - `Action`
> - `AbiItem`, `AbiInput`

### Validation Rules
> See [Shared Validation Rules](./shared-validation-rules.md) for all validation requirements

## ⚠️ Critical Implementation Requirements

### 1. Action Title Requirement
```typescript
// ❌ WRONG - Empty title will fail validation
const action = {
  title: '',  // This will cause validation error
  contractAddress: '0x...',
  // ...
}

// ✅ CORRECT - Always provide a non-empty title
const action = {
  title: 'Action 1',  // or 'Transfer TON', 'Update Parameter', etc.
  contractAddress: '0x...',
  // ...
}

// ✅ RECOMMENDED - Auto-generate default titles
const initialActions = targets.map((target, index) => ({
  title: `Action ${index + 1}`,  // Default title
  contractAddress: target,
  // ...
}))
```

### 2. ABI Structure Requirement
```typescript
// ❌ WRONG - Missing internalType will fail validation
const abi = [{
  name: 'transfer',
  type: 'function',
  inputs: [
    { name: 'recipient', type: 'address' },  // Missing internalType!
    { name: 'amount', type: 'uint256' }      // Missing internalType!
  ],
  outputs: [],
  stateMutability: 'nonpayable'
}]

// ✅ CORRECT - Include internalType for all inputs
const abi = [{
  name: 'transfer',
  type: 'function',
  inputs: [
    { 
      name: 'recipient', 
      type: 'address',
      internalType: 'address'  // Required field
    },
    { 
      name: 'amount', 
      type: 'uint256',
      internalType: 'uint256'  // Required field
    }
  ],
  outputs: [],
  stateMutability: 'nonpayable'
}]

// ✅ IMPLEMENTATION PATTERN
const generateAbi = (functionName: string, inputs: ParsedInput[]) => {
  return [{
    name: functionName,
    type: 'function',
    inputs: inputs.map(input => ({
      name: input.name,
      type: input.type,
      internalType: input.type  // Always set internalType to match type
    })),
    outputs: [],
    stateMutability: 'nonpayable'
  }]
}
```

### 3. Validation Checklist
> See [Shared Validation Rules](./shared-validation-rules.md#validation-checklist) for complete validation requirements

### 4. Example Valid Metadata
```json
{
  "id": 123,
  "title": "Update TON Distribution Parameters",
  "description": "This proposal updates the distribution parameters for TON tokens",
  "network": "sepolia",
  "transaction": "0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b",
  "creator": {
    "address": "0x1234567890123456789012345678901234567890",
    "signature": "0xabcdef..."
  },
  "actions": [
    {
      "title": "Transfer TON tokens",
      "contractAddress": "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
      "method": "transfer(address,uint256)",
      "calldata": "0xa9059cbb...",
      "abi": [
        {
          "name": "transfer",
          "type": "function",
          "inputs": [
            {
              "name": "recipient",
              "type": "address",
              "internalType": "address"
            },
            {
              "name": "amount",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ]
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "snapshotUrl": "https://snapshot.org/#/tokamak.eth/proposal/0x123",
  "discourseUrl": "https://forum.tokamak.network/t/proposal-123"
}
```