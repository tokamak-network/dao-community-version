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
] as const;

export const COMMITTEE_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
    "name": "currentAgendaStatus",
    "outputs": [
      { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
      { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;