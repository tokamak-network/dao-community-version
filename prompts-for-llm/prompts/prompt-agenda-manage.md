# 🏛️ Tokamak DAO Agenda Manager Prompt

## 📋 Complete Implementation Request

```
Please implement a complete Tokamak DAO agenda management application that combines agenda detail viewing, voting, and execution functionalities based on Next.js 15 + wagmi v2 according to all the requirements below.

**PROJECT SETUP: Create the project in a `generated-app` folder with a project-specific name (e.g., `generated-app/tokamak-dao-agenda-app` or a name based on the specific implementation requirements).**

**IMPORTANT: All UI text, labels, buttons, and messages must be in English.**

---

## 🎯 Tech Stack
- Next.js 15 (App Router)
- TypeScript
- wagmi v2 + viem v2
- @tanstack/react-query v5
- TailwindCSS (with inline styles)

### Wallet Configuration
**Wallet connection supports MetaMask only:**
- Use MetaMask-only connector
- Do not provide other wallet connection options
- Include MetaMask installation and connection guide messages

### Performance Requirements
1. **NEVER use `refetchInterval`** in useReadContract - causes excessive RPC calls
2. **Manual refresh only** - use refetch() after user actions and manual refresh button
3. **Use multicall (`useReadContracts`)** - Batch multiple contract calls into single RPC request
4. **Use caching** - rely on wagmi's built-in query caching

### UI Requirements
**Refresh Button Implementation:**
- 🔄 Add manual refresh button in header/top area
- ✅ Button should refresh all agenda data and vote status
- 🎯 Place prominently for easy user access
- ⏱️ Show loading state during refresh

## 🌐 Network and Contract Configuration
- **Mainnet (chainId: 1)**
  - TON: 0x2be5e8c109e2197D077D13A82dAead6a9b3433C5
  - committee: 0xDD9f0cCc044B0781289Ee318e5971b0139602C26
  - agendaManager: 0xcD4421d082752f363E1687544a09d5112cD4f484
- **Sepolia (chainId: 11155111)**
  - TON: 0xa30fe40285b8f5c0457dbc3b7c8a280373c40044
  - committee: 0xA2101482b28E3D99ff6ced517bA41EFf4971a386
  - agendaManager: 0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08

## 🔧 Core Feature Requirements

### 0. Wallet Connection Strategy
**📖 Reading vs Writing Operations:**

**✅ NO WALLET REQUIRED (Read-Only):**
- Agenda search and navigation
- Agenda detail display (dates, voting counts, status)
- Committee member list and information
- Real-time status and results viewing
- All contract data queries and multicalls
- **Network selection and switching**: Network selection possible even without wallet connection

**🔐 WALLET CONNECTION REQUIRED (Write Operations):**
- Voting transactions
- Agenda execution
- All state-changing contract interactions

**🔗 MetaMask-only wallet connection:**
- **Wallet connection supports MetaMask only**
- Display installation guide message if MetaMask is not installed
- Display connection button if MetaMask is installed but not connected
- Do not provide other wallet connection options

## 📋 Functional Specifications

### 1. Agenda Management System

#### 1.1 Agenda Search & Navigation

**Functionality:**
- URL parameter support for agenda ID (?id=N)
- Agenda ID input field with validation (0 to maximum agenda number)
- Display total agenda count and validation
- Previous/Next agenda navigation buttons with boundary handling
- Direct agenda ID entry with Enter key support

**User Interface:**
- Agenda ID input field with validation feedback
- Navigation buttons (Previous/Next) with disabled states
- Total agenda count display
- Invalid ID warning with proper range display

#### 1.2 Agenda Detail Display
**Data Sources:**
- `AgendaManager.agendas(id)` - Complete agenda data structure
- `Committee.currentAgendaStatus(id)` - Real-time status and result

**Displayed Information:**
- **Agenda Header:**
  - Agenda ID (prominent display with "Agenda #N" format)
  - Agenda Details title
- **Timeline Information:**
  - Creation date (createdTimestamp → readable date)
  - Notice end date (noticeEndTimestamp)
  - Voting period duration (votingPeriodInSeconds → human readable)
  - Voting start/end dates (calculated from notice end + voting period) Only displayed when voting has started. After notice end time, voting is possible even without these times.
  - Executable deadline (executableLimitTimestamp) Execution becomes impossible after the executable deadline has passed.
  - Execution date (executedTimestamp, executed boolean)

- **Voting Results:**
  - Yes votes count (countingYes) with progress bar
  - No votes count (countingNo) with progress bar
  - Abstain votes count (countingAbstain) with progress bar
  - Total voter count and percentage

- **AgendaManager.agendas(id)'s Status Information:**
  - AgendaStatus: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED
  - AgendaResult: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS
  - Real-time status updates

- **Voter Information:**
  - Complete voter list (voters array)
  - Etherscan links for each voter address
  - Individual vote status for each voter

#### 1.3 Real-time Status Updates
**DAO Committee Version-specific status checking:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus(id)` function available
- Returns real-time status and result: `[agendaResult, agendaStatus]`

**DAO Committee v1:**
- `Committee.currentAgendaStatus(id)` function not available
- Only use `AgendaManager.agendas(id)` status field

**Committee.currentAgendaStatus(id)'s Status Mapping (v2 only):**
- **Committee.currentAgendaStatus(id)'s AgendaStatus → English Text:**
  - 0 = Pending
  - 1 = Notice Period
  - 2 = Voting
  - 3 = Waiting for Execution
  - 4 = Executed
  - 5 = Ended
  - 6 = NO AGENDA

- **Committee.currentAgendaStatus(id)'s AgendaResult → English Text:**
  - 0 = Pending
  - 1 = Approved
  - 2 = Rejected
  - 3 = DISMISS,
  - 4 = NO CONSENSUS
  - 5 = NO AGENDA

### 2. Committee Management System

