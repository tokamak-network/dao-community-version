export const DAO_ABI = [
  {
    inputs: [{ internalType: "address", name: "_receiver", type: "address" }],
    name: "claimActivityReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_agendaID",
        type: "uint256",
      },
    ],
    name: "executeAgenda",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "quorum",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_candidate",
        type: "address",
      },
    ],
    name: "candidateContract",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_agendaID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_vote",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_comment",
        type: "string",
      },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "maxMember",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "members",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        name: "targets",
        type: "address[]",
      },
      {
        indexed: false,
        name: "noticePeriodSeconds",
        type: "uint128",
      },
      {
        indexed: false,
        name: "votingPeriodSeconds",
        type: "uint128",
      },
      {
        indexed: false,
        name: "atomicExecute",
        type: "bool",
      },
    ],
    name: "AgendaCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        name: "voting",
        type: "uint256",
      },
      {
        indexed: false,
        name: "comment",
        type: "string",
      },
    ],
    name: "AgendaVoteCasted",
    type: "event",
  },
] as const;