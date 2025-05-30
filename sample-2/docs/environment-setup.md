# Environment Setup

## Prerequisites

- Node.js v16 or higher
- MetaMask or compatible Web3 wallet
- Access to Ethereum network (Mainnet/Testnet)

## Required Environment Variables

1. Copy the example environment file based on your target network:
   ```bash
   # For Mainnet
   cp .env.example.mainnet .env.local

   # For Sepolia
   cp .env.example.sepolia .env.local
   ```

2. Update the following variables in `.env.local` with your values:
   - `NEXT_PUBLIC_RPC_URL`: Your Ethereum node RPC URL
   - `NEXT_PUBLIC_ETHERSCAN_API_KEY`: Your Etherscan API key (required for contract ABI verification)

Note: Other variables including `NEXT_PUBLIC_CHAIN_ID` are pre-configured in the example files and don't need to be modified unless you have specific requirements.

## Configuration Details

### Blockchain Network
- `NEXT_PUBLIC_CHAIN_ID`: The Ethereum network ID (pre-configured in example files)
  - 1: Ethereum Mainnet
  - 11155111: Sepolia Testnet

- `NEXT_PUBLIC_RPC_URL`: JSON-RPC endpoint URL
  - Required for reading blockchain data
  - Example URLs:
    - Mainnet: `https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY`
    - Sepolia: `https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY`
  - Can use services like Alchemy, Infura, or your own node

- `NEXT_PUBLIC_ETHERSCAN_API_KEY`: Etherscan API key
  - Required for contract ABI verification
  - Get your API key from https://etherscan.io/apis

### Contract Addresses
- `NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS`: The address of the DAO Committee Proxy contract
  - Mainnet: `0xDD9f0cCc044B0781289Ee318e5971b0139602C26`
  - Sepolia: `0xA2101482b28E3D99ff6ced517bA41EFf4971a386`

- `NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS`: The address of the Agenda Manager contract
  - Mainnet: `0xcD4421d082752f363E1687544a09d5112cD4f484`
  - Sepolia: `0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08`

### Event Management
- `NEXT_PUBLIC_EVENT_START_BLOCK`: Block number to start listening for events
  - Only agendas created after this block will be loaded
  - Set to 0 to load all agendas from the beginning
  - Set to a specific block number to load agendas created after that block
  - Useful for reducing initial load time by skipping old agendas
  - Example: If set to 1000000, only agendas created after block 1000000 will be loaded

- `NEXT_PUBLIC_BLOCK_RANGE`: Number of blocks to scan for events
  - Used to batch event loading
  - Default: 499 (under 500 to avoid RPC limits)
  - Example: If scanning from block 1000000 with range 499, it will scan blocks 1000000-1000499

- `NEXT_PUBLIC_POLLING_INTERVAL`: Interval for polling new events (in milliseconds)
  - How often to check for new agendas
  - Default: 1000 (1 second)
  - Lower values increase responsiveness but may hit rate limits
  - Higher values reduce server load but increase latency

### Contract Read Optimization
- `NEXT_PUBLIC_CONTRACT_BATCH_SIZE`: Number of contract reads to batch together
  - Default: 10
  - Higher values reduce RPC calls but increase memory usage

- `NEXT_PUBLIC_CONTRACT_BATCH_DELAY_MS`: Delay between batch reads
  - Default: 100
  - Prevents rate limiting by adding delay between batches

- `NEXT_PUBLIC_CONTRACT_CACHE_DURATION_MS`: How long to cache contract read results
  - Default: 30000 (30 seconds)
  - Longer cache duration reduces RPC calls but may show stale data

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   # For Mainnet
   cp .env.example.mainnet .env.local

   # For Sepolia
   cp .env.example.sepolia .env.local
   ```

3. Update the environment variables in `.env.local` with your values

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Setup

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **RPC Connection Issues**
   - Verify your RPC URL is correct
   - Check if you have sufficient API credits
   - Ensure your IP is not rate-limited

2. **Contract Address Issues**
   - Verify contract addresses are correct for the selected network
   - Ensure contracts are deployed and verified on the network

3. **Event Listening Issues**
   - Verify the start block number is correct
   - Check if the block range is appropriate
   - Ensure the polling interval is not too frequent

4. **Performance Issues**
   - Adjust batch size and delay for contract reads
   - Modify cache duration based on your needs
   - Consider increasing polling interval if too many requests