#### 2.1 Member Information Display
**Data Sources:**
- `Committee.maxMember()` - Total member count
- `Committee.members(index)` - Individual member addresses
- `Committee.candidateInfos(address)` - Member details
- `OperatorManager(member Address).manager()` - Manager address from OperatorManager contract

**Displayed Information:**
- Total committee member count
- Individual member addresses with Etherscan links
- Member candidate contract addresses
- User membership detection (member address or manager address)

#### 2.2 Membership Detection
**Voting eligibility checking by voting phase:**

**When voting has not started yet (after notice period ends, voting start time = 0):**
- Check `Committee.members(index)` array
- Verify each member's `OperatorManager(member address).manager()` address
- Check if connected wallet address matches member address or manager address

**When voting has already started (voting start time > 0, Voting Period):**
- Check `AgendaManager.agendas().voters` array
- Verify each voter's `OperatorManager(voter address).manager()` address
- Check if connected wallet address matches voter address or manager address

**Voting eligibility conditions:**
1. **Committee Member direct voting**: User's wallet address matches Committee member address
2. **Voting through Manager**: User's wallet address matches Committee member's manager address (only if manager address is not `0x0000000000000000000000000000000000000000`)

**Voting timing conditions:**
1. **Notice period ended**: After `noticeEndTimestamp`
2. **Not yet executed**: `executed` is `false`
3. **Version-specific voting status check**:
   - **DAO Committee v2**: When `Committee.currentAgendaStatus(id)`'s `agendaStatus` is 2 (Voting)
   - **DAO Committee v1**: When `AgendaManager.agendas(id)`'s `status` is 2 (Voting)

**Logic:**
- Check if connected wallet address is in members array (before voting) or voters array (during voting)
- Check if connected wallet address matches any manager address
- Display appropriate membership status and voting permissions

### 3. Voting System

#### 3.1 Vote Status Checking
**CRITICAL IMPLEMENTATION:**
```typescript
// CORRECT: Use AgendaManager.getVoteStatus with MEMBER address
const { data: voteStatus } = useReadContract({
  address: contracts?.agendaManager as `0x${string}`,
  abi: AGENDA_MANAGER_ABI,
  functionName: 'getVoteStatus',
  args: [BigInt(agendaId || 0), memberAddress as `0x${string}`],
  query: { enabled: !!contracts?.agendaManager && !!memberAddress && agendaId !== null }
});
```

**Vote Types:**
- 1 = YES (For)
- 2 = NO (Against)
- 3 = ABSTAIN (Abstain)

#### 3.2 Voting Function Execution
**CRITICAL: Voting function must be called through member's candidateContract**

**Correct voting function call method:**
```typescript
// ✅ CORRECT: Use candidateContract address to call castVote function
const handleVote = () => {
  if (!selectedMember || !agendaData) return

  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  if (!contracts) return

  // Find the selected member's candidateContract address
  const selectedMemberInfo = members.find(member => member.address === selectedMember)
  if (!selectedMemberInfo?.candidateContract) {
    console.error('Candidate contract not found for selected member:', selectedMember)
    return
  }

  writeContract({
    address: selectedMemberInfo.candidateContract as `0x${string}`,  // ✅ Use candidateContract address
    abi: CANDIDATE_ABI,
    functionName: 'castVote',
    args: [BigInt(agendaId), BigInt(voteType), comment],
  })
}
```

**❌ Wrong implementation (avoid this method):**
```typescript
// ❌ WRONG: Use member address directly
writeContract({
      address: selectedMember as `0x${string}`,  // ❌ Use member address directly
  abi: CANDIDATE_ABI,
  functionName: 'castVote',
  args: [BigInt(agendaId), BigInt(voteType), comment],
})
```

**Voting function call flow:**
1. **User selects member** → `selectedMember` (member address)
2. **`members.find()`** → Find the member's `candidateContract` address
3. **`writeContract()`** → Call `castVote` function with `candidateContract` address
4. **Correct voting execution** → Vote through **member's candidateContract**, not manager

**Required data structure:**
```typescript
interface MemberInfo {
  address: `0x${string}`           // member address
  candidateContract: `0x${string}` // candidateContract address (for voting function calls)
  hasVoted: boolean
  vote: number
  managerAddress?: `0x${string}`   // manager address
}
```

#### 3.3 Voting Interface
**User Interface:**
- Member selection UI (when multiple memberships)
- Vote options (For/Against/Abstain) with clear labels
- Transaction progress indicators
- Vote status display for each member
- Wallet connection required message before voting options

**Voting Restrictions:**
- **Members who have already voted cannot vote again**: Exclude members who have already voted (confirmed by `AgendaManager.getVoteStatus()`) from the selection dropdown
- **Vote status display**: Clearly display "Voted" or "Not voted" status for each member
- **Duplicate voting prevention**: Display appropriate error message when attempting duplicate voting for the same member

**Voting Flow:**
1. Check wallet connection
2. Verify membership status
3. Check current voting status for each member
4. Filter out already voted members from selection
5. Display voting options (only for non-voted members)
6. Handle transaction submission
7. Show transaction progress
8. Update vote status after completion

**CRITICAL VOTING UI REQUIREMENTS:**
- **Voting screen must always be displayed**: Voting section must always be shown even if voting conditions are not met
- **Always display who can vote**: Always show who can vote
- **Wallet connection and voting permission verification**:
  - **Voter information viewable without wallet connection**: All voter information must always be displayed regardless of wallet connection
  - **Voting permission verification when wallet is connected**: When wallet is connected, verify the wallet's voting permissions and display as "Direct", "You", "No permission", etc.
  - **Voting permission display logic**:
    - Display "Direct" if wallet address matches member address
    - Display "You" if wallet address matches manager address
    - Display "No permission" for other cases
