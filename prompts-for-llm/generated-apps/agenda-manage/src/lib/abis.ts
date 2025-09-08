export const COMMITTEE_ABI = [
  {
    "inputs": [],
    "name": "version",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "pure",
    "type": "function"
  },
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
  },
  {
    "inputs": [{ "internalType": "address", "name": "candidate", "type": "address" }],
    "name": "candidateInfos",
    "outputs": [
      { "internalType": "address", "name": "candidateContract", "type": "address" },
      { "internalType": "uint256", "name": "indexMembers", "type": "uint256" },
      { "internalType": "uint256", "name": "memberJoinedTime", "type": "uint256" },
      { "internalType": "uint256", "name": "rewardPeriod", "type": "uint256" },
      { "internalType": "uint256", "name": "claimedTimestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "currentAgendaStatus",
    "outputs": [
      { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
      { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "agendaId", "type": "uint256" }],
    "name": "agendaMemo",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "executeAgenda",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const CANDIDATE_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_agendaID", "type": "uint256" },
      { "internalType": "uint256", "name": "_vote", "type": "uint256" },
      { "internalType": "string", "name": "_comment", "type": "string" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const OPERATOR_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "manager",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_agendaID", "type": "uint256" },
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getVoteStatus",
    "outputs": [
      { "internalType": "bool", "name": "hasVoted", "type": "bool" },
      { "internalType": "uint256", "name": "vote", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;