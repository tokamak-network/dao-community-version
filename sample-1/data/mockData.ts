import { AgendaWithMetadata, CommitteeMember } from '@/types/dao';

export const mockAgendas: AgendaWithMetadata[] = [
  {
    id: 1,
    title: "[DAO Committee Proxy] Address of the DAO contract will be upgraded.",
    description: "Proposal to upgrade the DAO contract address",
    author: "C+UHL...D7FE",
    date: "2024.11.20",
    status: "Notice",
    statusColor: "orange",
    votesFor: 0,
    votesAgainst: 0,
    executionTime: null,
    isExecuted: false
  },
  {
    id: 2,
    title: "[DAO Committee Proxy] Address of the DAO contract will be upgraded.",
    description: "Another proposal to upgrade the DAO contract",
    author: "D+VIM...E8GF",
    date: "2024.11.19",
    status: "Notice",
    statusColor: "orange",
    votesFor: 0,
    votesAgainst: 0,
    executionTime: null,
    isExecuted: false
  },
  {
    id: 3,
    title: "[DAO Committee Proxy] Address of the DAO contract will be upgraded.",
    description: "Third proposal for DAO contract upgrade",
    author: "E+WJN...F9HG",
    date: "2024.11.18",
    status: "Open",
    statusColor: "red",
    votesFor: 5,
    votesAgainst: 2,
    executionTime: null,
    isExecuted: false
  },
  {
    id: 4,
    title: "[DAO Committee Proxy] Address of the DAO contract will be upgraded.",
    description: "Fourth proposal for system improvement",
    author: "F+XKO...G0IH",
    date: "2024.11.17",
    status: "Executed",
    statusColor: "green",
    votesFor: 8,
    votesAgainst: 1,
    executionTime: 1700000000,
    isExecuted: true
  },
  {
    id: 5,
    title: "[SeigniorageManager] All the seigniorage rates will be changed",
    description: "Proposal to change seigniorage rates",
    author: "C+UHL...D7FE",
    date: "Apr 3, 2024",
    status: "On going",
    statusColor: "gray",
    votesFor: 2,
    votesAgainst: 0,
    executionTime: null,
    isExecuted: false
  },
  {
    id: 6,
    title: "[Deposit Manager] Add logic to use the Deposit Manager contract..",
    description: "Enhancement to deposit manager functionality",
    author: "C+UHL...D7FE",
    date: "Apr 1, 2024",
    status: "On going",
    statusColor: "gray",
    votesFor: 1,
    votesAgainst: 1,
    executionTime: null,
    isExecuted: false
  },
  {
    id: 7,
    title: "[DAO Committee Proxy] Address of the DAO contract will be upgraded.",
    description: "Legacy proposal for contract upgrade",
    author: "C+UHL...D7FE",
    date: "Mar 7, 2024",
    status: "On going",
    statusColor: "gray",
    votesFor: 0,
    votesAgainst: 0,
    executionTime: null,
    isExecuted: false
  }
];

export const mockCommitteeMembers: CommitteeMember[] = [
  {
    name: "Committee Member 1",
    description: "Active committee member since 2024",
    creationAddress: "0x1234567890123456789012345678901234567890",
    candidateContract: "0x1111111111111111111111111111111111111111",
    claimedTimestamp: 1700000000,
    rewardPeriod: 2592000,
    indexMembers: 0
  },
  {
    name: "Committee Member 2",
    description: "Experienced committee member with 2 years service",
    creationAddress: "0x2345678901234567890123456789012345678901",
    candidateContract: "0x2222222222222222222222222222222222222222",
    claimedTimestamp: 1699000000,
    rewardPeriod: 2592000,
    indexMembers: 1
  },
  {
    name: "Committee Member 3",
    description: "New committee member joined recently",
    creationAddress: "0x3456789012345678901234567890123456789012",
    candidateContract: "0x3333333333333333333333333333333333333333",
    claimedTimestamp: 0,
    rewardPeriod: 2592000,
    indexMembers: 2
  }
];