- **Voter information display layout**:
  - **Display voter address and manager address horizontally**: Arrange member address and manager address horizontally in each voter card
  - **Voter address**: Display in large font at the top (including Etherscan link)
  - **Manager address**: Display in small font at the bottom (including Etherscan link, display "No manager" if not present)
  - **Voting permission display**: Display "Direct", "You", "No permission", etc. on the right
- **Message display based on voting conditions**:
  - When notice period has not ended: "Notice period not ended yet"
  - When already executed: "Agenda already executed"
  - When wallet is not connected: "Wallet connection required"
  - When no voting permission: "No voting permission"
  - When all members have voted: "All members voted"
- **Voting timing verification**:
  - Voting possible after `noticeEndTimestamp`
  - Voting only possible when `executed` is false
  - Display voting form if voting conditions are met, otherwise display appropriate message

### 4. Execution System

#### 4.1 Execution Conditions
**CRITICAL: Execution is open to ANYONE, not just committee members**

**Execution Condition Check Priority (check in order):**
1. **Check if voting is in progress** (highest priority)
   - DAO v2: `Committee.currentAgendaStatus(id)'s agendaStatus=2` (Voting)
   - DAO v1: `AgendaManager.agendas(id)'s status=2` (Voting)
   - → Display "⏳ Waiting for voting to complete" message

2. **Check if already executed**
   - `AgendaManager.agendas(id)'s executed=true`
   - → Display "✅ Executed" message

3. **Check execution period expiration**
   - `executableLimitTimestamp > 0 && currentTime > executableLimitTimestamp`
   - → Display "⏰ Execution period has expired" message

4. **Check execution conditions by DAO version**
   - **DAO v2**: Check `Committee.currentAgendaStatus(id)'s agendaStatus=3` (WAITING_EXEC)
   - **DAO v1**: Check `AgendaManager.agendas(id)'s status=3` (WAITING_EXEC)
   - → Display execution button when conditions are met

#### 4.2 Execution Function Implementation
**CRITICAL: Agenda execution must call Committee.executeAgenda(agendaId) function**

**✅ Correct execution function call method:**
```typescript
// ✅ CORRECT: Use Committee address to call executeAgenda function
writeContract({
      address: contracts.committee as `0x${string}`,  // ✅ Use Committee address
  abi: COMMITTEE_ABI,
  functionName: 'executeAgenda',
  args: [BigInt(agendaId)],
})
```

**Execution function call flow:**
1. **Check execution conditions** → Refer to Execution Condition Check Priority above
2. **Check wallet connection** → MetaMask connection required
3. **`writeContract()`** → Call `executeAgenda` function with `Committee` address
4. **Agenda execution completed** → Update agenda status when transaction succeeds

#### 4.3 Execution Interface
**User Interface:**
- Execution button (when conditions met)
- Execution status display
- Transaction progress indicators
- Appropriate error messages for each execution failure case

### 5. Manual Refresh System

#### 5.1 Refresh Functionality
**Implementation:**
- Refresh button in UI header with loading state
- Refreshes agendaData, currentStatus, and numAgendas in parallel
- Success/error feedback for refresh operations
- Manual refresh after voting/execution completion

**User Interface:**
- Prominent refresh button in header/top area
- Loading spinner during refresh
- Success/error toast notifications
- Disabled state during refresh operation

### 6. Network & Contract Management

#### 6.1 Network Support
**Supported Networks:**
- **Ethereum Mainnet (chainId: 1)**
- **Sepolia Testnet (chainId: 11155111)**

**Network Switching:**
- **Network selection possible even without wallet connection**: Network selection works independently of wallet connection
- Automatic network detection
- Manual network selector
- Contract address updates based on network
- Network-specific configuration

#### 6.2 Contract Integration
**Contract Functions Used:**
- **AgendaManager:** numAgendas, agendas, getVoteStatus
- **Committee:** maxMember, members, candidateInfos, currentAgendaStatus, executeAgenda
- **Candidate:** castVote
- **OperatorManager:** manager

**Multicall Optimization:**
- Batch multiple contract calls into single RPC request
- Use `useReadContracts` for efficient data fetching
- Implement proper error handling with `allowFailure: true`
- Cache results with appropriate stale time

## 🎯 Implementation Requirements

### 1. Agenda Search and Selection
- URL parameter support for agenda ID (?id=N)
- Agenda ID input field with validation (0 to maximum agenda number)
- Display total agenda count and validation
- Previous/Next agenda navigation buttons with boundary handling
- Direct agenda ID entry with Enter key support

### 2. Agenda Detail Information Display
**AgendaManager.agendas(id) call results:**
- Creation date (createdTimestamp → readable date)
- Notice end date (noticeEndTimestamp)
- Voting period (votingPeriodInSeconds → duration conversion)
- Voting start (votingStartedTimestamp)
  - Voting start date: When agenda notice ends and a person who can vote starts voting, that becomes the voting start date.
  - Voting end date: Voting start date + voting period
  - Initial value is 0 when no one has voted yet.
  - Voting is possible for eligible voters after agenda notice ends.
- Voting end dates (votingEndTimestamp)
  - Initial value is 0 when no one has voted yet.
- Executable deadline (executableLimitTimestamp)
  - Initial value is 0 when no one has voted yet.
- Execution date (executedTimestamp, executed boolean)
  - Initial value is 0 when no one has voted yet.
- Voting results (countingYes, countingNo, countingAbstain) with progress bars
- AgendaStatus status; 0:NONE, 1:NOTICE, 2:VOTING, 3:WAITING_EXEC, 4:EXECUTED, 5:ENDED
- AgendaResult result; 0:PENDING, 1:ACCEPT, 2:REJECT, 4:DISMISS
- Voter list (voters array) with Etherscan links

