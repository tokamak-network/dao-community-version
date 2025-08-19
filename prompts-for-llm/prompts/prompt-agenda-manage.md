# 🏛️ Tokamak DAO Agenda Management App Prompt (Production-Ready)

## 📋 Complete Implementation Request

```
Please implement a complete Tokamak DAO agenda management application that combines agenda detail viewing, voting, and execution functionalities based on Next.js 15 + wagmi v2 according to all the requirements below.

**PROJECT SETUP: Create the project in a `generated-app` folder with a project-specific name (e.g., `generated-app/tokamak-dao-agenda-app` or a name based on the specific implementation requirements).**

**IMPORTANT: All UI text, labels, buttons, and messages must be in English.**

**CRITICAL: This prompt is based on actual production implementation experience and includes all real-world edge cases, bugs, and solutions encountered during development.**

---

## 🎯 Tech Stack
- Next.js 15 (App Router)
- TypeScript
- wagmi v2 + viem v2
- @tanstack/react-query v5
- TailwindCSS (with inline styles)

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
- Voting start/end dates (calculated from notice end + voting period)
- Executable deadline (executableLimitTimestamp)
- Execution date (executedTimestamp, executed boolean)
- Voting results (countingYes, countingNo, countingAbstain) with progress bars
- Status/result (status, result → English text conversion)
- Voter list (voters array) with Etherscan links

### 3. Real-time Status Information
**Committee.currentAgendaStatus(id) call results:**
- Current agenda status (agendaStatus) → English text conversion with status mapping
- Current agenda result (agendaResult) → English text conversion with result mapping
- Display only when meaningful data available (not during VOTING status without actual votes)
- **CRITICAL: Status and result values must be interpreted and displayed in English, not raw numbers**

**Status Mapping (agendaStatus):**
- 0: "Pending"
- 1: "Notice Period"
- 2: "Voting"
- 3: "Voting Complete"
- 4: "Executable"
- 5: "Executed"
- 6: "Expired"

**Result Mapping (agendaResult):**
- 0: "Pending"
- 1: "Approved"
- 2: "Rejected"
- 3: "Invalid"
- 4: "Expired"

### 4. Committee Member Management System (CORRECTED)
**CRITICAL: The getCommitteeMembers function does NOT exist. Use individual calls:**

```typescript
// Get total number of committee members
const { data: maxMember } = useReadContract({
  address: contracts?.committee as `0x${string}`,
  abi: COMMITTEE_ABI,
  functionName: 'maxMember',
  query: { enabled: !!contracts?.committee }
});

// Get individual member addresses (0, 1, 2)
const { data: member0Address } = useReadContract({
  address: contracts?.committee as `0x${string}`,
  abi: COMMITTEE_ABI,
  functionName: 'members',
  args: [BigInt(0)],
  query: { enabled: !!contracts?.committee }
});

// Get member info for each address
const { data: member0Info } = useReadContract({
  address: contracts?.committee as `0x${string}`,
  abi: COMMITTEE_ABI,
  functionName: 'candidateInfos',
  args: [member0Address as `0x${string}`],
  query: { enabled: !!member0Address && member0Address !== '0x0000000000000000000000000000000000000000' }
});

// Get manager address directly from member CA contract
const { data: member0Manager } = useReadContract({
  address: member0Address as `0x${string}`,
  abi: CANDIDATE_ABI,
  functionName: 'manager',
  query: {
    enabled: !!member0Address && member0Address !== '0x0000000000000000000000000000000000000000',
    retry: false
  }
});
```

**User Membership Detection:**
```typescript
const userMemberships = useMemo(() => {
  if (!address) return [];

  const memberships: CommitteeMember[] = [];
  const memberData = [
    { address: member0Address, info: member0Info, manager: member0Manager },
    { address: member1Address, info: member1Info, manager: member1Manager },
    { address: member2Address, info: member2Info, manager: member2Manager }
  ];

  memberData.forEach((member, index) => {
    if (!member.address || !member.info) return;

    const memberAddress = member.address.toLowerCase();
    const userAddress = address.toLowerCase();
    const candidateContract = member.info[0];
    const managerAddress = (typeof member.manager === 'string' ? member.manager : '')?.toLowerCase() || '';

    // User can vote if they are:
    // 1. The member address directly OR
    // 2. The manager of the member CA
    if (memberAddress === userAddress ||
        (managerAddress && managerAddress !== '0x0000000000000000000000000000000000000000' &&
         managerAddress === userAddress)) {
      memberships.push({
        name: `Member ${memberships.length + 1}`,
        creationAddress: member.address,
        manager: (typeof member.manager === 'string' ? member.manager : member.address),
        candidateContract: candidateContract
      });
    }
  });

  return memberships;
}, [address, member0Address, member1Address, member2Address, member0Info, member1Info, member2Info, member0Manager, member1Manager, member2Manager]);
```

### 5. Voting Functionality (CORRECTED)
**CRITICAL: Vote status must be checked using AgendaManager.getVoteStatus, NOT Candidate.hasVoted:**

```typescript
// WRONG: Do not use this
// candidateContract.hasVoted(agendaId, managerAddress)

