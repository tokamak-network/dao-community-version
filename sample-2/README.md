# DAO Community Version (Sample-2)

A modern decentralized governance platform for managing community proposals, voting, and execution with enhanced user experience and transaction transparency.

> **Note**: This is the `sample-2` implementation from the [tokamak-network/dao-community-version](https://github.com/tokamak-network/dao-community-version) repository, featuring the latest UI/UX improvements and advanced functionality.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Recent Improvements](#recent-improvements)
- [Documentation](#documentation)
- [License](#license)

## Features

### Proposal Management
- **Enhanced Proposal Creation**: Interactive form with real-time preview and step-by-step guidance
- **Contract Version Support**: Dynamic detection and support for v2.0.0 contracts with memo fields
- **Multi-Action Support**: Create proposals with multiple contract actions
- **Transaction Simulation**: Test proposal execution before submission using Hardhat fork
- **Local Save/Load**: Save proposal drafts locally and reload for editing
- **Repository Integration**: Automatic PR submission for proposal metadata registration

### Advanced User Interface
- **Dual-Mode Editor**: Switch between edit and preview modes seamlessly
- **Interactive Guide**: Step-by-step guidance with progress tracking
- **Impact Overview**: Comprehensive simulation results and gas estimation using local fork
- **Real-time Validation**: Form validation with clear error messages
- **Responsive Design**: Optimized for desktop and mobile devices

### Voting System
- **Committee-Based Voting**: Secure voting for committee members
- **Real-time Updates**: Live vote counting and status updates
- **Voting History**: Complete transaction history and vote tracking
- **Multiple Vote Types**: Support for Yes/No/Abstain voting
- **Wallet Connection Validation**: Comprehensive checks before voting

### Execution Process
- **Anyone Can Execute**: Permissionless execution for approved proposals
- **Status Tracking**: Clear execution status with color-coded indicators
- **Transaction Monitoring**: Real-time transaction status updates
- **Expiration Handling**: Automatic status updates for expired proposals
- **Execution Validation**: Pre-execution checks and error handling

### Enhanced Data Management
- **Event-Based Updates**: Real-time agenda updates via blockchain events
- **Contract Storage Display**: View on-chain agenda data and execution status
- **Metadata Integration**: Seamless integration of on-chain and off-chain data
- **Network Support**: Multi-network support (Mainnet/Sepolia)
- **Data Refresh**: Manual refresh capabilities for latest data

## Getting Started

### Prerequisites
- Node.js v18 or higher
- MetaMask or compatible Web3 wallet
- Access to Ethereum network (Mainnet/Sepolia)
- Git repository access for metadata registration

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/tokamak-network/dao-community-version.git
   cd dao-community-version/sample-2
   ```

2. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure environment
   ```bash
   # For Mainnet
   cp .env.example.mainnet .env.local

   # For Sepolia
   cp .env.example.sepolia .env.local
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

For detailed setup instructions and configuration, please refer to [Environment Setup Guide](docs/environment-setup.md).

## Development

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: ethers.js v6, wagmi v2, viem
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **State Management**: React Context with event-based updates
- **Simulation**: Hardhat fork for proposal execution testing
- **Code Quality**: ESLint, TypeScript strict mode

### Key Components
- **ProposalForm**: Advanced proposal creation with preview
- **AgendaDetail**: Comprehensive agenda information display
- **ProposalPreview**: Real-time preview with transaction preparation
- **AgendaContext**: Centralized state management with event monitoring
- **ProposalGuide**: Interactive user guidance system

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting

## Documentation

- [Environment Setup](docs/environment-setup.md) - Detailed configuration guide
- [Features](docs/features.md) - Complete feature documentation
- [Architecture](docs/architecture.md) - System design and components

## License

ISC