**DAO Committee v2 Agenda Memo Display:**
- Query memo information using `Committee.agendaMemo(agendaId)` function
- Display as "Agenda Memo" section in agenda details
- **URL link functionality**: Automatically convert http/https URLs in memo content to clickable links
- Links open in new window when clicked (`target="_blank"`, `rel="noopener noreferrer"`)
- Link style: Blue text, darker blue on hover, underlined

### 3. Real-time Status Information
**Committee.currentAgendaStatus(id) call results:**
- This function is only available in DAO version 2.
- Current agenda status (agendaStatus) → English text conversion : 0=Pending, 1=Notice Period, 2=Voting, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA
- Current agenda result (agendaResult) → English text conversion : 0=Pending, 1=Approved, 2=Rejected, 3=Invalid, 4=NO_CONSENSUS, 5=NO_AGENDA

**DAO Committee v2 Agenda Memo Information:**
- Use `Committee.agendaMemo(agendaId)` function (only available in DAO v2)
- Returns (string) - Agenda memo information
- Display memo information in agenda details
- **URL link functionality**: Display as clickable links when URLs are included in memo content (opens in new window)

### 4. Committee Member Management System
- Get total number of committee members (maxMember)
- Get individual member addresses (members function)
- Get member info for each address (candidateInfos)
- Get manager address from OperatorManager contract (manager function)
- User membership detection (member address or manager address)

### 5. Voting Functionality
**CRITICAL: Vote status must be checked using AgendaManager.getVoteStatus, NOT Candidate.hasVoted:**

#### 5.1 Display available voters/members
**Display list of available voters (or members) and manager addresses in voting screen:**

**Display information:**
- Voter/member address (Etherscan link)
- Manager address (Etherscan link, display "None" if not present)
- Display voting permissions for currently connected wallet
  - "Direct": Can vote directly
  - "You": Can vote as manager
- Voting eligibility explanation text

**UI Layout:**
- Display each voter/member

**Vote status display:**
- **Members who have already voted**: Display "✓ Voted" along with vote type (For/Against/Abstain)
- **Members who have not voted yet**: Display "Not voted yet"
- **Members who cannot vote**: Display "❌ No voting permission"

**Phase distinction:**
- Before voting starts: "Available Voters (Committee Members)"
- After voting starts: "Available Voters (Current Voters)"

#### 5.2 Voter list query method (Implementation guide)

**Available Voters query method based on voting phase:**

**Method 1: Before voting starts (votingStartedTimestamp = 0)**
```typescript
// Condition: agendaData.votingStartedTimestamp === BigInt(0)
// Use Committee member list (batch query with multicall)
const { data } = useReadContracts({
  contracts: [
    // Step 1: Query Committee member addresses
    ...Array.from({ length: maxMember }, (_, i) => ({
      address: contracts.committee,
      abi: COMMITTEE_ABI,
      functionName: 'members' as const,
      args: [BigInt(i)],
    })),
    // Step 2: Query each member's manager address (OperatorManager.manager() call)
    ...memberAddresses.map(memberAddress => ({
              address: memberAddress, // memberAddress is OperatorManager contract
      abi: OPERATOR_MANAGER_ABI,
      functionName: 'manager' as const,
    })),
  ],
  query: { enabled: !!contracts && maxMember > 0 },
})
// Permission check: Check if connected wallet matches member address or manager address
```

**Method 2: After voting starts (votingStartedTimestamp > 0)**
```typescript
// Condition: agendaData.votingStartedTimestamp > BigInt(0)
// Use Agenda's voters array
const availableVoters = agendaData.voters

// Implementation:
1. AgendaManager.agendas(agendaId).voters - Query voting participant address array
2. OperatorManager(voterAddress).manager() for each voter - Query manager address
3. Permission check: Check if connected wallet matches voter address or manager address
```

**Actual implementation example:**
```typescript
const getAvailableVoters = (agendaData: AgendaData, committeeMembers: MemberInfo[]) => {
  const isVotingStarted = agendaData.votingStartedTimestamp > BigInt(0)

  if (isVotingStarted) {
    // After voting starts: use voters array
    return agendaData.voters.map(voterAddress => ({
      address: voterAddress,
      type: 'voter' as const
    }))
  } else {
    // Before voting starts: use committee members
    return committeeMembers.map(member => ({
      address: member.address,
      type: 'member' as const
    }))
  }
}
```

**Manager query method:**
- **Correct method**: Use `OperatorManager(memberAddress).manager()`

#### 5.3 Voter query and manager verification (Implementation guide)

**Step 1: Query available voting addresses**
```typescript
// Before voting starts: Use Committee members (multicall optimization)
const { data: memberResults } = useReadContracts({
  contracts: [
    { address: committee, abi: COMMITTEE_ABI, functionName: 'members', args: [0] },
    { address: committee, abi: COMMITTEE_ABI, functionName: 'members', args: [1] },
    { address: committee, abi: COMMITTEE_ABI, functionName: 'members', args: [2] }
  ]
})
const voters = memberResults?.map(result => result.result).filter(Boolean)
// Result: ['0xOperatorManager1', '0xOperatorManager2', '0xOperatorManager3']

// After voting starts: Use agendas().voters array
const voters = agendaData.voters
// Result: ['0xOperatorManager1', '0xOperatorManager2'] (only actual participants)
```

**Step 2: Query each OperatorManager's manager**
```typescript
// Direct manager() call to each OperatorManager contract (multicall optimization)
const { data: managerResults } = useReadContracts({
  contracts: voters.map(operatorManagerAddress => ({
    address: operatorManagerAddress,
    abi: OPERATOR_MANAGER_ABI,
    functionName: 'manager'
  }))
})
const managers = managerResults?.map(result => result.result)
// Result: ['0xManager1', '0x0000...000', '0xManager3'] (only return addresses that have managers)
```

#### 5.4 Important: Committee Members always loading
Committee members must **always be loaded once when the app starts** regardless of voting status.

**Implementation principle:**
- ✅ Always call Committee.members(0,1,2)
- ✅ Load regardless of voting start status
- ❌ Prevent empty array due to conditional loading

