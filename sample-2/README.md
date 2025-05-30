# DAO Community Version

A decentralized governance platform for managing community proposals and voting.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Documentation](#documentation)
- [License](#license)

## Features

### Proposal Management
- Create and manage proposals
- Support for various proposal types
- Proposal status tracking

### Voting System
- For/Against/Abstain voting
- Real-time vote tracking
- Vote result visualization

### Execution Process
- Execution condition verification
- Execution status monitoring
- Execution result tracking
- Transaction confirmation monitoring

## Getting Started

### Prerequisites
- Node.js v16 or higher
- MetaMask or compatible Web3 wallet
- Access to Ethereum network (Mainnet/Testnet)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy the environment file:
   ```bash
   # For Mainnet
   cp .env.example.mainnet .env.local

   # For Sepolia
   cp .env.example.sepolia .env.local
   ```
4. Start the development server: `npm run dev`

For detailed setup instructions and configuration, please refer to [Environment Setup Guide](docs/environment-setup.md).

## Development

### Tech Stack
- Built with Next.js and TypeScript
- Uses ethers.js for blockchain interaction
- Implements event-based state management
- Supports both Mainnet and Sepolia networks

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

MIT