// CORRECT: Use AgendaManager.getVoteStatus with MEMBER address (not manager address)
const { data: member0VoteStatus, refetch: refetchMember0Vote } = useReadContract({
  address: contracts?.agendaManager as `0x${string}`,
  abi: AGENDA_MANAGER_ABI,
  functionName: 'getVoteStatus',
  args: [BigInt(agendaId || 0), userMemberships[0]?.creationAddress as `0x${string}`],
  query: { enabled: !!contracts?.agendaManager && !!userMemberships[0] && agendaId !== null, refetchInterval: 5000 }
});
```

**Local State Management for Real-time Updates:**
```typescript
// Use agenda-specific keys to avoid conflicts between different agendas
const [localVotedMemberships, setLocalVotedMemberships] = useState<Set<string>>(new Set());

// After successful vote transaction
useEffect(() => {
  if (voteReceipt && selectedMember) {
    // Immediately update local state for UI responsiveness
    setLocalVotedMemberships(prev => {
      const newSet = new Set(prev);
      const localKey = `${agendaId}-${selectedMember.member.creationAddress}`;
      newSet.add(localKey);
      return newSet;
    });

    // Refetch blockchain data after delay
    setTimeout(() => {
      refetchMemberVote();
    }, 2000);
  }
}, [voteReceipt, selectedMember, agendaId]);
```

**Vote Status Check Priority:**
```typescript
// Check voting period status BEFORE checking permissions
if (votingStatus.status === 'VOTING_NOT_STARTED') {
  // Show voting not started message
} else if (votingStatus.status === 'VOTING_ENDED') {
  // Handle different end states (executed, approved, rejected)
} else if (!isEligibleVoter) {
  // Show no permission message
} else {
  // Show voting interface
}
```

**Transaction State UI Management:**
```typescript
// During voting transaction, hide voting options and show progress
{isVoting || isVoteConfirming ? (
  <div className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="flex items-center justify-center">
      <svg className="animate-spin h-4 w-4 text-orange-600">...</svg>
      <span className="text-orange-800 font-medium text-sm">
        {isVoting ? '🗳️ 투표 중...' : '⏳ 블록체인 확인 중...'}
      </span>
    </div>
    <p className="text-xs text-orange-600 mt-1 text-center">
      잠시만 기다려 주세요. 트랜잭션이 처리되고 있습니다.
    </p>
  </div>
) : !showVoteOptions ? (
  <button onClick={() => setShowVoteOptions(true)}>Vote</button>
) : null}
```

### 6. Execution Functionality (CORRECTED)
**CRITICAL: Execution is open to ANYONE, not just committee members:**

```typescript
// WRONG: Don't check user permissions
// const canExecute = await committee.canExecute(userAddress);

