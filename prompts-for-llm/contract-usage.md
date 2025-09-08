# Tokamak DAO Smart Contract Usage Guide

This document provides comprehensive guidance on interacting with Tokamak DAO smart contracts for agenda management, voting, and execution operations.

---

## 📋 Contract Overview

### Core Contracts
- **TON Token Contract**: ERC20 token for fees and governance
- **DAOAgendaManager**: Central agenda management and storage
- **DAOCommittee**: Committee management and agenda execution
- **Candidate Contracts**: Individual committee member voting contracts

### Network Addresses

#### Ethereum Mainnet
- TON Token: `0x2be5e8c109e2197D077D13A82dAead6a9b3433C5`
- DAO Committee: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
- Agenda Manager: `0xcD4421d082752f363E1687544a09d5112cD4f484`

#### Sepolia Testnet
- TON Token: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`
- DAO Committee: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`
- Agenda Manager: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

---

## 🏗️ Core Contract Interfaces

### TON Token Contract

#### Balance and Approval Operations
```solidity
// Get user TON balance
function balanceOf(address owner) view returns (uint256)

// Get token decimals (returns 18)
function decimals() view returns (uint8)

// Approve and execute in one transaction (for agenda creation fees)
function approveAndCall(
    address spender,
    uint256 amount,
    bytes calldata extraData
) returns (bool)
```

**Usage Examples:**
- Check balance before agenda creation
- Approve TON spending for agenda fees
- Combined approval and agenda creation

---

### DAOAgendaManager Contract

#### Basic Agenda Information
```solidity
// Get total number of agendas
function numAgendas() view returns (uint256)

// Get complete agenda data structure by agenda ID
function agendas(uint256 _agendaID) view returns (LibAgenda.Agenda memory)
```

**Return Value - LibAgenda.Agenda Structure:**
```solidity
struct Agenda {
    uint256 createdTimestamp;        // When agenda was created
    uint256 noticeEndTimestamp;      // When notice period ends
    uint256 votingPeriodInSeconds;   // Duration of voting period
    uint256 votingStartedTimestamp;  // When voting started
    uint256 votingEndTimestamp;      // When voting ends
    uint256 executableLimitTimestamp; // Execution deadline
    uint256 executedTimestamp;       // When executed (0 if not executed)
    uint256 countingYes;             // Number of YES votes
    uint256 countingNo;              // Number of NO votes
    uint256 countingAbstain;         // Number of ABSTAIN votes
    AgendaStatus status;             // Current status (enum)
    AgendaResult result;             // Current result (enum)
    address[] voters;                // List of all voters
    bool executed;                   // Whether agenda was executed
}

///  AgendaStatus: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED
/// AgendaResult: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS

```

**Usage Example:**
```typescript
const agenda = await agendaManager.read.agendas([BigInt(agendaId)])
// Returns LibAgenda.Agenda structure as defined above
```

#### Agenda Creation
```solidity
// Create new agenda
function newAgenda(
    address[] memory _targets,
    uint256 _noticePeriodSeconds,
    uint256 _votingPeriodSeconds,
    bool _atomicExecute,
    bytes[] memory _functionBytecodes
) returns (uint256 agendaID)

// Get required creation fee
function createAgendaFees() view returns (uint256)

// Get minimum notice period
function minimumNoticePeriodSeconds() view returns (uint256)

// Get minimum voting period
function minimumVotingPeriodSeconds() view returns (uint256)
```

#### Voting Status and Results
```solidity
// CRITICAL: Always use this function to check voting status
function getVoteStatus(
    uint256 _agendaID,
    address _memberAddress
) view returns (bool hasVoted, uint256 vote)
```

// Get voting counts
function getVotingCount(uint256 _agendaID) view returns (
    uint256 countingYes,
    uint256 countingNo,
    uint256 countingAbstain
)

// Get all voters for an agenda
function getVoters(uint256 _agendaID) view returns (address[] memory)

// Check if address is eligible voter
function isVoter(uint256 _agendaID, address _candidate) view returns (bool)
```

#### Execution Information
```solidity
// Get execution details
function getExecutionInfo(uint256 _agendaID) view returns (
    address[] memory target,
    bytes[] memory functionBytecode,
    bool atomicExecute,
    uint256 executeStartFrom
)

