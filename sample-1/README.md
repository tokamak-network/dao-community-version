# Tokamak DAO Community Version Web Application

This project is a web application for operating the Tokamak DAO (Decentralized Autonomous Organization) community.

---

## Table of Documents

- [Features](#features)
- [Folder Structure](#folder-structure)
- [Key Modules and Functions](#key-modules-and-functions)
- [Environment Configuration](#environment-configuration)
- [Execution Guide](#execution-guide)

## Features

### DAO Committee Related Features

- **Committee Member List**: View all DAO committee members and their information.
- **Member Status Check**: Check detailed information of current committee members.
- **Layer2 Candidates**: View Layer2 challenge candidates.
- **Activity Reward Claim**: Claim member activity rewards (if applicable).
- **Challenge Analysis**: Analyze and display challenge progress and results, and request challenges (if applicable).
- **Member Retirement**: Retire from membership (if applicable).
- **Real-time Event Monitoring**: UI (committee status) is immediately updated when ChangedMember (member replacement-challenge), ClaimedActivityReward (activity reward claim), Layer2Registered (layer2 creation) events occur on the blockchain.

### Agenda Related Features

- **Agenda Creation**: Create new agendas (on-chain proposals).
- **Agenda Simulation**: Provides pre-simulation functionality by hard-forking a local node before submitting agendas on-chain. Through simulation, you can preview on-chain execution results and gas costs.
- **Agenda Metadata Submission**: Provides an interface to submit agenda metadata to the agenda repository when creating agendas. Submitting to the agenda metadata repository allows users to visually and easily recognize registered agendas.
- **Agenda Creator Signature Generation**: Generate creator signatures for agenda metadata.
- **Agenda List and Details**: View agenda lists and detailed information.
- **Voting**: Vote on agendas (if you are a DAO member) with on-chain transaction and UI feedback.
- **Execution**: Anyone can execute agendas when conditions are met.
- **Real-time Event Monitoring**: UI (agenda status) is immediately updated when AgendaCreated, VoteCasted, and AgendaExecuted events occur on the blockchain.
- **Progressive Pagination**: Agenda lists are loaded in batches to improve performance and UX.
- **Batch Loading via Worker System**: Agenda lists are loaded in batches by background workers, with support for rate limiting and abort functionality.
- **Configurable Batch Delay**: Agenda loading batch delay can be configured via environment variables.
- **Error Handling**: UI and state management for various error situations like 404, network issues, etc.
- **Context-based State Management**: Global state and pagination-specific state are separated to improve performance and maintainability.

### Common Features

- **Contract Integration**: All major actions (agenda, voting, execution, etc.) are directly integrated with smart contracts.
- **Environment Variable-based Configuration**: Key parameters like RPC URL, contract addresses, batch delays, etc. can be configured via environment variables.

## Folder Structure

```
dao-community-sample/
├── app/                    # Next.js 13+ App Router
│   ├── agenda/            # Agenda related pages
│   │   ├── [id]/         # Agenda detail page
│   │   └── page.tsx      # Agenda list page
│   ├── dao-committee/    # DAO Committee page
│   ├── api/              # API routes
│   │   ├── submit-pr/    # PR submission API
│   │   └── simulate/     # Simulation API
│   ├── layout.tsx        # Root layout
│   ├── providers.tsx     # Provider setup
│   └── page.tsx          # Main page
├── components/            # Reusable components
│   ├── agenda/           # Agenda related components
│   ├── dao/              # DAO related components
│   ├── layout/           # Layout components
│   ├── modals/           # Modal components
│   ├── ui/               # UI components (including simulation)
│   └── wallet/           # Wallet integration components
├── contexts/             # React Context
│   └── CombinedDAOContext.tsx
├── lib/                  # Utility functions and libraries
│   ├── agenda-*.ts       # Agenda related logic
│   ├── dao-*.ts          # DAO related logic
│   ├── utils.ts          # Common utilities
│   └── signature.ts      # Signature related functions
├── types/                # TypeScript type definitions
├── hooks/                # Custom hooks
├── utils/                # Utility functions
├── config/               # Configuration files
├── constants/            # Constant definitions
└── abis/                 # Smart contract ABIs
```

## Key Modules and Functions

### CombinedDAOContext

**Location**: `contexts/CombinedDAOContext.tsx`

- **Role**: Global state management for DAO and agenda management
- **Key Features**:
  - Agenda list and detail information management
  - DAO committee member information management
  - Layer2 candidate management (DAO member challenge feasibility analysis)
  - Real-time event monitoring (DAO member changes, agenda changes monitoring)
  - Blockchain state and UI synchronization

### DAO Committee Components

**Location**: `components/dao/`, `app/dao-committee/`

- **Key Components**:
  - `DAOCommitteeMembers.tsx`: Committee member information cards
  - `CheckChallengeButton.tsx`: Challenge check and request button
- **Features**:
  - Display committee member list
  - Check and manage member status
  - Challenge analysis and processing
  - Activity reward claiming
  - Member retirement

### AgendaPagination

**Location**: `lib/agenda-pagination.ts`

- **Role**: Progressive pagination handling for agendas
- **Key Features**:
  - Batch-based agenda loading
  - Duplicate-free upsert (add/update) logic
  - Rate limiting and abort support
  - Performance-optimized data loading

### RPC Worker

**Location**: `lib/shared-rpc-client.ts`, `lib/rpc-utils.ts`

- **Role**: Background batch processing and RPC request management
- **Key Features**:
  - Multi-worker RPC request processing
  - Priority-based queue management (role assignment based on priority)
  - Rate limiting and error handling
  - Progress tracking and monitoring

### Simulation

**Location**:
- **UI Component**: `components/ui/proposal-impact-overview.tsx`
- **API Endpoint**: `app/api/simulate/route.ts`

- **Role**: Provide simulation before agenda execution
- **Key Features**:
  - Simulation via local node hard fork
  - Preview gas costs and execution results
  - Real-time simulation log display
  - Error and success case handling
- **API Features**:
  - **Endpoint**: `POST /api/simulate`
  - **Streaming**: Real-time log transmission via Server-Sent Events(SSE)
  - **Hard Fork**: Local node forking through Hardhat
  - **Account Impersonation**: DAO account simulation via `hardhat_impersonateAccount`
  - **Balance Setting**: Automatic ETH balance allocation for simulation
- **Environment Setup**:
  - **Required Environment Variable**: `NEXT_PUBLIC_LOCALHOST_RPC_URL=http://127.0.0.1:8545`
  - **Local Node Execution**: `npx hardhat node --fork <RPC_URL>`
  - **Simulation Prerequisites**: Hard-forked local node execution required
- **Usage**:
  1. Enter basic agenda information and execution functions on agenda creation page
  2. Navigate to "Impact Overview" menu
  3. Run local Hardhat node (`npx hardhat node --fork <RPC_URL>`)
  4. Click "Simulate Execution" button to execute simulation

### PR Submission

**Location**:
- **API Endpoint**: `app/api/submit-pr/route.ts`
- **UI Component**: `components/modals/AgendaSubmissionModal.tsx`

- **Role**: Submit agenda metadata as PR to GitHub repository
- **Key Features**:
  - Automatic fork and branch creation
  - Metadata file creation and update
  - PR creation and submission
  - Local backup file download
- **API Features**:
  - **Endpoint**: `POST /api/submit-pr`
  - **GitHub API Integration**: Repository management through Octokit
  - **Automatic Fork**: Fork creation from original repository to user account
  - **Branch Management**: Unique branch name generation and conflict prevention
  - **Synchronization**: Sync fork with original repository to latest state
  - **Error Handling**: Handle fork creation failures, permission errors, etc.
- **Environment Setup**:
  - **Required Environment Variables**:
    - `GITHUB_TOKEN`: GitHub personal access token
    - `GITHUB_FORK_OWNER`: Fork owner (your GitHub account)
    - `GITHUB_OWNER`: Base repository owner (`tokamak-network`)
    - `GITHUB_REPO`: Repository name (`dao-agenda-metadata-repository`)
  - **GitHub Token Permissions**: `repo` permission required (for forking user's token)
- **Usage**:
  1. Click "Submit PR" button after completing agenda creation
  2. Confirm signature message and sign with wallet
  3. Automatically create fork and branch
  4. Upload metadata file and create PR
  5. Automatically download local backup file

### Event Subscription and Reflection

**Location**: `lib/agenda-event-monitor.ts`, `lib/dao-event-monitor.ts`

- **Role**: Real-time blockchain event monitoring and UI reflection
- **Key Features**:
  - Subscribe to AgendaCreated, VoteCasted, AgendaExecuted events
  - Subscribe to ChangedMember, ClaimedActivityReward, Layer2Registered events
  - Immediate UI state update when events occur
  - State updates through event handlers
  - Error handling and reconnection logic

### Signature Functionality

**Location**: `lib/signature.ts`

- **Role**: Agenda metadata creator signature and verification
- **Key Features**:
  - Agenda submitter signature message generation
  - Distinction between local storage signature and PR submission signature
  - Timestamp-based signature message format
  - Signature generation including agenda ID and transaction hash

## Environment Configuration

Create a `.env.local` file in the project root and set the following environment variables:
To run in Ethereum mainnet environment, copy `.env.example.mainnet`, and to run in Ethereum Sepolia testnet environment, copy `.env.example.sepolia`.

### Network/Contract Environment Variables

```bash
# Chain configuration
NEXT_PUBLIC_CHAIN_ID=11155111                    # 1: Mainnet, 11155111: Sepolia
NEXT_PUBLIC_CHAIN_NAME=Sepolia                   # Chain name, Mainnet or Sepolia
NEXT_PUBLIC_CHAIN_NETWORK=sepolia                # Network name, mainnet or sepolia
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io

# RPC configuration for contract queries
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org

# RPC for event monitoring
NEXT_PUBLIC_RPC_URL_FOR_EVENT=https://eth-sepolia.g.alchemy.com/v2/{your_api_key}

# Target contract function query for agenda registration action contracts
NEXT_PUBLIC_ETHERSCAN_API_KEY={your_etherscan_api_key_here}
NEXT_PUBLIC_ETHERSCAN_API_URL=https://api-sepolia.etherscan.io/api

# Hard-forked node URL for agenda simulation
NEXT_PUBLIC_LOCALHOST_RPC_URL=http://127.0.0.1:8545

# Contract addresses
NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS=0x...     # DAO Agenda Manager address
NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS=0x...    # DAO Committee Proxy address
NEXT_PUBLIC_TON_CONTRACT_ADDRESS=0x...           # TON Contract address
NEXT_PUBLIC_SEIG_MANAGER_ADDRESS=0x...           # Seig Manager address
NEXT_PUBLIC_LAYER2_MANAGER_ADDRESS=0x...         # Layer2 Manager address
NEXT_PUBLIC_LAYER2_REGISTRY_ADDRESS=0x...        # Layer2 Registry address
NEXT_PUBLIC_L1_BRIDGE_REGISTRY_ADDRESS=0x...     # Layer2 Bridge Registry address
```

### Optional Environment Variables

```bash
# RPC Call performance tuning
NEXT_PUBLIC_CONTRACT_BATCH_DELAY_MS=1500         # Batch loading delay (ms)
NEXT_PUBLIC_CONTRACT_BATCH_SIZE=3                # Batch size
NEXT_PUBLIC_CONTRACT_CACHE_DURATION_MS=12000     # Cache duration (ms)

# RPC Call worker configuration
NEXT_PUBLIC_RPC_WORKER_COUNT=5                   # Number of RPC worker threads, currently optimized. Modification requires changes to priority-related modules. shared-rpc-client.ts#priority-based worker allocation code
NEXT_PUBLIC_WORKER_REQUEST_INTERVAL=500          # Minimum request interval per worker (ms)
NEXT_PUBLIC_RPC_WORKER_LOG=false                 # Whether to display worker execution log panel
```

### GitHub Configuration (for PR submission)

```bash
# GitHub configuration
GITHUB_TOKEN={your_github_token}                    # GitHub personal access token
GITHUB_FORK_OWNER={your_github_username}            # Fork owner
GITHUB_OWNER=tokamak-network                        # Base owner
GITHUB_REPO=dao-agenda-metadata-repository          # Base repository
```

#### GITHUB_TOKEN Creation Guide

1. Log in to GitHub and navigate to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Click **Generate new token** > **Generate new token (classic)**
3. Enter token purpose in **Note** (e.g., "DAO Agenda PR Bot")
4. Set expiration date in **Expiration**
5. Check the following permission in **Select scopes**:
   - `workflow` (Update GitHub Action workflows)
6. Click **Generate token**
7. A token starting with `ghp_` will be generated. Set this to the `GITHUB_TOKEN` environment variable

## Execution Guide

### 1. Install Dependencies

```bash
git clone https://github.com/tokamak-network/dao-community-version.git
cd ./dao-community-version/sample-1
npm install --legacy-peer-deps
```

### 2. Environment Variable Setup

`cp .env.example.mainnet .env.local` or `cp .env.example.sepolia .env.local`

Modify the following values in the `.env.local` file according to your setup:

```bash
# RPC for event monitoring
NEXT_PUBLIC_RPC_URL_FOR_EVENT=https://eth-sepolia.g.alchemy.com/v2/{your_api_key}

# Target contract function query for agenda registration action contracts
NEXT_PUBLIC_ETHERSCAN_API_KEY={your_etherscan_api_key_here}

GITHUB_TOKEN={your_github_token}                    # GitHub personal access token
GITHUB_FORK_OWNER={your_github_username}            # Fork owner
```

### 3. Run Development Server

```bash
npm run dev
```

Access `http://localhost:3000` in your browser.

### 4. Production Build

```bash
npm run build
npm run start
```

### 5. Simulation Server (Optional)

After entering all agenda basic information and execution functions on the agenda creation page, you can simulate through the Impact overview menu.

```bash
# Run Hardhat or Anvil local node
cd ../simulation-node
npm i
npx hardhat node --fork <RPC URL>
```

If using https://ethereum-sepolia-rpc.publicnode.com as the RPC URL,
run `npx hardhat node --fork https://ethereum-sepolia-rpc.publicnode.com`.
After confirming the node is running, execute the 'Simulation execution' button on the agenda Impact overview screen.

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Blockchain**: wagmi, viem, ethers.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context
- **Build Tool**: Next.js




