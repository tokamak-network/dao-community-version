#### Agenda Real-time Status Updates

**DAO Committee Version-specific status checking:**

**DAO Committee v2:**
- `Committee.currentAgendaStatus(id)` function available
- Returns real-time status and result: `[agendaResult, agendaStatus]`
- `Committee.agendaMemo(agendaId)` - Agenda memo with URL auto-linking

**DAO Committee v1:**
- `Committee.currentAgendaStatus(id)` function not available
- Only use `AgendaManager.agendas(id)` status field

**Status Mapping (v2 only):**
- **AgendaStatus → English Text:**
  - 0 = Pending
  - 1 = Notice Period
  - 2 = Voting
  - 3 = Waiting for Execution
  - 4 = Executed
  - 5 = Ended
  - 6 = NO AGENDA

- **AgendaResult → English Text:**
  - 0 = Pending
  - 1 = Approved
  - 2 = Rejected
  - 3 = DISMISS
  - 4 = NO CONSENSUS
  - 5 = NO AGENDA
