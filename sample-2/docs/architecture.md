# System Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend<br/>Next.js/React"]
        style Frontend fill:#e1f5fe,stroke:#01579b
        DAO[DAO Proposal Website]
    end

    subgraph Backend["Backend<br/>Next.js API Routes"]
        style Backend fill:#f3e5f5,stroke:#4a148c
        API[Simulation API]
    end

    subgraph Blockchain["Blockchain Nodes"]
        style Blockchain fill:#e8f5e9,stroke:#1b5e20
        HF[Hardforked Node<br/>API Communication]
        BC[Blockchain Node<br/>Frontend Communication]
    end

    %% Core Communication
    DAO --> |HTTP/WS| API
    API --> |RPC| HF
    DAO --> |RPC| BC

    %% Component Details
    subgraph Features["Implemented Features"]
        style Features fill:#fff3e0,stroke:#e65100
        DAO --> |Proposal List| BC
        DAO --> |Proposal Creation| BC
        DAO --> |Simulation Request| API
        API --> |Simulation| HF
        DAO --> |Transaction| BC
    end
```

## Components

### Frontend
- Web application based on Next.js and React
- Type safety using TypeScript
- UI implementation with Tailwind CSS and shadcn/ui
- Web3 integration using wagmi and viem

### Backend
- Serverless backend using Next.js API Routes
- Simulation API provision
- Communication with hardforked node

### Blockchain
- Communication with main blockchain node
- Simulation through hardforked node
- Smart contract interaction

## Smart Contract Architecture

### DAO Committee Proxy
- Main governance contract
- Proposal creation and management
- Voting mechanism
- Execution control

### Agenda Manager
- Agenda tracking
- Status management
- Voting period control
- Execution scheduling
