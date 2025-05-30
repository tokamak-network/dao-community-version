# DAO Community Version

A decentralized autonomous organization (DAO) system with proposal management, voting, and execution capabilities.

## Documentation

- [System Architecture](docs/architecture.md) - System design and components
- [Features](docs/features.md) - Detailed feature descriptions
- [Environment Setup](docs/environment-setup.md) - Configuration and setup guide

## Quick Start

1. Clone the repository
   ```bash
   git clone [repository-url]
   cd dao-community-version
   cd sample-2
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start local development server
   ```bash
   npm run dev
   ```

## Development

### Prerequisites
- Node.js v16 or higher
- MetaMask or compatible Web3 wallet
- Access to Ethereum network (Mainnet/Testnet)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Smart Contracts: Solidity
- Web3: wagmi, viem
- UI: Tailwind CSS, shadcn/ui

## Testing

See [Environment Setup](docs/environment-setup.md#network-specific-setup) for testnet configuration.

## Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Start the production server
   ```bash
   npm start
   ```

3. Configure environment variables for production

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

[License Type] - See LICENSE file for details