# 🔍 Tokamak DAO Agenda Viewer App Prompt

## 📋 Complete Implementation Request

```
Please implement a complete Tokamak DAO agenda viewer web application based on Next.js 15 + wagmi v2 according to all the requirements below.

**IMPORTANT: All UI text, labels, buttons, and messages must be in English.**

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
- URL parameter support for agenda ID (/agenda/[id])
- Agenda ID input field (from 0 to maximum agenda number)
- Display total agenda count and validation
- Previous/Next agenda navigation buttons

### 2. Agenda Basic Information Display
**AgendaManager.agendas(id) call results:**
- Creation date (createdTimestamp → readable date)
- Notice end date (noticeEndTimestamp)
- Voting period (votingPeriodInSeconds → seconds + days/hours conversion)
- Voting start/end dates (votingStartedTimestamp, votingEndTimestamp)
- Executable deadline (executableLimitTimestamp)
- Execution date (executedTimestamp, executed)
- Voting results (countingYes, countingNo, countingAbstain)
- Status/result (status, result → text conversion)
- Voter list (voters array)

### 3. Real-time Status Information
**Committee.currentAgendaStatus(id) call results:**
- Current agenda status (agendaStatus)
- Current agenda result (agendaResult)
- Compare basic info with real-time info

### 4. Advanced UI Features
- Vote progress visualization (progress bars)
- Timeline display (creation→notice→voting→execution stages)
- Voter address list (clickable Etherscan links)
- Status-based color coding
- Real-time countdown to voting deadline
- Agenda URL link if available

## 📊 Required Enum Mapping

### AgendaManager Contract (agendas function)
```typescript
const AGENDA_STATUS = {
  0: { text: 'NONE', color: 'gray', description: 'No status' },
  1: { text: 'NOTICE', color: 'blue', description: 'Notice period' },
  2: { text: 'VOTING', color: 'green', description: 'Voting in progress' },
  3: { text: 'WAITING_EXEC', color: 'orange', description: 'Waiting for execution' },
  4: { text: 'EXECUTED', color: 'purple', description: 'Executed' },
  5: { text: 'ENDED', color: 'red', description: 'Ended' }
};

const AGENDA_RESULT = {
  0: { text: 'PENDING', color: 'gray', description: 'Pending result' },
  1: { text: 'ACCEPT', color: 'green', description: 'Accepted' },
  2: { text: 'REJECT', color: 'red', description: 'Rejected' },
  3: { text: 'DISMISS', color: 'yellow', description: 'Dismissed' }
};
```

### Committee Contract (currentAgendaStatus function)
```typescript
const COMMITTEE_STATUS = {
  0: { text: 'NONE', color: 'gray' },
  1: { text: 'NOTICE', color: 'blue' },
  2: { text: 'VOTING', color: 'green' },
  3: { text: 'WAITING_EXEC', color: 'orange' },
  4: { text: 'EXECUTED', color: 'purple' },
  5: { text: 'ENDED', color: 'red' },
  6: { text: 'NO_AGENDA', color: 'gray' }
};