// CORRECT: Anyone can execute approved agendas
const canExecute = true; // Anyone can execute approved agendas
```

**ExecutionSection Display Logic:**
```typescript
const showExecutionSection = useMemo(() => {
  if (!agendaData) return false;

  const votingTimes = safe.calculateVotingTimestamps(agendaData);
  const totalVotes = Number(agendaData.countingYes) + Number(agendaData.countingNo) + Number(agendaData.countingAbstain);
  const allMembersVoted = totalVotes >= 3; // Assuming 3 committee members max
  const hasVoters = (agendaData.voters || []).length > 0;

  // Show execution section when:
  // 1. Voting has ended naturally (time-based) OR
  // 2. All members have voted (early completion) OR
  // 3. There are voters (voting has started) AND agenda is accepted/executed
  const votingEffectivelyComplete = votingTimes.hasEnded || allMembersVoted || hasVoters;
  const isAccepted = agendaData.result === 1; // ACCEPT

  return votingEffectivelyComplete && (isAccepted || agendaData.executed);
}, [agendaData]);
```

**Wallet Connection Priority Check:**
```typescript
// Check wallet connection BEFORE showing execution button
{isExecuting || isExecuteConfirming ? (
  // Show execution progress
  <div className="bg-orange-50">🚀 실행 중...</div>
) : agendaData.executed ? (
  // Show execution completed
  <div className="bg-green-50">✅ 실행함</div>
) : !isConnected ? (
  // Show wallet connection required FIRST
  <div className="bg-yellow-50">
    🔗 지갑 연결이 필요합니다
    Please connect your wallet first to execute the agenda.
  </div>
) : (
  // Show execution button
  <button>🚀 Execute Agenda</button>
)}
```

**Early Execution (When Voting Completes Before Time Ends):**
```typescript
// If voting is effectively complete, allow immediate execution
const votingEffectivelyComplete = votingTimes.hasEnded || allMembersVoted;
const executionStartsIn = votingEffectivelyComplete ? 0 : Math.max(0, canExecuteAfter - now);
```

### 7. Manual Refresh Functionality
- Refresh button in UI header with loading state
- Refreshes agendaData, currentStatus, and numAgendas in parallel
- Success/error feedback for refresh operations
- Manual refresh after voting/execution completion

### 8. Advanced UI Features (Production-Ready)
- Vote progress visualization with real-time updates
- Timeline display with current stage highlighting
- Voter address list with Etherscan links (network-aware)
- Status-based color coding with Korean labels
- Transaction status tracking with progress indicators
- Conditional action buttons based on agenda and connection state

## 📊 Required Contract Functions and ABIs (CORRECTED)

### Committee Contract Functions
```typescript
export const COMMITTEE_ABI = [
  // Get total number of committee members
  {
    "inputs": [],
    "name": "maxMember",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get member address by index
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "members",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get candidate info for member address
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
  // Execute agenda (open to anyone)
  {
    "inputs": [{ "internalType": "uint256", "name": "agendaId", "type": "uint256" }],
    "name": "executeAgenda",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Check execution permission (for debugging only - not used for actual permission)
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "canExecute",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Get current agenda status
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "currentAgendaStatus",
    "outputs": [
      { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
      { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
```

### Candidate Contract Functions (For Voting and Manager Query)
```typescript
export const CANDIDATE_ABI = [
  // Get manager address from CA contract
  {
    "inputs": [],
    "name": "manager",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Cast vote function
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
  },
  // Check if member has voted (DEPRECATED - use AgendaManager.getVoteStatus instead)
  {
    "inputs": [
      { "internalType": "uint256", "name": "_agendaID", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
```

### AgendaManager Contract Functions (CORRECTED)
```typescript
export const AGENDA_MANAGER_ABI = [
  // Get total number of agendas
  {
    "inputs": [],
    "name": "numAgendas",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Get agenda details
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
  // CRITICAL: Use this function to check vote status (not Candidate.hasVoted)
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
] as const;
```

## 🎨 UI/UX Requirements (Production-Ready)

### Header Section
- Wallet connection status with Connect/Disconnect buttons
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
   - Status badges with Korean labels and color coding
   - Timeline section with calculated voting start/end times
   - Vote results with animated progress bars
   - Real-time status section (only when meaningful data)

3. **Voting Section** (Priority-Based Conditional Display)
   ```typescript
   // CRITICAL: Check in this exact order
   if (!isConnected) {
     return <WalletConnectionRequired />;
   }
   if (votingStatus.status === 'VOTING_NOT_STARTED') {
     return <VotingNotStarted />;
   }
   if (votingStatus.status === 'VOTING_ENDED') {
     if (agendaData.executed) {
       return <AgendaExecuted />; // "Agenda execution completed!"
     }
     if (isWaitingExec && isAccepted) {
       return <VotingComplete />; // "Voting completed - Agenda approved!"
     }
     if (agendaData.result === 0) {
       return <AgendaRejected />; // "Voting completed - Agenda rejected"
     }
     return <VotingEnded />; // Generic voting ended
   }
   if (!isEligibleVoter) {
     return <NoVotingPermission />;
   }
   if (availableMembers.length === 0) {
     return <AllMembersVoted />;
   }
   return <ActiveVotingInterface />;
   ```

4. **Member Selection UI** (When Multiple Memberships)
   ```typescript
   // Show all members, disable voted ones
   {memberVoteStatuses.map((memberStatus, index) => {
     const isVoted = memberStatus.hasVoted;
     const isSelected = !isVoted && availableMembers.findIndex(am => am.index === memberStatus.index) === selectedMemberIndex;

     return (
       <button
         onClick={() => !isVoted && setSelectedMemberIndex(availableIndex)}
         disabled={isVoted}
         className={`${isVoted ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-300'}`}
       >
         <div className="font-medium flex items-center">
           {isVoted && <span className="mr-2">✅</span>}
           {memberStatus.member.name}
           {isVoted && <span className="ml-2 text-xs text-green-600">(투표 완료)</span>}
         </div>
         {/* Manager address display with Etherscan link */}
         {memberStatus.member.manager !== memberStatus.member.creationAddress && (
           <div className="text-xs text-blue-600">
             Manager: <EtherscanLink address={memberStatus.member.manager} />
           </div>
         )}
       </button>
     );
   })}
   ```

5. **Transaction State Management**
   ```typescript
   // Voting transaction states
   {isVoting || isVoteConfirming ? (
     <TransactionProgress type="voting" />
   ) : !showVoteOptions ? (
     <button onClick={() => setShowVoteOptions(true)}>Vote</button>
   ) : (
     <VoteOptionsPanel />
   )}

   // Execution transaction states
   {isExecuting || isExecuteConfirming ? (
     <TransactionProgress type="execution" />
   ) : agendaData.executed ? (
     <ExecutionCompleted />
   ) : !isConnected ? (
     <WalletConnectionRequired />
   ) : (
     <ExecutionButton />
   )}
   ```

6. **ExecutionSection** (Comprehensive Display Logic)
   - **Show when**: Voting effectively complete AND (accepted OR executed)
   - Execution timing information with Korean labels
   - Dynamic status indicators (green/yellow/red dots)
   - Early completion detection ("모든 멤버 투표 완료")
   - Wallet connection priority check
   - Transaction progress indicators

7. **Real-time Updates Without Page Reload**
   - Local state management for immediate UI feedback
   - Blockchain data refetch with delay after transaction
   - Manual refresh button for user-initiated updates
   - Auto-refresh intervals for vote status (5 seconds)

### Korean UI Labels and Messages

```typescript
export const MESSAGES = {
  // Voting Section
  WALLET_CONNECTION_REQUIRED: "🔗 Wallet connection required. Please connect your wallet to vote.",
  VOTING_NOT_STARTED: "⏰ Voting has not started yet.",
  VOTING_ENDED: "⏰ Voting period has ended.",
  AGENDA_EXECUTED: "✅ Agenda execution completed!",
  AGENDA_APPROVED: "✅ Voting completed - Agenda approved!",
  AGENDA_REJECTED: "❌ Voting completed - Agenda rejected",
  NO_VOTING_PERMISSION: "❌ You don't have voting permission. You are not a committee member or manager of the address.",
  ALL_MEMBERS_VOTED: "🗳️ All committee members have completed voting.",

  // Transaction States
  VOTING_IN_PROGRESS: "🗳️ Voting in progress...",
  BLOCKCHAIN_CONFIRMING: "⏳ Confirming on blockchain...",
  EXECUTING: "🚀 Executing...",
  TRANSACTION_WAIT: "Please wait. Transaction is being processed.",

  // Execution Section
  EXECUTION_READY: "✅ Execution ready! The agenda can be executed.",
  EXECUTION_COMPLETED: "✅ Executed",
  EXECUTION_WALLET_REQUIRED: "🔗 Wallet connection required. Please connect your wallet first to execute the agenda.",
  VOTING_PERIOD_REMAINING: "💡 Voting period still remains but voting is complete and execution is possible.",

  // Vote Types (0=ABSTAIN, 1=FOR, 2=AGAINST)
  VOTE_FOR: "For",      // vote = 1
  VOTE_AGAINST: "Against", // vote = 2
  VOTE_ABSTAIN: "Abstain", // vote = 0

  // Status Labels
  STATUS_VOTING: "Voting",
  STATUS_WAITING_EXEC: "Waiting for Execution",
  STATUS_EXECUTED: "Executed",
  STATUS_ENDED: "Ended"
} as const;
```

## 🔧 Critical Implementation Notes (Production Lessons)

### 1. Hydration Error Prevention
```typescript
// Always use client-side only rendering for wallet-dependent components
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

// Conditional rendering to prevent hydration mismatch
{isClient ? (
  <WalletDependentComponent />
) : (
  <div>Loading...</div>
)}
```

### 2. Hook Ordering Issues
```typescript
// WRONG: Using hooks inside map functions
committeeMembers.map(member => {
  const { data } = useReadContract(...); // This will cause hook order errors
});

// CORRECT: Fixed number of hooks
const { data: member0VoteStatus } = useReadContract({...});
const { data: member1VoteStatus } = useReadContract({...});
const { data: member2VoteStatus } = useReadContract({...});
```

### 3. Network-Aware Etherscan Links
```typescript
const getEtherscanUrl = (address: string, chainId: number) => {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
  return `${baseUrl}/address/${address}`;
};
```

### 4. Timestamp Calculation Edge Cases
```typescript
export const safe = {
  calculateVotingTimestamps: (agendaData: any) => {
    const now = Math.floor(Date.now() / 1000);
    const createdTimestamp = Number(agendaData.createdTimestamp);
    const noticeEndTimestamp = Number(agendaData.noticeEndTimestamp);
    const votingPeriod = Number(agendaData.votingPeriodInSeconds);
    let votingStartTimestamp = Number(agendaData.votingStartedTimestamp);
    let votingEndTimestamp = Number(agendaData.votingEndTimestamp);

    // Handle case when voting hasn't started yet (timestamps are 0)
    if (votingStartTimestamp === 0 || votingStartTimestamp < createdTimestamp) {
      votingStartTimestamp = noticeEndTimestamp;
    }

    if (votingEndTimestamp === 0 || votingEndTimestamp < votingStartTimestamp) {
      votingEndTimestamp = votingStartTimestamp + votingPeriod;
    }

    return {
      votingStartTimestamp,
      votingEndTimestamp,
      hasStarted: votingStartTimestamp <= now,
      hasEnded: votingEndTimestamp <= now,
      canVote: noticeEndTimestamp <= now && votingEndTimestamp > now
    };
  }
};
```

### 5. Real-time UI Updates Strategy
```typescript
// Immediate local state update for responsiveness
useEffect(() => {
  if (voteReceipt && selectedMember) {
    // 1. Update local state immediately
    setLocalVotedMemberships(prev => {
      const newSet = new Set(prev);
      const localKey = `${agendaId}-${selectedMember.member.creationAddress}`;
      newSet.add(localKey);
      return newSet;
    });

    // 2. Refetch blockchain data after delay
    setTimeout(() => {
      refetchVoteStatus();
    }, 2000);

    // 3. Reset UI state
    setShowVoteOptions(false);
  }
}, [voteReceipt, selectedMember, agendaId]);
```

## 📦 Required Dependencies (Tested and Working)
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
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

## 🚨 Known Issues and Solutions

### Issue 1: "getCommitteeMembers is not a function"
**Solution**: Use individual contract calls (maxMember, members, candidateInfos)

### Issue 2: Vote status not updating after transaction
**Solution**: Use AgendaManager.getVoteStatus with member address (not manager address)

### Issue 3: ExecutionSection not showing after voting completes
**Solution**: Check for early voting completion (allMembersVoted) in addition to time-based completion

### Issue 4: Transaction buttons appearing during transaction progress
**Solution**: Implement proper transaction state UI with progress indicators

### Issue 5: Hydration mismatch errors
**Solution**: Use client-side only rendering with isClient state

### Issue 6: Hook order errors in member iteration
**Solution**: Use fixed number of hooks instead of dynamic mapping

### Issue 7: One member vote marking all members as voted
**Solution**: Use agenda-specific local state keys: `${agendaId}-${memberAddress}`

### Issue 8: Execution permission denied
**Solution**: Remove permission checks - execution is open to anyone

### Issue 9: Manager addresses showing as N/A
**Solution**: Call manager() function directly on member CA contracts

### Issue 10: Incorrect voting period end message for executed agendas
**Solution**: Check execution status first in voting section display logic

## ✅ Complete Implementation Checklist

### 🏗️ Project Structure & Configuration
- [ ] Next.js 15 project with App Router structure
- [ ] TypeScript configuration (tsconfig.json)
- [ ] TailwindCSS setup (tailwind.config.ts, postcss.config.mjs)
- [ ] Package.json with all required dependencies
- [ ] Next.config.ts with webpack externals for pino-pretty

### 🔗 Web3 Integration
- [ ] wagmi v2 configuration with mainnet & sepolia
- [ ] Contract addresses properly defined for both networks
- [ ] All contract ABIs correctly implemented
- [ ] React Query provider setup
- [ ] Client-side only rendering to prevent hydration errors

### 📋 Core Features Implementation
- [ ] URL parameter support for agenda ID (?id=N)
- [ ] Agenda ID input field with validation (0 to maximum agenda number)
- [ ] Direct agenda ID entry with Enter key support
- [ ] Previous/Next agenda navigation buttons with boundary handling
- [ ] "Go" button for direct navigation
- [ ] Total agenda count display and validation
- [ ] Agenda details display (creator, status, timestamps, vote results)
- [ ] Real-time status display with English interpretation (not raw numbers)
- [ ] Status mapping implementation (0-6: Pending/Notice/Voting/Complete/Executable/Executed/Expired)
- [ ] Result mapping implementation (0-4: Pending/Approved/Rejected/Invalid/Expired)
- [ ] Vote result visualization with progress bars
- [ ] Voter list with Etherscan links
- [ ] Manual refresh button functionality

### 🗳️ Voting System
- [ ] Committee member detection using individual contract calls
- [ ] Vote status checked via AgendaManager.getVoteStatus (not Candidate.hasVoted)
- [ ] Fixed number of hooks (no dynamic mapping)
- [ ] FOR/AGAINST/ABSTAIN voting options
- [ ] Vote status display for each member
- [ ] Local state updates with agenda-specific keys
- [ ] Wallet connection required message shown before voting options

### ⚙️ Execution System
- [ ] Execution open to anyone (no permission checks)
- [ ] Execution conditions properly validated (FOR > AGAINST votes)
- [ ] Execution button only shown when conditions met
- [ ] Executed status properly displayed
- [ ] Wallet connection required message shown before execution button

### 🎨 UI/UX Requirements
- [ ] Wallet connection status with Connect/Disconnect buttons
- [ ] Network selector (Mainnet/Sepolia) with automatic switching
- [ ] Current contract addresses display (chain-aware)
- [ ] Loading states for all async operations
- [ ] Error states and error handling
- [ ] Transaction progress indicators
- [ ] Confirmation dialogs for actions
- [ ] Invalid ID warning with proper range display
- [ ] Responsive design for mobile/desktop (optional)

### 🔄 Real-time Updates
- [ ] Auto-refresh intervals (5 seconds for vote data)
- [ ] Manual refresh functionality
- [ ] Local state management for immediate UI feedback
- [ ] Blockchain data refetch after transactions
- [ ] No page reload required for updates

### 🌐 Network & Contract Integration
- [ ] Network-aware Etherscan links (mainnet vs sepolia)
- [ ] Proper contract address resolution by chainId
- [ ] Fallback handling for unsupported networks
- [ ] Transaction hash display with Etherscan links

### 🛠️ Technical Quality
- [ ] No hydration mismatch errors
- [ ] No hook ordering issues
- [ ] No console errors in browser
- [ ] Clean build without warnings (except lockfile warning)
- [ ] TypeScript compilation without errors
- [ ] All promises properly handled with error boundaries

### 🚀 Production Readiness
- [ ] Build command succeeds without errors
- [ ] Development server starts without issues
- [ ] All contract functions use correct ABIs
- [ ] Transaction states properly managed
- [ ] All edge cases handled (0 agendas, loading states, etc.)
- [ ] English UI labels throughout (as specified in MESSAGES)
- [ ] pino-pretty module resolution fixed in webpack config

### 🧪 Testing & Verification
- [ ] App loads without JavaScript errors
- [ ] Wallet connection works properly
- [ ] Network switching functions correctly
- [ ] Agenda navigation works (if agendas exist)
- [ ] Vote display updates in real-time
- [ ] Transaction flows complete successfully
- [ ] All UI states render correctly
- [ ] Mobile responsiveness verified (optional)

---

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

## ✅ Final Verification Checklist

- [ ] ✅ App builds successfully without errors
- [ ] ✅ Development server starts without issues
- [ ] ✅ No console errors when loading the app
- [ ] ✅ Wallet connection UI appears and functions
- [ ] ✅ Network information displays correctly
- [ ] ✅ Contract addresses show for supported networks
- [ ] ✅ Agenda data loads (or shows "no agendas" message)
- [ ] ✅ All UI components render without layout issues
- [ ] ✅ Responsive design works on different screen sizes (optional)
- [ ] ✅ All transaction flows have proper loading states

**🎉 SUCCESS CRITERIA: All items checked = Complete working DAO application**

This comprehensive checklist ensures NO requirements are missed and the application works perfectly on first implementation.
```