export const DAO_AGENDA_MANAGER_ABI = [
  {
    inputs: [],
    name: "numAgendas",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256", name: "_index" }],
    name: "agendas",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "createdTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "noticeEndTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingPeriodInSeconds",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingStartedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingEndTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "executableLimitTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "executedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingYes",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingNo",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingAbstain",
            type: "uint256",
          },
          {
            internalType: "enum LibAgenda.AgendaStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum LibAgenda.AgendaResult",
            name: "result",
            type: "uint8",
          },
          {
            internalType: "address[]",
            name: "voters",
            type: "address[]",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
        ],
        internalType: "struct LibAgenda.Agenda",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumNoticePeriodSeconds",
    outputs: [{ type: "uint128", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumVotingPeriodSeconds",
    outputs: [{ type: "uint128", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "executingPeriodSeconds",
    outputs: [{ type: "uint128", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