**Reason:**
Use different address arrays before and after voting starts, but Committee members are always needed as basic data

#### 5.5 maxMember setting
Use **fixed value 3** instead of Committee.maxMember() query

**Implementation:**
```typescript
const maxMember = 3 // Use fixed value
// const maxMember = await Committee.maxMember() ← Not used

// Query Committee members (use multicall)
const { data: memberResults } = useReadContracts({
  contracts: Array.from({ length: maxMember }, (_, i) => ({
    address: committee,
    abi: COMMITTEE_ABI,
    functionName: 'members',
    args: [i]
  }))
})
const members = memberResults?.map(result => result.result).filter(Boolean)
```

**Reason:**
- Remove risk of contract call failure
- Reduce loading time
- Reduce implementation complexity

### 6. Execution Functionality
**CRITICAL: Execution is open to ANYONE, not just committee members**

**Check execution availability by DAO Committee Version:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus()` function available
- `agendaStatus` must be 3 (WAITING_EXEC).
- Execution not possible if `agendaResult`= 4 (NO_CONSENSUS)
- **Execution condition check order**: Refer to Execution Condition Check Priority above

**DAO Committee v1:**
- `Committee.currentAgendaStatus()` function not available
- `AgendaManager.agendas()` status must be 3 (WAITING_EXEC).
- `AgendaManager.agendas()` result must be 1 (ACCEPT).
- **Execution condition check order**: Refer to Execution Condition Check Priority above

**Execution Conditions and Validation:**
- **Check in priority order** (Refer to Execution Condition Check Priority above)
- Check execution period: `executableLimitTimestamp` vs current time (executableLimitTimestamp!=0)
- Verify agenda not already executed: `executed` boolean must be false
- Ensure voting completed and approved: `countingYes > countingNo`
- **DAO v2 additional condition**: Execution not possible if `agendaResult=4` (NO_CONSENSUS)


### 7. Manual Refresh Functionality
- Refresh button in UI header with loading state
- Refreshes agendaData, currentStatus, and numAgendas in parallel
- Success/error feedback for refresh operations
- Manual refresh after voting/execution completion

## 📊 Required Contract Functions and ABIs

### Committee Contract Functions
**DAO Committee Version Detection:**
- `version()` function returns "2.0.0" for DAO Committee v2

```typescript
export const COMMITTEE_ABI = [
  {
    "inputs": [],
    "name": "version",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "pure",
    "type": "function"
  },
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
    "inputs": [{ "internalType": "address", "name": "candidate", "type": "address" }],
    "name": "candidateInfos",
    "outputs": [
      { "internalType": "address", "name": "candidateContract", "type": "address" },
      { "internalType": "uint256", "name": "indexMembers", "type": "uint256" },
      { "internalType": "uint256", "name": "memberJoinedTime", "type": "uint256" },
      { "internalType": "uint256", "name": "rewardPeriod", "type": "uint256" },
      { "internalType": "uint256", "name": "claimedTimestamp", "type": "uint256" }
    ],
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
    "name": "agendaMemo",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
```

### Candidate Contract Functions
```typescript
export const CANDIDATE_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_agendaID", "type": "uint256" },
      { "internalType": "uint256", "name": "_vote", "type": "uint256" },
      { "internalType": "string", "name": "_comment", "type": "string" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```

### OperatorManager Contract Functions
```typescript
export const OPERATOR_MANAGER_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "memberAddress", "type": "address" }],
    "name": "manager",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
```

### AgendaManager Contract Functions
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
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "agendaMemo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```

## 🎨 UI/UX Requirements

### Header Section
- **MetaMask-only wallet connection** (Connect/Disconnect buttons)
- Network selector (Mainnet/Sepolia) with automatic switching
- Current contract addresses display (chain-aware)
- Total agenda count and current viewing ID
- **Manual Refresh Button** with spinner and disabled state

### Main Content Layout
1. **Agenda Navigation Section**
   - Agenda ID input field with Enter key support
   - Previous/Next buttons with proper boundary handling
   - "Go" button for direct navigation
   - Invalid ID warning with proper range display

2. **Agenda Detail Information Card**
   - Status badges with English labels and color coding
   - Timeline section with calculated voting start/end times
   - Vote results with animated progress bars
   - Real-time status section

3. **Voting Section**
   - Member selection UI (when multiple memberships)
   - Vote options (For/Against/Abstain)
   - Transaction progress indicators
   - Vote status display for each member

4. **Execution Section**
   - Execution button (when conditions met)
   - Execution status display
   - Transaction progress indicators

### UI Labels and Messages
```typescript
export const MESSAGES = {
  WALLET_CONNECTION_REQUIRED: "🔗 Wallet connection required. Please connect your wallet to vote.",
  VOTING_NOT_STARTED: "⏰ Voting has not started yet.",
  VOTING_ENDED: "⏰ Voting period has ended.",
  AGENDA_EXECUTED: "✅ Agenda execution completed!",
  AGENDA_APPROVED: "✅ Voting completed - Agenda approved!",
  AGENDA_REJECTED: "❌ Voting completed - Agenda rejected",
  NO_VOTING_PERMISSION: "❌ You don't have voting permission.",
  ALL_MEMBERS_VOTED: "🗳️ All committee members have completed voting.",
  VOTING_IN_PROGRESS: "🗳️ Voting in progress...",
  BLOCKCHAIN_CONFIRMING: "⏳ Confirming on blockchain...",
  EXECUTING: "🚀 Executing...",
  EXECUTION_READY: "✅ Execution ready! The agenda can be executed.",
  EXECUTION_COMPLETED: "✅ Executed",
  EXECUTION_WALLET_REQUIRED: "🔗 Wallet connection required. Please connect your wallet first to execute the agenda.",
  EXECUTION_PERIOD_EXPIRED: "⏰ Execution period has expired",
  EXECUTION_NO_CONSENSUS: "❌ Agenda failed to reach consensus",
  EXECUTION_NOT_APPROVED: "❌ Agenda was not approved (more votes against)",
  EXECUTION_WAITING_VOTE: "⏳ Waiting for voting to complete",
  VOTE_FOR: "For",
  VOTE_AGAINST: "Against",
  VOTE_ABSTAIN: "Abstain",
  STATUS_VOTING: "Voting",
  STATUS_WAITING_EXEC: "Waiting for Execution",
  STATUS_EXECUTED: "Executed",
  STATUS_ENDED: "Ended"
} as const;
```

