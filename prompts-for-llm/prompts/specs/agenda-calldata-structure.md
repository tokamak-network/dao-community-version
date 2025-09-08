# Agenda Transaction Calldata Structure

This document describes the calldata structure of Tokamak DAO agenda creation transactions.

## 0. Required ABI Definitions

### AgendaCreated Event ABI
```typescript
export const AGENDA_CREATED_EVENT_ABI = [
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
] as const;
```

### TON.approveAndCall Function ABI
```typescript
export const TON_APPROVE_AND_CALL_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "approveAndCall",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```


## 1. Top-Level Structure (TON.approveAndCall)

Agenda creation transactions call the TON contract's `approveAndCall(address,uint256,bytes)` function:

```
Function Selector: 0xcae9ca51
Parameters:
  - address spender    : Committee contract address (32 bytes)
  - uint256 amount     : TON amount to approve (32 bytes)
  - bytes data         : Agenda creation data (dynamic size)
```

### Calldata Structure
```
0xcae9ca51                                            // function selector (4 bytes)
000000000000000000000000{committee_address}          // committee address (32 bytes)
{approval_amount}                                     // approval amount (32 bytes)
{createAgenda_encoded_parameters}                    // createAgenda data structure (variable)
```

## 2. Agenda Creation Data Structure (committee.createAgenda)
### Legacy Version (5 parameters)
 - encode(input, (address[], uint128, uint128, bool, bytes[]))
```
  address[] targets,              // Array of contract addresses to execute
  uint256 noticePeriodSeconds,    // Notice period (seconds)
  uint256 votingPeriodSeconds,    // Voting period (seconds)
  bool atomicExecute,             // true
  bytes[] calldata                // Array of function calldata to execute
```

### New Version (6 parameters) - Memo URL Support
 - encode(input, (address[], uint128, uint128, bool, bytes[], string))
```
  address[] targets,              // Array of contract addresses to execute
  uint256 noticePeriodSeconds,    // Notice period (seconds)
  uint256 votingPeriodSeconds,    // Voting period (seconds)
  bool atomicExecute,             // true
  bytes[] calldata,               // Array of function calldata to execute
  string memo                     // Memo URL (6th parameter)
```

## 3. Memo URL Extraction Logic

```
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

      // Determine parameter structure by first array count
      const targetsOffset = parseInt(createAgendaData.slice(0, 64), 16)
      const targetsLength = parseInt(createAgendaData.slice(targetsOffset * 2, targetsOffset * 2 + 64), 16)

      // Calculate expected total byte length for 6-parameter structure
      const fixedParamsSize = 6 * 32
      const targetsArraySize = 32 + (targetsLength * 32)
      const calldataArraySize = 32 + (targetsLength * 32)
      const stringSize = 32 + 32

      const expectedTotalSize6 = fixedParamsSize + targetsArraySize + calldataArraySize + stringSize
      const expectedTotalSize5 = fixedParamsSize + targetsArraySize + calldataArraySize - 32

      // Determine parameter count by comparing with actual length
      const actualSize = createAgendaData.length / 2
      const is6Params = Math.abs(actualSize - expectedTotalSize6) < Math.abs(actualSize - expectedTotalSize5)

      // Decode based on determination result
      if (is6Params) {
        const decoded6 = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]', 'string'],
          createAgendaData
        )
        return decoded6[5] // Return the memo string (6th parameter)
      } else {
        return undefined // No memo in 5-parameter structure
      }
    } catch {
      return undefined
    }
  }
```