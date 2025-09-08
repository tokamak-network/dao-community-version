# ⚙️ Shared Configuration

## Overview
This document contains all shared configuration values used across the Tokamak DAO Agenda system.

## GitHub Repository Configuration

### Fixed Repository Settings
```typescript
const GITHUB_REPO_CONFIG = {
  owner: 'tokamak-network',
  repo: 'dao-agenda-metadata-repository',
  branch: 'main',
  basePath: 'data/agendas',
  url: 'https://github.com/tokamak-network/dao-agenda-metadata-repository'
};

// File path pattern
const getFilePath = (network: string, agendaId: number): string => {
  return `${GITHUB_REPO_CONFIG.basePath}/${network}/agenda-${agendaId}.json`;
};
```

## Network Configuration

### Supported Networks
```typescript
const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    daoContract: '0x2beA5307A896e23Ecc029438731AfF899fF4Bc23',
    blockExplorer: 'https://etherscan.io',
    explorerApi: 'https://api.etherscan.io/api'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    daoContract: '0xf9f3A935e11204CBDB6Bbd87beEcC35E36Dcd05f',
    blockExplorer: 'https://sepolia.etherscan.io',
    explorerApi: 'https://api-sepolia.etherscan.io/api'
  }
};
```

### Contract Addresses

#### Mainnet Contracts
```typescript
const MAINNET_CONTRACTS = {
  DAO: '0x2beA5307A896e23Ecc029438731AfF899fF4Bc23',
  TON: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5',
  WTON: '0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2',
  DepositManager: '0x56E465f654393fa48f007Ed7346105c7195CEe43',
  SeigManager: '0x710936500aC59e8551331871Cbad3D33d5e0D909',
  Layer2Registry: '0x0b3E174A2170083e770D5d4Cf56774D221b7063e'
};
```

#### Sepolia Contracts
```typescript
const SEPOLIA_CONTRACTS = {
  DAO: '0xf9f3A935e11204CBDB6Bbd87beEcC35E36Dcd05f',
  TON: '0xa30fe40285B8f5c0457DbC3B7C8A280373c40044',
  WTON: '0x79E0d92670106c85E9067b56B8F674340dCa0Bbd',
  TOS: '0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd'
};
```

## API Configuration

### Etherscan API
```typescript
const ETHERSCAN_API = {
  mainnet: {
    url: 'https://api.etherscan.io/api',
    key: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || ''
  },
  sepolia: {
    url: 'https://api-sepolia.etherscan.io/api',
    key: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || ''
  }
};
```

### RPC Endpoints
```typescript
const RPC_ENDPOINTS = {
  mainnet: [
    'https://mainnet.infura.io/v3/{INFURA_KEY}',
    'https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}',
    'https://rpc.ankr.com/eth'
  ],
  sepolia: [
    'https://sepolia.infura.io/v3/{INFURA_KEY}',
    'https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_KEY}',
    'https://rpc.ankr.com/eth_sepolia'
  ]
};
```

## Validation Constants

### Time Limits
```typescript
const TIME_LIMITS = {
  SIGNATURE_VALIDITY: 60 * 60 * 1000, // 1 hour in milliseconds
  API_TIMEOUT: 30 * 1000,             // 30 seconds
  TRANSACTION_CONFIRM: 2 * 60 * 1000  // 2 minutes
};
```

### Size Limits
```typescript
const SIZE_LIMITS = {
  MAX_DESCRIPTION_LENGTH: 10000,      // characters
  MAX_TITLE_LENGTH: 200,              // characters
  MAX_ACTIONS: 50,                    // maximum actions per agenda
  MAX_CALLDATA_SIZE: 100000,          // bytes
  MAX_FILE_SIZE: 1024 * 1024          // 1MB for metadata file
};
```

### Regex Patterns
```typescript
const PATTERNS = {
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  CALLDATA: /^0x[a-fA-F0-9]*$/,
  UINT: /^\d+$/,
  BYTES32: /^0x[a-fA-F0-9]{64}$/
};
```

## UI Configuration

### Workflow Steps
```typescript
const WORKFLOW_STEPS = [
  {
    id: 1,
    name: 'Transaction Input',
    description: 'Enter the agenda transaction hash'
  },
  {
    id: 2,
    name: 'Metadata Input',
    description: 'Fill in agenda metadata details'
  },
  {
    id: 3,
    name: 'Signature',
    description: 'Sign with your wallet'
  },
  {
    id: 4,
    name: 'Validation',
    description: 'Validate all metadata'
  },
  {
    id: 5,
    name: 'GitHub Setup',
    description: 'Configure GitHub access'
  },
  {
    id: 6,
    name: 'Create PR',
    description: 'Submit pull request'
  }
];
```

### Theme Colors
```typescript
const THEME = {
  primary: '#3B82F6',    // blue-500
  success: '#10B981',    // green-500
  warning: '#F59E0B',    // amber-500
  error: '#EF4444',      // red-500
  info: '#6B7280'        // gray-500
};
```

## Environment Variables

### Required Environment Variables
```env
# API Keys
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
NEXT_PUBLIC_INFURA_KEY=your_infura_key
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key

# Network Configuration
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia

# GitHub Configuration (optional, can be entered in UI)
GITHUB_TOKEN=your_github_personal_access_token
```

### Optional Environment Variables
```env
# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Feature Flags
NEXT_PUBLIC_ENABLE_MAINNET=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

## Usage Example

```typescript
import { 
  GITHUB_REPO_CONFIG, 
  NETWORKS, 
  PATTERNS,
  TIME_LIMITS 
} from '@/config/shared';

// Get network configuration
const network = NETWORKS.sepolia;
console.log(`Using ${network.name} at ${network.rpcUrl}`);

// Validate transaction hash
if (!PATTERNS.TX_HASH.test(txHash)) {
  throw new Error('Invalid transaction hash');
}

// Check signature validity
const age = Date.now() - new Date(timestamp).getTime();
if (age > TIME_LIMITS.SIGNATURE_VALIDITY) {
  throw new Error('Signature expired');
}

// Generate file path
const filePath = `${GITHUB_REPO_CONFIG.basePath}/sepolia/agenda-123.json`;
```