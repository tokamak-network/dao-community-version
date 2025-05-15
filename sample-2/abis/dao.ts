export const DAO_ABI = [
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
