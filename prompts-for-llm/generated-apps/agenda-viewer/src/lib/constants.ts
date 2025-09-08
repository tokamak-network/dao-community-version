export const AGENDA_STATUS = {
  0: { text: 'NONE', color: 'gray', description: 'No status' },
  1: { text: 'NOTICE', color: 'blue', description: 'Notice period' },
  2: { text: 'VOTING', color: 'green', description: 'Voting in progress' },
  3: { text: 'WAITING_EXEC', color: 'orange', description: 'Waiting for execution' },
  4: { text: 'EXECUTED', color: 'purple', description: 'Executed' },
  5: { text: 'ENDED', color: 'red', description: 'Ended' }
} as const;

export const AGENDA_RESULT = {
  0: { text: 'PENDING', color: 'gray', description: 'Pending result' },
  1: { text: 'ACCEPT', color: 'green', description: 'Accepted' },
  2: { text: 'REJECT', color: 'red', description: 'Rejected' },
  3: { text: 'DISMISS', color: 'yellow', description: 'Dismissed' }
} as const;

export const COMMITTEE_STATUS = {
  0: { text: 'NONE', color: 'gray' },
  1: { text: 'NOTICE', color: 'blue' },
  2: { text: 'VOTING', color: 'green' },
  3: { text: 'WAITING_EXEC', color: 'orange' },
  4: { text: 'EXECUTED', color: 'purple' },
  5: { text: 'ENDED', color: 'red' },
  6: { text: 'NO_AGENDA', color: 'gray' }
} as const;

export const COMMITTEE_RESULT = {
  0: { text: 'PENDING', color: 'gray' },
  1: { text: 'ACCEPT', color: 'green' },
  2: { text: 'REJECT', color: 'red' },
  3: { text: 'DISMISS', color: 'yellow' },
  4: { text: 'NO_CONSENSUS', color: 'orange' },
  5: { text: 'NO_AGENDA', color: 'gray' }
} as const;