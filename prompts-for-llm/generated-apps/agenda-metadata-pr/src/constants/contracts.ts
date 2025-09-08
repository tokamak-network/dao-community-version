export const MAINNET_CONTRACTS = {
  ton: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5' as const,
  committee: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as const,
  agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484' as const,
}

export const SEPOLIA_CONTRACTS = {
  ton: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044' as const,
  committee: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as const,
  agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as const,
}

interface ContractAddresses {
  ton: string
  committee: string
  agendaManager: string
}

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: MAINNET_CONTRACTS,
  11155111: SEPOLIA_CONTRACTS,
}

export const getContracts = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId] || null
}

export const AGENDA_CREATED_EVENT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": false, "name": "targets", "type": "address[]"},
      {"indexed": false, "name": "noticePeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "votingPeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "atomicExecute", "type": "bool"}
    ],
    "name": "AgendaCreated",
    "type": "event"
  }
] as const

export const TON_APPROVE_AND_CALL_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "approveAndCall",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

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
] as const

export const COMMITTEE_ABI = [
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
  }
] as const

export const TON_ABI = [
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const