## 📦 Required Dependencies
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.83.0",
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
    "tailwindcss": "^3.4.1",  // ⚠️ CRITICAL: Use v3, NOT v4
    "typescript": "^5"
  }
}
```

## 🔧 Critical Configuration Fix

**⚠️ CRITICAL: TailwindCSS Version and Configuration Requirements**

### 1. TailwindCSS Version
**MUST use TailwindCSS v3 (^3.4.1), NOT v4**
- TailwindCSS v4 has breaking changes with PostCSS plugin system
- If v4 is accidentally installed, uninstall and reinstall v3:
```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install tailwindcss@^3.4.1 --save-dev
```

### 2. PostCSS Configuration
```javascript
// postcss.config.mjs - MUST use this exact configuration for v3
const config = {
  plugins: {
    tailwindcss: {},    // Direct plugin reference for v3
    autoprefixer: {},
  },
}
export default config

// ❌ WRONG for v3: plugins: ["@tailwindcss/postcss"]  // This is for v4 only
```

### 3. Global CSS Configuration
```css
/* src/app/globals.css - Complete file content */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  
  body {
    @apply min-h-screen bg-white text-gray-900;
  }
}
```

### 4. Tailwind Configuration
```typescript
// tailwind.config.ts - Create if missing
import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

### 5. Troubleshooting Steps
If TailwindCSS classes are not working:
1. Check TailwindCSS version in package.json (must be v3)
2. Verify postcss.config.mjs uses direct plugin reference
3. Clear Next.js cache: `rm -rf .next`
4. Restart development server

**⚠️ Common Error Messages and Solutions:**
- `Error: It looks like you're trying to use tailwindcss directly as a PostCSS plugin` → Using v4 syntax with v3, fix postcss.config.mjs
- `Cannot apply unknown utility class` → TailwindCSS v4 installed or wrong PostCSS config
- `@tailwindcss/postcss` error → This package is for v4 only, don't use with v3

## 🚀 Development Time Optimization & Error Prevention Tips

### 📋 1. TypeScript Configuration Optimization

```json
// tsconfig.json - BigInt support and build optimization
{
  "compilerOptions": {
    "target": "ES2020", // Required for BigInt literal support
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "skipLibCheck": true, // Skip external library type checking for faster builds
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**BigInt Usage Pattern:**
```typescript
// ✅ Use BigInt() constructor instead of BigInt literals
const zero = BigInt(0) // Instead of 0n
const one = BigInt(1)  // Instead of 1n
const agendaId = BigInt(agendaIdString)
```

### 🔧 2. Contract Data Type Handling Patterns

```typescript
// Consistent type casting patterns for contract data
type ContractResult<T> = {
  result?: T
  error?: Error
}

// Type guard functions for safe data handling
const asAgendaData = (data: unknown): AgendaData | undefined => {
  if (!data) return undefined
  return data as unknown as AgendaData
}

const asTuple = <T extends readonly unknown[]>(data: unknown): T | undefined => {
  if (!data) return undefined
  return data as unknown as T
}

// Usage examples
const agendaData = asAgendaData(contractResult?.result)
const statusTuple = asTuple<[bigint, bigint]>(statusResult?.result)
```

### 🏗️ 3. Component Structure Optimization

```typescript
// src/types/contracts.ts - Define all interfaces in one place
export interface AgendaData {
  createdTimestamp: bigint
  noticeEndTimestamp: bigint
  votingPeriodInSeconds: bigint
  votingStartedTimestamp: bigint
  votingEndTimestamp: bigint
  executableLimitTimestamp: bigint
  executedTimestamp: bigint
  countingYes: bigint
  countingNo: bigint
  countingAbstain: bigint
  status: number
  result: number
  voters: readonly `0x${string}`[]
  executed: boolean
}

export interface MemberInfo {
  address: `0x${string}`
  candidateContract: `0x${string}`
  hasVoted: boolean
  vote: number
}

export interface ContractAddresses {
  ton: `0x${string}`
  committee: `0x${string}`
  agendaManager: `0x${string}`
}

// src/hooks/useContractData.ts - Centralized contract data management
export function useContractData(agendaId: number) {
  const { agendaData, isLoading: agendaLoading } = useAgendaData(agendaId)
  const { members, isLoading: membersLoading } = useMembers(agendaId)
  const { status, isLoading: statusLoading } = useAgendaStatus(agendaId)

  return {
    agendaData: asAgendaData(agendaData),
    members,
    status: asTuple<[bigint, bigint]>(status),
    isLoading: agendaLoading || membersLoading || statusLoading
  }
}
```

### ⚡ 4. Suspense and Client Component Patterns

```typescript
// app/page.tsx - Always wrap with Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientComponent />
    </Suspense>
  )
}

// components/ClientComponent.tsx - Use client hooks
'use client'
export default function ClientComponent() {
  const searchParams = useSearchParams()
  const agendaId = searchParams.get('id')
  // All client-side logic here
}
```

### 🛠️ 5. wagmi Multicall Optimization Patterns

```typescript
// Standard multicall pattern with error handling
const useOptimizedContracts = (contracts: any[], enabled: boolean = true) => {
  return useReadContracts({
    contracts,
    query: {
      enabled: enabled && contracts.length > 0,
      staleTime: 30_000, // 30 seconds cache
      refetchOnWindowFocus: false,
      retry: 3,
    },
    allowFailure: true, // Critical: continue even if some calls fail
  })
}

