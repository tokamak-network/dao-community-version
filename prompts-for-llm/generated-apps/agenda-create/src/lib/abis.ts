export const TON_ABI = [
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "extraData", "type": "bytes"}
    ],
    "name": "approveAndCall",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const COMMITTEE_ABI = [
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

export const AGENDA_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "createAgendaFees",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minimumNoticePeriodSeconds",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minimumVotingPeriodSeconds",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const