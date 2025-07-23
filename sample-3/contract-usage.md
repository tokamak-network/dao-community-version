# DAO Smart Contract Usage Guide

이 문서는 DAO AgendaManager 및 DAOCommittee 스마트컨트랙트에서 아젠다 리스트와 상세 정보를 조회하는 방법을 정리합니다.

---

## 아젠다 리스트 가져오기

1. **총 개수 조회**
   - `AgendaManager.numAgendas()` 호출 → 전체 아젠다 개수 반환
2. **최신/첫 아젠다 번호**
   - 최신 아젠다 번호: `numAgendas - 1`
   - 첫 아젠다 번호: `0`
3. **목록 표시**
   - 최신 아젠다부터 역순으로 번호를 나열 (예: [numAgendas-1, ..., 0])

### 예제
   - React 예제: `snippets/react/agenda-list.tsx`

### prompt :

---

## 특정 아젠다(No)의 상세 정보 가져오기

1. **기본 정보**
   - `AgendaManager.agendas(No)` 호출 → `LibAgenda.Agenda` 구조체 반환
   - 구조체 필드:
     - `createdTimestamp`, `noticeEndTimestamp`, `votingPeriodInSeconds`, `votingStartedTimestamp`, `votingEndTimestamp`, `executableLimitTimestamp`, `executedTimestamp`
     - `countingYes`, `countingNo`, `countingAbstain`
     - `status`, `result`
     - `voters`, `executed`
2. **상태 정보**
   - `DAOCommittee.currentAgendaStatus(No)` 호출 → `(agendaResult, agendaStatus)` 반환
    - 반환값 설명
     - Result -> 0: pending, 1: ACCEPT, 2: REJECT, 3: DISMISS, 4: NO CONSENSUS, 5: NO AGENDA
     - Status -> 0: NONE, 1: NOTICE, 2: VOTING, 3: WAITING_EXEC, 4: EXECUTED, 5: ENDED, 6: NO AGENDA


### 예제
    - React 예제: `snippets/react/agenda-detail.tsx`


---

## LibAgenda.Agenda 구조체 예시

```solidity
struct Agenda {
    uint256 createdTimestamp;
    uint256 noticeEndTimestamp;
    uint256 votingPeriodInSeconds;
    uint256 votingStartedTimestamp;
    uint256 votingEndTimestamp;
    uint256 executableLimitTimestamp;
    uint256 executedTimestamp;
    uint256 countingYes;
    uint256 countingNo;
    uint256 countingAbstain;
    AgendaStatus status;
    AgendaResult result;
    address[] voters;
    bool executed;
}
```

---