// Conditional contract call pattern
const baseContracts = useMemo(() => [
  // Always called contracts
], [dependency1])

const conditionalContracts = useMemo(() =>
  condition ? [/* conditional contracts */] : [],
  [condition, dependency2]
)

const { data: baseData } = useOptimizedContracts(baseContracts)
const { data: conditionalData } = useOptimizedContracts(conditionalContracts, condition)
```

### 📦 6. Dependency Installation with Version Locking

```bash
# Install with exact versions to prevent compatibility issues
npm install wagmi@2.16.0 viem@2.33.0 @tanstack/react-query@5.83.0 next@15.4.3
```

### 🔄 7. Optimized Development Workflow

```bash
# 1. Project creation and basic setup
npx create-next-app@15.4.3 --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies (all at once)
npm install wagmi@2.16.0 viem@2.33.0 @tanstack/react-query@5.83.0

# 3. Write configuration files first (next.config.ts, wagmi config)
# 4. Write type definition files (types/)
# 5. Write basic hooks (hooks/)
# 6. Write components (components/)
# 7. Assemble pages (app/)
```

### 🧪 8. Quick Testing Patterns

```typescript
// Quick test component for development
const QuickTest = () => {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'simpleFunction'
  })

  return <div>Test: {String(data)}</div>
}

// Step-by-step feature verification
// 1. Test wallet connection only
// 2. Test simple read function
// 3. Test complex multicall
// 4. Test write function
```

### 🚫 9. Common Mistakes to Avoid

```typescript
// ❌ Avoid these patterns
- 0n, 1n BigInt literals (causes errors in ES2020 below)
- useSearchParams without Suspense wrapper
- Too many contract calls in one batch (>50)
- Using refetchInterval (causes RPC rate limiting)
- Excessive use of any type (causes ESLint errors)
- Using member address directly for castVote function (should use candidateContract address)

// ✅ Recommended patterns
- BigInt(0), BigInt(1) constructor usage
- Always wrap client components with Suspense
- Keep batch size under 50 contracts
- Use manual refresh buttons only
- Cast through unknown for type safety
- Use candidateContract address for castVote function calls
```

### 📝 10. Development Checklist

**Pre-development Checklist:**
- [ ] TypeScript target ES2020 configured
- [ ] BigInt() constructor usage pattern understood
- [ ] Suspense structure planned
- [ ] Type definitions written first
- [ ] Multicall batch size considered
- [ ] allowFailure: true configured
- [ ] Caching strategy established
- [ ] Voting function call pattern understood (candidateContract address usage)

**Pre-build Checklist:**
- [ ] No ESLint errors
- [ ] No TypeScript compilation errors
- [ ] Suspense boundaries verified
- [ ] RPC call optimization confirmed

## ✅ Implementation Checklist

### 🏗️ Project Structure & Configuration
- [ ] Next.js 15 project with App Router structure
- [ ] TypeScript configuration (tsconfig.json) with ES2020 target
- [ ] TailwindCSS setup (tailwind.config.ts, postcss.config.mjs)
- [ ] Package.json with exact version dependencies
- [ ] Next.config.ts with webpack externals for pino-pretty
- [ ] All type definitions in src/types/contracts.ts
- [ ] Centralized hooks in src/hooks/ directory

### 🔗 Web3 Integration
- [ ] **MetaMask-only wagmi v2 configuration** (use metaMask connector only)
- [ ] wagmi v2 configuration with mainnet & sepolia
- [ ] Contract addresses properly defined for both networks
- [ ] All contract ABIs correctly implemented
- [ ] React Query provider setup
- [ ] Client-side only rendering to prevent hydration errors
- [ ] Multicall optimization with useReadContracts
- [ ] Proper error handling with allowFailure: true
- [ ] Caching strategy with staleTime and refetchOnWindowFocus: false

### 📋 Core Features Implementation
- [ ] URL parameter support for agenda ID (?id=N)
- [ ] Agenda ID input field with validation
- [ ] Previous/Next agenda navigation buttons
- [ ] Agenda details display (creator, status, timestamps, vote results)
- [ ] Real-time status display with English interpretation
- [ ] Vote result visualization with progress bars
- [ ] Voter list with Etherscan links
- [ ] Manual refresh button functionality

### 🗳️ Voting System
- [ ] Committee member detection using contract multi-calls
- [ ] Vote status checked via AgendaManager.getVoteStatus
- [ ] **Voting function must be called through candidateContract address** (prohibit direct use of member address)
- [ ] FOR/AGAINST/ABSTAIN voting options
- [ ] Vote status display for each member
- [ ] Wallet connection required message shown before voting options

### ⚙️ Execution System
- [ ] Execution open to anyone (no permission checks)
- [ ] Execution conditions properly validated (executableLimitTimestamp check)
- [ ] Execution condition check priority order implemented correctly
- [ ] Voting in progress check takes priority over other conditions
- [ ] NO_CONSENSUS status prevents execution
- [ ] Execution period expiration handled
- [ ] Vote approval validation (countingYes > countingNo)
- [ ] Already executed status check
- [ ] Execution button only shown when conditions met
- [ ] Appropriate error messages for each execution failure case
- [ ] Executed status properly displayed

### 🎨 UI/UX Requirements
- [ ] **MetaMask-only wallet connection** (Connect/Disconnect buttons)
- [ ] Network selector (Mainnet/Sepolia) with automatic switching
- [ ] Current contract addresses display (chain-aware)
- [ ] Loading states for all async operations
- [ ] Error states and error handling
- [ ] Transaction progress indicators
- [ ] Responsive design for mobile/desktop

### 🛠️ Technical Quality
- [ ] No hydration mismatch errors
- [ ] No hook ordering issues
- [ ] No console errors in browser
- [ ] TypeScript compilation without errors
- [ ] All promises properly handled with error boundaries
- [ ] BigInt() constructor usage (no BigInt literals)
- [ ] Proper type casting through unknown
- [ ] Suspense boundaries correctly implemented
- [ ] RPC call optimization (no excessive requests)
- [ ] Test program created and all functionality verified

### 🚀 Production Readiness
- [ ] Build command succeeds without errors
- [ ] Development server starts without issues
- [ ] All contract functions use correct ABIs
- [ ] Transaction states properly managed
- [ ] All edge cases handled
- [ ] English UI labels throughout
- [ ] Performance optimization (multicall, caching)
- [ ] Error boundaries implemented
- [ ] Loading states for all async operations
- [ ] Mobile responsive design

## 🎯 Implementation Verification Commands

After implementation, run these commands to verify everything works:

```bash
# Install dependencies
npm install