// Check if agenda can be executed
function canExecuteAgenda(uint256 _agendaID) view returns (bool)
```

#### Timestamps and Periods
```solidity
// Get all relevant timestamps
function getAgendaTimestamps(uint256 _agendaID) view returns (
    uint256 createdTimestamp,
    uint256 noticeEndTimestamp,
    uint256 votingStartedTimestamp,
    uint256 votingEndTimestamp,
    uint256 executedTimestamp
)

// Get specific timing information
function getAgendaNoticeEndTimeSeconds(uint256 _agendaID) view returns (uint256)
function getAgendaVotingStartTimeSeconds(uint256 _agendaID) view returns (uint256)
function getAgendaVotingEndTimeSeconds(uint256 _agendaID) view returns (uint256)
```

---

### DAOCommittee Contract

#### Version Detection
```solidity
// Check DAO Committee version
function version() pure returns (string memory)
```
**Version Detection:**
- Returns "2.0.0" for DAO Committee v2

#### Agenda Status and Results
**DAO Committee v2 only:**
```solidity
// Get current agenda status and result (v2 only)
function currentAgendaStatus(uint256 _agendaID) view returns (
    uint256 agendaResult,
    uint256 agendaStatus
)
```

**Status and Result Enums (v2 only):**
- **AgendaResult**: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS, 4=NO_CONSENSUS, 5=NO_AGENDA
- **AgendaStatus**: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA

**DAO Committee v1:**
- `currentAgendaStatus()` 함수가 없음
- `AgendaManager.agendas()`의 status 필드만 사용

#### Committee Management
```solidity
// Get maximum number of committee members
function maxMember() view returns (uint256)

// Get member address by index
function members(uint256 index) view returns (address)

// Get candidate information
function candidateInfos(address candidate) view returns (
    address candidateContract,
    uint256 indexMembers,
    uint256 memberJoinedTime,
    uint256 rewardPeriod,
    uint256 claimedTimestamp
)
```

#### Agenda Execution
```solidity
// Execute approved agenda (open to anyone)
function executeAgenda(uint256 _agendaID)

// Check execution permission (for debugging only)
function canExecute(address user) view returns (bool)
```

**Execution Logic by Version:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus()` 함수 사용 가능
- `agendaStatus`=3 (WAITING_EXEC) 확인 가능
- `agendaResult`= 4 (NO_CONSENSUS) prevents execution

**DAO Committee v1:**
- `Committee.currentAgendaStatus()` 함수 없음
- `AgendaManager.agendas()`의 status=3 (WAITING_EXEC) 확인
- `AgendaManager.agendas()`의 result=1 (ACCEPT) 확인

---

### Candidate Contract

#### Voting Operations
```solidity
// Cast vote (only callable by committee members)
function castVote(
    uint256 _agendaID,
    uint256 _vote,      // 1=YES, 2=NO, 3=ABSTAIN
    string memory _comment
)

// DEPRECATED: Use AgendaManager.getVoteStatus instead
function hasVoted(uint256 _agendaID, address _user) view returns (bool)
```

### OperatorManager Contract

#### Voting Operations
```solidity

// Get manager address (AgendaManager contract)
function manager() view returns (address)

```

---

## 📖 LibAgenda.Agenda Structure

The `LibAgenda.Agenda` structure is the core data structure returned by the `agendas(uint256 _agendaID)` function. It contains all information about a specific agenda.

```solidity
struct Agenda {
    uint256 createdTimestamp;        // When agenda was created (Unix timestamp)
    uint256 noticeEndTimestamp;      // When notice period ends (Unix timestamp)
    uint256 votingPeriodInSeconds;   // Duration of voting period in seconds
    uint256 votingStartedTimestamp;  // When voting started (Unix timestamp)
    uint256 votingEndTimestamp;      // When voting ends (Unix timestamp)
    uint256 executableLimitTimestamp; // Execution deadline (Unix timestamp)
    uint256 executedTimestamp;       // When executed (0 if not executed, Unix timestamp)
    uint256 countingYes;             // Number of YES votes
    uint256 countingNo;              // Number of NO votes
    uint256 countingAbstain;         // Number of ABSTAIN votes
    AgendaStatus status;             // Current status (enum)
    AgendaResult result;             // Current result (enum)
    address[] voters;                // List of all voter addresses
    bool executed;                   // Whether agenda was executed
}
```

