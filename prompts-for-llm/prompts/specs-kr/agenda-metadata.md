
## 📊 DAO Agenda Metadata 저장소

### 저장소 정보 (고정값)
- **Owner**: tokamak-network
- **Repository**: dao-agenda-metadata-repository
- **URL**: https://github.com/tokamak-network/dao-agenda-metadata-repository
- **Branch**: main
- **File Path**: data/agendas/{network}/agenda-{id}.json


## TypeScript Type Definitions

```typescript
interface AgendaMetadata {
  id: number;
  title: string;
  description: string;
  network: "mainnet" | "sepolia";
  transaction: string;
  creator: {
    address: string;
    signature: string;
  };
  actions: Action[];
  createdAt: string;
  updatedAt?: string;
  snapshotUrl?: string;  // Reference link URL (Snapshot proposal, official announcement, etc.)
  discourseUrl?: string;  // Discussion link URL (Discourse forum, official announcement, etc.)
}

interface Action {
  title: string;
  contractAddress: string;
  method: string;
  calldata: string;
  abi: any[];
  sendEth?: boolean;
  id?: string;
  type?: string;
}
```

