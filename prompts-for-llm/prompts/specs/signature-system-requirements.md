# 🔐 Tokamak DAO Agenda Metadata Signature System

## 📋 Overview

This document outlines the requirements for the signature system used in the Tokamak DAO Agenda Metadata Generator.

## 🎯 Signature System Purpose

- Verify identity of agenda metadata creator
- Ensure metadata integrity
- Time-based security (1-hour validity)
- Distinguish between new creation and update modes

## 📝 Signature Message Format

### New Agenda Creation Signature
```
I am the one who submitted agenda #<id> via transaction <tx-hash>. I am creating this metadata at <timestamp>. This signature proves that I am the one who submitted this agenda.
```

### Existing Agenda Update Signature
```
I am the one who submitted agenda #<id> via transaction <tx-hash>. I am updating this metadata at <timestamp>. This signature proves that I am the one who submitted this agenda.
```

## 📊 Metadata Schema (Signature Related)

> See [Shared Types](./shared-types.md#agendametadata) for the complete `AgendaMetadata` interface definition

## 🔧 Implementation Specification

### 1. Signature Generation System

> See [Shared Types](./shared-types.md#signature-data) for `SignatureData` interface

```typescript
// src/lib/signature.ts

export const createSignatureMessage = (
  agendaId: number,
  txHash: string,
  timestamp: string,
  isUpdate: boolean = false
): string => {
  const action = isUpdate ? "updating" : "creating";
  const proof = "submitted"; // Use "submitted" for both new and update

  return `I am the one who submitted agenda #${agendaId} via transaction ${txHash}. I am ${action} this metadata at ${timestamp}. This signature proves that I am the one who ${proof} this agenda.`;
};

export const generateSignature = async (
  signer: any,
  message: string
): Promise<string> => {
  // Generate wallet signature
};

export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  // Verify signature
};
```

## ⚠️ Important Implementation Rules

### Timestamp Consistency Rules
1. **At Signature Generation**: 
   - Generate timestamp in `new Date().toISOString()` format
   - Store the generated timestamp in `metadata.createdAt`
   - Use the same timestamp in the signature message

2. **At Signature Verification**: 
   - Must use the timestamp stored in `metadata.createdAt` as-is
   - Never generate a new timestamp or re-convert
   - Prohibited: `new Date(metadata.createdAt).toISOString()` or similar re-conversion

3. **Verification Logic Example**:
```typescript
// ✅ Correct Implementation
const timestamp = metadata.createdAt; // Use stored timestamp as-is
const message = createSignatureMessage(
  metadata.id,
  metadata.transaction,
  timestamp,
  isUpdate
);
const isValid = verifySignature(message, metadata.creator.signature, metadata.creator.address);

// ❌ Wrong Implementation
const timestamp = new Date(metadata.createdAt).toISOString(); // Re-conversion prohibited!
```

### 🚨 Critical Address Validation Rules

> See also [Shared Validation Rules](./shared-validation-rules.md#address-matching) for complete validation logic

1. **Creator Address Must Match Transaction Sender**
```typescript
// When parsing transaction
const parsedTransaction = await parseAgendaTransaction(txHash)
const creatorAddress = parsedTransaction.from  // This is the actual creator

// When creating metadata
const metadata = {
  creator: {
    address: creatorAddress,  // MUST use address from transaction
    signature: ''
  },
  // ...
}

// When signing
if (connectedAddress.toLowerCase() !== metadata.creator.address.toLowerCase()) {
  throw new Error('Connected wallet does not match agenda creator')
}
```

2. **Signature Verification Implementation**
```typescript
import { ethers } from 'ethers'

export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
  } catch {
    return false
  }
}
```

### 🚨 Common Signature Errors and Solutions

> See [Shared Validation Rules](./shared-validation-rules.md#signature-validation-rules) for complete validation logic and error handling

#### Error: "Connected wallet does not match agenda creator"
**Cause**: User is trying to sign with a different wallet than the one that created the agenda
**Solution**: 
- Extract creator address from transaction's `from` field
- Verify connected wallet matches before allowing signature
- Show clear error message with expected address

#### Error: "Signature timestamp is older than 1 hour"
**Cause**: More than 1 hour has passed since signature was created
> See [Shared Configuration](./shared-config.md#time-limits) for time limit constants

#### Error: "Invalid signature"
**Cause**: Signature verification failed
**Common Issues**:
- Wrong message format
- Timestamp mismatch between message and metadata
- Address case sensitivity

### 📋 Signature Step Checklist
- [ ] Generate timestamp using `new Date().toISOString()`
- [ ] Store exact timestamp in `metadata.createdAt`
- [ ] Use same timestamp in signature message
- [ ] Verify connected wallet matches transaction creator
- [ ] Store signature in `metadata.creator.signature`
- [ ] Validate signature can be recovered to creator address
- [ ] Ensure signature is less than 1 hour old