const COMMITTEE_RESULT = {
  0: { text: 'PENDING', color: 'gray' },
  1: { text: 'ACCEPT', color: 'green' },
  2: { text: 'REJECT', color: 'red' },
  3: { text: 'DISMISS', color: 'yellow' },
  4: { text: 'NO_CONSENSUS', color: 'orange' },
  5: { text: 'NO_AGENDA', color: 'gray' }
};
```

## 🎨 UI/UX Requirements

### Header Section
- Wallet connection status (abbreviated address display)
- Network selector (Mainnet/Sepolia)
- Current contract addresses display
- Total agenda count and current viewing ID

### Main Content
1. **Agenda Navigation**
   - Agenda ID input field (numbers only)
   - Previous/Next buttons (boundary handling)
   - Warning message for invalid IDs

2. **Agenda Detail Information Card**
   - Status badges (color coding)
   - Timestamp section (all time information)
   - Vote results section (with progress bars)
   - Real-time status section (separate from basic info)

3. **Voter Information**
   - Voter count summary
   - Voter address list (pagination)
   - Etherscan links for each address

4. **Timeline Visualization**
   - Agenda lifecycle stages display
   - Current stage highlight
   - Time remaining to next stage

## 🔧 Technical Implementation Requirements

### 1. Safe Utilities (Required Implementation)
```typescript
// src/lib/safe-utils.ts
export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try { return val ? BigInt(String(val)) : null; } catch { return null; }
  },

  formatDate: (timestamp: bigint | number): string => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return 'Invalid Date'; }
  },

  formatDuration: (seconds: bigint | number): string => {
    const s = Number(seconds);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const remainingSeconds = s % 60;

    if (days > 0) return `${days} days ${hours} hours ${minutes} minutes`;
    if (hours > 0) return `${hours} hours ${minutes} minutes ${remainingSeconds} seconds`;
    return `${minutes} minutes ${remainingSeconds} seconds`;
  },

  formatAddress: (address: string): string => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  }
};
```

### 2. Contract Configuration (wagmi)
```typescript
// src/lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const CONTRACTS = {
  1: { // Mainnet
    ton: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5' as const,
    committee: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as const,
    agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484' as const,
  },
  11155111: { // Sepolia
    ton: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044' as const,
    committee: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as const,
    agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as const,
  }
};

export const getContracts = (chainId: number) => CONTRACTS[chainId as keyof typeof CONTRACTS];
```

### 3. Required ABI Definition
```typescript
// src/lib/abis.ts
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
  }
] as const;

export const COMMITTEE_ABI = [
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

### 4. Data Fetching Optimization
- Use useReadContract for individual agenda queries
- Enable watch: true for real-time updates
- Conditional query activation (enabled)
- Error handling and loading states
- Safe BigInt value processing

### 5. URL Routing
- Support `/agenda/[id]` dynamic routes
- Auto-set agenda ID from URL parameters
- Support browser back/forward navigation

## ⚠️ Critical Implementation Notes

1. **BigInt Processing**: Convert all contract return values with safe.bigInt()
2. **Type Safety**: Prevent undefined in Enum mapping
3. **Error Handling**: Handle non-existent agenda IDs
4. **Performance**: Prevent unnecessary re-renders (useMemo, useCallback)
5. **Accessibility**: Support keyboard navigation
6. **Responsive**: Mobile-friendly layout

## 📦 Deliverable Requirements

**The completed project must include:**
1. **package.json** (all dependencies specified - autoprefixer required!)
2. **next.config.ts**
3. **tailwind.config.ts** + **postcss.config.mjs**
4. **src/app/layout.tsx** (Provider setup)
5. **src/app/page.tsx** (main page)
6. **src/app/agenda/[id]/page.tsx** (dynamic route)
7. **src/lib/** (utility and configuration files)
8. **src/components/** (reusable components)
9. **README.md** (installation and usage guide)

### 📦 Required Dependencies (package.json)
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

Provide **complete code** for all files and make it immediately executable without TypeScript errors.

## 🔄 Execution Test Method
```bash
npx create-next-app@15 agenda-detail-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd agenda-detail-app
npm install wagmi viem @tanstack/react-query autoprefixer
npm run dev
```

After execution, the following features should all work properly:
- Wallet connection/disconnection
- Network switching
- Agenda ID input and query
- Agenda detail information display
- Real-time status updates
- Previous/Next agenda navigation

### 🌍 UI Language Requirements
- **Page titles**: English (e.g., "Tokamak DAO Agenda Detail Viewer")
- **Button labels**: English (e.g., "Connect", "Disconnect", "Previous", "Next")
- **Status text**: English (e.g., "Connected", "Voting", "Executed")
- **Form labels**: English (e.g., "Agenda ID", "Network")
- **Error messages**: English (e.g., "Invalid agenda ID", "Unsupported network")
- **Date formatting**: Use 'en-US' locale
- **All UI text**: Must be in English throughout the application
```