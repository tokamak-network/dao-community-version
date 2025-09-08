export const CONTRACT_ADDRESSES = {
  1: {
    ton: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5' as `0x${string}`,
    committee: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as `0x${string}`,
    agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484' as `0x${string}`,
  },
  11155111: {
    ton: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044' as `0x${string}`,
    committee: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as `0x${string}`,
    agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as `0x${string}`,
  },
} as const

export type ContractAddresses = {
  ton: `0x${string}`
  committee: `0x${string}`
  agendaManager: `0x${string}`
}