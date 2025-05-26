export const DAO_ABI = [
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
] as const;