# Check for build errors
npm run build

# Start development server
npm run dev

# Verify app loads at http://localhost:3000 or 3001
```

## 🔍 Debugging & Troubleshooting Guide

### Common Issues and Solutions

**1. BigInt Literal Errors:**
```typescript
// ❌ Error: BigInt literals are not available when targeting lower than ES2020
const agendaId = 0n

// ✅ Solution: Use BigInt constructor
const agendaId = BigInt(0)
```

**2. Hydration Mismatch:**
```typescript
// ❌ Error: Text content does not match server-rendered HTML
const [data, setData] = useState()

// ✅ Solution: Use Suspense and client-only rendering
'use client'
export default function Component() {
  // Client-side logic
}
```

**3. RPC Rate Limiting:**
```typescript
// ❌ Problem: Too many RPC calls
const { data } = useReadContract({
  refetchInterval: 1000 // Causes excessive calls
})

// ✅ Solution: Manual refresh only
const { data, refetch } = useReadContract({
  refetchOnWindowFocus: false
})
```

**4. TypeScript Compilation Errors:**
```typescript
// ❌ Problem: Type casting issues
const data = result as AgendaData

// ✅ Solution: Cast through unknown
const data = result as unknown as AgendaData
```

**5. MetaMask Hydration Issues:**
```typescript
// ❌ Problem: MetaMask detection during SSR causes hydration mismatch
const isMetaMaskInstalled = !!window.ethereum?.isMetaMask

// ✅ Solution: Client-side only detection with useEffect
const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
  setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
}, [])

// Only render MetaMask-specific UI after client hydration
{isClient && isMetaMaskInstalled && (
  // MetaMask-specific content
)}
```

**6. Member Loading Infinite Loop:**
```typescript
// ❌ Problem: Member loading stuck indefinitely
const isLoading = !maxMemberResult ||
  (maxMember > 0 && memberResultsLoading) ||
  (memberAddresses.length > 0 && candidateInfoLoading && !candidateInfoResults) ||
  (candidateContracts.length > 0 && managerResultsLoading && !managerResults)

// ✅ Solution: Add fallback completion logic
const hasAnyData = members.length > 0
const shouldForceComplete = hasAnyData || (maxMember === 0)
const finalIsLoading = shouldForceComplete ? false : isLoading

return {
  isLoading: finalIsLoading,
  // other data...
}
```

**7. JSX Conditional Rendering Syntax Errors:**
```typescript
// ❌ Problem: Incorrect closing tags in conditional rendering
{membersDebug && (
  <div>
    <div>Debug info</div>
  </div>
)}

// ✅ Solution: Proper conditional rendering syntax
{membersDebug && (
  <div>
    <div>Debug info</div>
  </div>
)}
```

### Performance Monitoring

**Check RPC Call Count:**
- Open browser DevTools → Network tab
- Filter by "Fetch/XHR"
- Monitor contract call frequency
- Ensure no excessive polling

**Memory Usage:**
- Monitor React DevTools → Profiler
- Check for memory leaks in useEffect
- Verify proper cleanup in unmount

### Testing Strategy

**IMPORTANT: After implementing the main application, create a separate test program to verify all functionality.**

**Test Program Requirements:**
- Create a dedicated test application in `generated-apps/test-agenda-manager/`
- Test all contract interactions and UI components
- Verify multicall functionality and error handling
- Test wallet connection and transaction flows
- Validate all edge cases and error conditions

**Testing Checklist:**
- [ ] Unit tests for utility functions (type casting, status conversion)
- [ ] Component tests with mocked wagmi hooks
- [ ] Integration tests for multicall and complex logic
- [ ] E2E tests for complete user workflows
- [ ] Performance tests for RPC call optimization
- [ ] Error handling tests for all failure scenarios

**Test Dependencies:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest @playwright/test
```

**Test Scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Checklist Verification
After completing the app, be sure to check each item in the following checklist:

- [ ] Verify that all files are created correctly
- [ ] Verify that all required dependencies are included in package.json
- [ ] Verify that the app runs without errors with npm install && npm run dev
- [ ] **Verify that MetaMask-only wallet connection works properly**
- [ ] Verify that agenda search and navigation works
- [ ] Verify that agenda details are displayed accurately
- [ ] Verify that real-time status updates work
- [ ] Verify that voting functionality works properly
- [ ] Verify that execution functionality works properly
- [ ] Verify that execution condition validation works correctly (execution period, NO_CONSENSUS status, etc.)
- [ ] Verify that execution condition check order is implemented correctly (voting in progress > execution period expired > other conditions)
- [ ] Verify that execution button is hidden and appropriate message is displayed when voting is in progress
- [ ] Verify that appropriate error messages are displayed in impossible execution situations
- [ ] Verify that manual refresh button works
- [ ] Verify that error handling and loading states are implemented appropriately
- [ ] Verify that UI is responsive and user-friendly