**Field Descriptions:**
- **Timestamps**: All timestamps are Unix timestamps (seconds since epoch)
- **Vote Counts**: Raw numbers of each vote type
- **Status & Result**: Enum values representing current state
- **Voters Array**: Complete list of addresses that have voted
- **Executed Flag**: Boolean indicating if agenda has been executed

**AgendaStatus Enum Values:**
- `0`: NONE - Agenda doesn't exist
- `1`: NOTICE - Agenda is in notice period (waiting for voting to start)
- `2`: VOTING - Agenda is currently being voted on
- `3`: WAITING_EXEC - Voting ended, agenda approved, waiting for execution
- `4`: EXECUTED - Agenda has been executed successfully
- `5`: ENDED - Agenda lifecycle has ended (rejected, dismissed, or executed)

**AgendaResult Enum Values:**
- `0`: PENDING - Agenda is waiting for voting to start or in progress
- `1`: ACCEPT - Agenda was approved by majority vote
- `2`: REJECT - Agenda was rejected by majority vote
- `3`: DISMISS - Agenda was dismissed (insufficient votes, etc.)

---

## 🔄 Common Usage Patterns

### 1. **Fetching Agenda List**
```typescript
// Get total count
const totalAgendas = await agendaManager.read.numAgendas()

// Generate agenda IDs (newest first)
const agendaIds = Array.from(
  { length: Number(totalAgendas) },
  (_, i) => Number(totalAgendas) - 1 - i
)

// Fetch each agenda by ID
for (const id of agendaIds) {
  const agenda = await agendaManager.read.agendas([BigInt(id)])
  // Process agenda data...
}
```

### 2. **Getting Specific Agenda by ID**
```typescript
// Get a specific agenda by its ID
const agenda = await agendaManager.read.agendas([BigInt(agendaId)])
```

### 3. **Getting Detailed Agenda Information**
```typescript
// Basic agenda data by ID
const agenda = await agendaManager.read.agendas([BigInt(agendaId)])

// Current status and result
const [result, status] = await committee.read.currentAgendaStatus([BigInt(agendaId)])

// Voting information for specific committee member
const [hasVoted, vote] = await agendaManager.read.getVoteStatus([
  BigInt(agendaId),
  memberAddress
])

// Execution details
const [targets, bytecodes, atomic, startFrom] = await agendaManager.read.getExecutionInfo([
  BigInt(agendaId)
])
```

### 4. **Creating New Agenda**
```typescript
// Check requirements
const fee = await agendaManager.read.createAgendaFees()
const balance = await tonToken.read.balanceOf([userAddress])
const minNotice = await agendaManager.read.minimumNoticePeriodSeconds()
const minVoting = await agendaManager.read.minimumVotingPeriodSeconds()

// Create agenda with fee payment
await tonToken.write.approveAndCall([
  agendaManagerAddress,
  fee,
  encodedAgendaData
])
```

### 5. **Committee Voting**
```typescript
// Get committee member's candidate contract
const candidateContract = await committee.read.candidateInfos([memberAddress])

// Cast vote through candidate contract
await candidateContract.write.castVote([
  BigInt(agendaId),
  BigInt(voteType), // 1=YES, 2=NO, 3=ABSTAIN
  comment
])
```

### 6. **Agenda Execution**
```typescript
// Anyone can execute approved agendas
await committee.write.executeAgenda([BigInt(agendaId)])
```

---

## ⚠️ Important Notes

### Critical Functions
- **Always use `AgendaManager.getVoteStatus()`** instead of `Candidate.hasVoted()`
- **Use `Committee.currentAgendaStatus()`** for real-time status updates
- **Check `AgendaManager.canExecuteAgenda()`** before attempting execution

### Vote Types
- `1`: YES (approve agenda)
- `2`: NO (reject agenda)
- `3`: ABSTAIN (neutral vote)

### Permission Model
- **Agenda Creation**: Anyone with sufficient TON balance
- **Voting**: Only committee members through their candidate contracts
- **Execution**: Anyone can execute approved agendas

### Gas Optimization
- Batch multiple read calls when possible
- Use multicall patterns for fetching multiple agendas

---

This comprehensive guide covers all contract interfaces used across Tokamak DAO applications. Refer to the specific prompt files for complete implementation examples.