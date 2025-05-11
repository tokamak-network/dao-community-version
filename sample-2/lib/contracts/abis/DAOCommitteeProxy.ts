export const DAOCommitteeProxyABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "target",
        type: "address[]",
      },
    ],
    name: "AgendaExecuted",
    type: "event",
  },
] as const;
