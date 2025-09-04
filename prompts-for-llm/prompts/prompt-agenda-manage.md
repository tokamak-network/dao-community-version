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
**지갑 연결은 MetaMask만 지원:**
- MetaMask 전용 connector 사용
- 다른 지갑 연결 옵션 제공하지 않음
- MetaMask 설치 및 연결 안내 메시지 포함

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
- **Network selection and switching**: 지갑 연결 없이도 네트워크 선택 가능

**🔐 WALLET CONNECTION REQUIRED (Write Operations):**
- Voting transactions
- Agenda execution
- All state-changing contract interactions

**🔗 MetaMask 전용 지갑 연결:**
- **지갑 연결은 MetaMask만 지원**
- MetaMask가 설치되지 않은 경우 설치 안내 메시지 표시
- MetaMask가 설치되었지만 연결되지 않은 경우 연결 버튼 표시
- 다른 지갑 연결 옵션은 제공하지 않음

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
  - Voting start/end dates (calculated from notice end + voting period) 투표시작을 했을때만 표시된다. 공지종료시간뒤에는 이시간들이 없어도 투표가 가능하다.
  - Executable deadline (executableLimitTimestamp) 실행가능 종료시간이 지나면 실행이 불가하다.
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
**DAO Committee Version별 상태 확인:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus(id)` 함수 사용 가능
- 실시간 상태와 결과 반환: `[agendaResult, agendaStatus]`

**DAO Committee v1:**
- `Committee.currentAgendaStatus(id)` 함수 없음
- `AgendaManager.agendas(id)`의 status 필드만 사용

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
**투표 시점별 투표 가능 여부 확인:**

**투표가 아직 시작되지 않았을 때 (공지기간 종료 후, 투표시작시간 = 0):**
- `Committee.members(index)` 배열을 보고
- 각 member의 `OperatorManager(member address).manager()` 주소를 확인
- 연결된 지갑 주소가 member 주소 또는 manager 주소와 일치하는지 확인

**투표가 이미 시작되었을 때 (투표시작시간 > 0, Voting Period):**
- `AgendaManager.agendas().voters` 배열을 보고
- 각 voter의 `OperatorManager(voter address).manager()` 주소를 확인
- 연결된 지갑 주소가 voter 주소 또는 manager 주소와 일치하는지 확인

**투표 자격 조건:**
1. **Committee Member 직접 투표**: 사용자의 지갑 주소가 Committee member 주소와 일치
2. **Manager를 통한 투표**: 사용자의 지갑 주소가 Committee member의 manager 주소와 일치 (단, manager 주소가 `0x0000000000000000000000000000000000000000`이 아닌 경우)

**투표 가능한 시점 조건:**
1. **공지 기간 종료**: `noticeEndTimestamp` 이후
2. **아직 실행되지 않음**: `executed`가 `false`
3. **버전별 투표 상태 확인**:
   - **DAO Committee v2**: `Committee.currentAgendaStatus(id)`의 `agendaStatus`가 2 (Voting)일 때
   - **DAO Committee v1**: `AgendaManager.agendas(id)`의 `status`가 2 (Voting)일 때

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
**CRITICAL: 투표 함수는 member의 candidateContract를 통해 호출해야 함**

**올바른 투표 함수 호출 방법:**
```typescript
// ✅ CORRECT: candidateContract 주소를 사용하여 castVote 함수 호출
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
    address: selectedMemberInfo.candidateContract as `0x${string}`,  // ✅ candidateContract 주소 사용
    abi: CANDIDATE_ABI,
    functionName: 'castVote',
    args: [BigInt(agendaId), BigInt(voteType), comment],
  })
}
```

**❌ 잘못된 구현 (피해야 할 방법):**
```typescript
// ❌ WRONG: member 주소를 직접 사용
writeContract({
  address: selectedMember as `0x${string}`,  // ❌ member 주소 직접 사용
  abi: CANDIDATE_ABI,
  functionName: 'castVote',
  args: [BigInt(agendaId), BigInt(voteType), comment],
})
```

**투표 함수 호출 흐름:**
1. **사용자가 멤버 선택** → `selectedMember` (member 주소)
2. **`members.find()`** → 해당 멤버의 `candidateContract` 주소 찾기
3. **`writeContract()`** → `candidateContract` 주소로 `castVote` 함수 호출
4. **올바른 투표 실행** → 매니저가 아닌 **멤버의 candidateContract**를 통해 투표

**필요한 데이터 구조:**
```typescript
interface MemberInfo {
  address: `0x${string}`           // member 주소
  candidateContract: `0x${string}` // candidateContract 주소 (투표 함수 호출용)
  hasVoted: boolean
  vote: number
  managerAddress?: `0x${string}`   // manager 주소
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
- **이미 투표한 멤버는 다시 투표 불가**: `AgendaManager.getVoteStatus()`로 확인된 이미 투표한 멤버는 선택 드롭다운에서 제외
- **투표 상태 표시**: 각 멤버별로 "Voted" 또는 "Not voted" 상태를 명확히 표시
- **중복 투표 방지**: 동일한 멤버에 대해 중복 투표 시도 시 적절한 에러 메시지 표시

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
- **투표 화면은 항상 표시되어야 함**: 투표 조건이 맞지 않아도 투표 섹션은 항상 보여줘야 함
- **투표 가능한 사람들을 항상 표시**: 누가 투표할 수 있는지 항상 보여줘야 함
- **지갑 연결과 투표 권한 확인**:
  - **지갑 연결 없이도 투표자 정보 조회 가능**: 모든 투표자 정보는 지갑 연결과 관계없이 항상 표시
  - **지갑 연결 시 투표 권한 확인**: 지갑이 연결되면 해당 지갑의 투표 권한을 확인하여 "Direct", "You", "No permission" 등으로 표시
  - **투표 권한 표시 로직**:
    - 지갑 주소가 member 주소와 일치하면 "Direct" 표시
    - 지갑 주소가 manager 주소와 일치하면 "You" 표시
    - 그 외의 경우 "No permission" 표시
- **투표자 정보 표시 레이아웃**:
  - **투표자 주소와 매니저 주소를 가로로 표시**: 각 투표자 카드에서 member 주소와 manager 주소를 가로로 배치
  - **투표자 주소**: 상단에 큰 글씨로 표시 (Etherscan 링크 포함)
  - **매니저 주소**: 하단에 작은 글씨로 표시 (Etherscan 링크 포함, 없으면 "No manager" 표시)
  - **투표 권한 표시**: 오른쪽에 "Direct", "You", "No permission" 등으로 표시
- **투표 조건에 따른 메시지 표시**:
  - 공지 기간이 끝나지 않았을 때: "Notice period not ended yet"
  - 이미 실행된 경우: "Agenda already executed"
  - 지갑이 연결되지 않은 경우: "Wallet connection required"
  - 투표 권한이 없는 경우: "No voting permission"
  - 모든 멤버가 투표한 경우: "All members voted"
- **투표 가능한 시점 확인**:
  - `noticeEndTimestamp` 이후부터 투표 가능
  - `executed`가 false인 경우에만 투표 가능
  - 투표 조건이 맞으면 투표 폼 표시, 아니면 적절한 메시지 표시

### 4. Execution System

#### 4.1 Execution Conditions
**CRITICAL: Execution is open to ANYONE, not just committee members**

**Execution Condition Check Priority (순서대로 확인):**
1. **투표 진행 중 확인** (highest priority)
   - DAO v2: `Committee.currentAgendaStatus(id)'s agendaStatus=2` (Voting)
   - DAO v1: `AgendaManager.agendas(id)'s status=2` (Voting)
   - → "⏳ Waiting for voting to complete" 메시지 표시

2. **이미 실행되었는지 확인**
   - `AgendaManager.agendas(id)'s executed=true`
   - → "✅ Executed" 메시지 표시

3. **실행 기간 만료 확인**
   - `executableLimitTimestamp > 0 && currentTime > executableLimitTimestamp`
   - → "⏰ Execution period has expired" 메시지 표시

4. **DAO 버전별 실행 조건 확인**
   - **DAO v2**: `Committee.currentAgendaStatus(id)'s agendaStatus=3` (WAITING_EXEC) 확인
   - **DAO v1**: `AgendaManager.agendas(id)'s status=3` (WAITING_EXEC) 확인
   - → 조건 만족 시 실행 버튼 표시

#### 4.2 Execution Function Implementation
**CRITICAL: 아젠다 실행은 Committee.executeAgenda(agendaId) 함수를 호출해야 함**

**✅ 올바른 실행 함수 호출 방법:**
```typescript
// ✅ CORRECT: Committee 주소를 사용하여 executeAgenda 함수 호출
writeContract({
  address: contracts.committee as `0x${string}`,  // ✅ Committee 주소 사용
  abi: COMMITTEE_ABI,
  functionName: 'executeAgenda',
  args: [BigInt(agendaId)],
})
```

**실행 함수 호출 흐름:**
1. **실행 조건 확인** → 위의 Execution Condition Check Priority 참조
2. **지갑 연결 확인** → MetaMask 연결 필요
3. **`writeContract()`** → `Committee` 주소로 `executeAgenda` 함수 호출
4. **아젠다 실행 완료** → 트랜잭션 성공 시 아젠다 상태 업데이트

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
- **지갑 연결 없이도 네트워크 선택 가능**: 네트워크 선택은 지갑 연결과 독립적으로 작동
- Automatic network detection
- Manual network selector
- Contract address updates based on network
- Network-specific configuration

#### 6.2 Contract Integration
**Contract Functions Used:**
- **AgendaManager:** numAgendas, agendas, getVoteStatus
- **Committee:** maxMember, members, candidateInfos, currentAgendaStatus, executeAgenda
- **AgendaManager:** numAgendas, agendas, getVoteStatus
- **Candidate:** manager, castVote

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
  - 투표시작일 : 안건 공지가 끝나고, 투표가능한 사람이 투표를 시작하면 그때가 투표시작일입니다.
  - 투표종료일: 투표시작일 + voting period
  - 아직 아무도 투표한사람이 없을때 초기값 0 입니다.
  - 투표는 안건공지가 끝나면 투표가능한 사람은 투표를 할 수 있습니다.
- Voting end dates (votingEndTimestamp)
  - 아직 아무도 투표한사람이 없을때 초기값 0 입니다.
- Executable deadline (executableLimitTimestamp)
  - 아직 아무도 투표한사람이 없을때 초기값 0 입니다.
- Execution date (executedTimestamp, executed boolean)
  - 아직 아무도 투표한사람이 없을때 초기값 0 입니다.
- Voting results (countingYes, countingNo, countingAbstain) with progress bars
- AgendaStatus status; 0:NONE, 1:NOTICE, 2:VOTING, 3:WAITING_EXEC, 4:EXECUTED, 5:ENDED
- AgendaResult result; 0:PENDING, 1:ACCEPT, 2:REJECT, 4:DISMISS
- Voter list (voters array) with Etherscan links

**DAO Committee v2 Agenda Memo Display:**
- `Committee.agendaMemo(agendaId)` 함수로 메모 정보 조회
- 아젠다 상세 내용에 "Agenda Memo" 섹션으로 표시
- **URL 링크 기능**: 메모 내용에 http/https URL이 포함된 경우 자동으로 클릭 가능한 링크로 변환
- 링크 클릭 시 새창에서 열림 (`target="_blank"`, `rel="noopener noreferrer"`)
- 링크 스타일: 파란색 텍스트, 호버 시 진한 파란색, 밑줄 표시

### 3. Real-time Status Information
**Committee.currentAgendaStatus(id) call results:**
- 이 함수는 다오버전 2에서만 제공되는 함수입니다.
- Current agenda status (agendaStatus) → English text conversion : 0=Pending, 1=Notice Period, 2=Voting, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA
- Current agenda result (agendaResult) → English text conversion : 0=Pending, 1=Approved, 2=Rejected, 3=Invalid, 4=NO_CONSENSUS, 5=NO_AGENDA

**DAO Committee v2 Agenda Memo Information:**
- `Committee.agendaMemo(agendaId)` 함수 사용 (DAO v2에서만 제공)
- Returns (string) - 아젠다 메모 정보
- 아젠다 상세 내용에 메모 정보 표시
- **URL 링크 기능**: 메모 내용에 URL이 포함된 경우 클릭 가능한 링크로 표시 (새창에서 열림)

### 4. Committee Member Management System
- Get total number of committee members (maxMember)
- Get individual member addresses (members function)
- Get member info for each address (candidateInfos)
- Get manager address from member CA contract (manager function)
- User membership detection (member address or manager address)

### 5. Voting Functionality
**CRITICAL: Vote status must be checked using AgendaManager.getVoteStatus, NOT Candidate.hasVoted:**

#### 5.1 투표 가능한 투표자/멤버 표시
**투표 화면에 투표 가능한 투표자(또는 멤버) 목록과 매니저 주소를 표시:**

**표시 정보:**
- 투표자/멤버 주소 (Etherscan 링크)
- 매니저 주소 (Etherscan 링크, 없으면 "None" 표시)
- 현재 연결된 지갑의 투표 권한 표시
  - "Direct": 직접 투표 가능
  - "You": 매니저로 투표 가능
- 투표 가능 여부 설명 텍스트

**UI 레이아웃:**
- 각 투표자/멤버를 표시

**투표 상태 표시:**
- **이미 투표한 멤버**: "✓ Voted" 표시와 함께 투표 타입 (For/Against/Abstain) 표시
- **아직 투표하지 않은 멤버**: "Not voted yet" 표시
- **투표 불가능한 멤버**: "❌ No voting permission" 표시

**시점별 구분:**
- 투표 시작 전: "Available Voters (Committee Members)"
- 투표 시작 후: "Available Voters (Current Voters)"


### 6. Execution Functionality
**CRITICAL: Execution is open to ANYONE, not just committee members**

**DAO Committee Version별 실행 가능 여부 확인:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus()` 함수 사용 가능
- `agendaStatus`=3 (WAITING_EXEC) 이여야 함.
- `agendaResult`= 4 (NO_CONSENSUS) 이면 실행안됨
- **실행 조건 확인 순서**: 위의 Execution Condition Check Priority 참조

**DAO Committee v1:**
- `Committee.currentAgendaStatus()` 함수 없음
- `AgendaManager.agendas()`의 status=3 (WAITING_EXEC) 이어야 함.
- `AgendaManager.agendas()`의 result=1 (ACCEPT) 이어야 함.
- **실행 조건 확인 순서**: 위의 Execution Condition Check Priority 참조

**Execution Conditions and Validation:**
- **우선순위 순서대로 확인** (위의 Execution Condition Check Priority 참조)
- Check execution period: `executableLimitTimestamp` vs current time (executableLimitTimestamp!=0)
- Verify agenda not already executed: `executed` boolean must be false
- Ensure voting completed and approved: `countingYes > countingNo`
- **DAO v2 추가 조건**: `agendaResult=4` (NO_CONSENSUS)이면 실행 불가


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
    "inputs": [],
    "name": "manager",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
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
- **MetaMask 전용 지갑 연결** (Connect/Disconnect buttons)
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
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

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
- [ ] **MetaMask 전용 wagmi v2 configuration** (metaMask connector만 사용)
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
- [ ] **투표 함수는 candidateContract 주소를 통해 호출** (member 주소 직접 사용 금지)
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
- [ ] **MetaMask 전용 지갑 연결** (Connect/Disconnect buttons)
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

## 체크리스트 점검
앱을 완성한 후, 반드시 다음 체크리스트를 하나씩 점검해주세요:

- [ ] 모든 파일이 올바르게 생성되었는지 확인
- [ ] package.json에 필요한 의존성이 모두 포함되었는지 확인
- [ ] npm install && npm run dev로 앱이 오류 없이 실행되는지 확인
- [ ] **MetaMask 전용 지갑 연결이 정상적으로 작동하는지 확인**
- [ ] 아젠다 검색과 네비게이션이 작동하는지 확인
- [ ] 아젠다 상세 정보가 정확히 표시되는지 확인
- [ ] 실시간 상태 업데이트가 작동하는지 확인
- [ ] 투표 기능이 정상적으로 작동하는지 확인
- [ ] 실행 기능이 정상적으로 작동하는지 확인
- [ ] 실행 조건 검증이 올바르게 작동하는지 확인 (실행 기간, NO_CONSENSUS 상태 등)
- [ ] 실행 조건 확인 순서가 올바르게 구현되었는지 확인 (투표 중 > 실행 기간 만료 > 기타 조건)
- [ ] 투표 중일 때 실행 버튼이 숨겨지고 적절한 메시지가 표시되는지 확인
- [ ] 실행 불가능한 상황에서 적절한 에러 메시지가 표시되는지 확인
- [ ] 수동 새로고침 버튼이 작동하는지 확인
- [ ] 에러 처리와 로딩 상태가 적절히 구현되었는지 확인
- [ ] UI가 반응형이고 사용자 친화적인지 확인
