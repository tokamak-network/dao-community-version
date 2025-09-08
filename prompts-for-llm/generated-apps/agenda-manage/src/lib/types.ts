export interface AgendaData {
  createdTimestamp: bigint
  noticeEndTimestamp: bigint
  votingPeriodInSeconds: bigint
  votingStartedTimestamp: bigint
  votingEndTimestamp: bigint
  executableLimitTimestamp: bigint
  executedTimestamp: bigint
  countingYes: bigint
  countingNo: bigint
  countingAbstain: bigint
  status: number
  result: number
  voters: readonly `0x${string}`[]
  executed: boolean
}

export interface MemberInfo {
  address: `0x${string}`
  candidateContract: `0x${string}`
  hasVoted: boolean
  vote: number
  managerAddress?: `0x${string}`
}

export interface ContractAddresses {
  ton: `0x${string}`
  committee: `0x${string}`
  agendaManager: `0x${string}`
}

export interface VoteStatus {
  hasVoted: boolean
  vote: number
}

export interface AgendaStatus {
  agendaResult: bigint
  agendaStatus: bigint
}

export const VOTE_TYPES = {
  1: 'For',
  2: 'Against',
  3: 'Abstain'
} as const

export const AGENDA_STATUS = {
  0: 'Pending',
  1: 'Notice Period',
  2: 'Voting',
  3: 'Waiting for Execution',
  4: 'Executed',
  5: 'Ended',
  6: 'No Agenda'
} as const

export const AGENDA_RESULT = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Dismiss',
  4: 'No Consensus',
  5: 'No Agenda'
} as const

export const MESSAGES = {
  WALLET_CONNECTION_REQUIRED: "🔗 Wallet connection required. Please connect your wallet to vote.",
  VOTING_NOT_STARTED: "⏰ Voting has not started yet.",
  VOTING_ENDED: "⏰ Voting period has ended.",
  AGENDA_EXECUTED: "✅ Agenda execution completed!",
  AGENDA_APPROVED: "✅ Voting completed - Agenda approved!",
  AGENDA_REJECTED: "❌ Voting completed - Agenda rejected",
  NO_VOTING_PERMISSION: "❌ You don't have voting permission.",
  ALL_MEMBERS_VOTED: "🗳️ All committee members have completed voting.",
  VOTING_IN_PROGRESS: "🗳️ Voting in progress...",
  BLOCKCHAIN_CONFIRMING: "⏳ Confirming on blockchain...",
  EXECUTING: "🚀 Executing...",
  EXECUTION_READY: "✅ Execution ready! The agenda can be executed.",
  EXECUTION_COMPLETED: "✅ Executed",
  EXECUTION_WALLET_REQUIRED: "🔗 Wallet connection required. Please connect your wallet first to execute the agenda.",
  EXECUTION_PERIOD_EXPIRED: "⏰ Execution period has expired",
  EXECUTION_NO_CONSENSUS: "❌ Agenda failed to reach consensus",
  EXECUTION_NOT_APPROVED: "❌ Agenda was not approved (more votes against)",
  EXECUTION_WAITING_VOTE: "⏳ Waiting for voting to complete",
  VOTE_FOR: "For",
  VOTE_AGAINST: "Against",
  VOTE_ABSTAIN: "Abstain",
  STATUS_VOTING: "Voting",
  STATUS_WAITING_EXEC: "Waiting for Execution",
  STATUS_EXECUTED: "Executed",
  STATUS_ENDED: "Ended"
} as const