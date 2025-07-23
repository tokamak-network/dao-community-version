# Agenda PR Prompt Example

## Purpose
Use this prompt to submit agenda (proposal) metadata as a Pull Request (PR) to the repository.

## Example Prompt (EN)
```
Please generate the entire code of the DAO agenda list web app (agenda-list) based on Next.js 14 + wagmi v2, reflecting all the requirements below.

---

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- wagmi v2
- viem
- @tanstack/react-query

## Feature Requirements
- Agenda count: Use the numAgendas() function of the agendaManager contract
- Agenda list: Display agenda numbers in reverse order from the latest to 0
- Agenda details: Retrieve detailed information using the agendas(index) function of the agendaManager contract
- Network selection: Switch between Mainnet/Sepolia, manage contract addresses separately for each network
- On agenda number click, show details in a card format
- currentAgendaStatus: Use the currentAgendaStatus(_agendaID) function of the committee contract to fetch real-time status/result (return value may be an array)
- Loading/Error handling: Show loading/error UI for all data fetches
- Convert timestamps to human-readable dates
- Handle BigInt values safely for display/serialization
- Implement enum mapping exactly as below for agendas/committee respectively

## Contract Addresses
- Mainnet
  - committee: 0xDD9f0cCc044B0781289Ee318e5971b0139602C26
  - agendaManager: 0xcD4421d082752f363E1687544a09d5112cD4f484
- Sepolia
  - committee: 0xA2101482b28E3D99ff6ced517bA41EFf4971a386
  - agendaManager: 0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08

## Required ABI

  [
    {
      "inputs": [],
      "name": "numAgendas",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_index", "type": "uint256" }],
      "name": "agendas",
      "outputs": [{
        "components": [
          { "internalType": "uint256", "name": "createdTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "noticeEndTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "votingPeriodInSeconds", "type": "uint256" },
          { "internalType": "uint256", "name": "votingStartedTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "votingEndTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "executableLimitTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "executedTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "countingYes", "type": "uint256" },
          { "internalType": "uint256", "name": "countingNo", "type": "uint256" },
          { "internalType": "uint256", "name": "countingAbstain", "type": "uint256" },
          { "internalType": "uint8", "name": "status", "type": "uint8" },
          { "internalType": "uint8", "name": "result", "type": "uint8" },
          { "internalType": "address[]", "name": "voters", "type": "address[]" },
          { "internalType": "bool", "name": "executed", "type": "bool" }
        ],
        "internalType": "struct LibAgenda.Agenda",
        "name": "",
        "type": "tuple"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
      "name": "currentAgendaStatus",
      "outputs": [
        { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
        { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

## Enum Mapping (Implement exactly as below, separately for each)
- agendas function (agenda manager contract)
  - status: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED
  - result: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS
- currentAgendaStatus function (committee contract)
  - status: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA
  - result: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS, 4=NO_CONSENSUS, 5=NO_AGENDA

## UI Requirements
- Use only simple and clean inline styles (no separate CSS files)
- Responsive design
- Network selection dropdown, display both currently selected committee/agendaManager addresses
- Display total agenda count
- On agenda number click, expand details in card format
- Display currentAgendaStatus result in a separate section
- Ensure type safety for BigInt, array returns, etc.

## Important
- Use the latest wagmi v2 syntax
- QueryClientProvider, WagmiProvider setup required (separate client component)
- Explicitly specify chainId in useReadContract
- Be careful parsing currentAgendaStatus return value as it may be an array
- Reflect all network-specific addresses/ABI/enum mappings accurately

## Additional
- Write the entire code as a single runnable Next.js 14 App Router project
```



## Example Prompt (KR)
```
아래 요구사항을 모두 반영해 Next.js 14 + wagmi v2 기반 DAO 아젠다 목록 웹앱 ( agenda-list ) 전체 코드를 생성해 주세요.

---

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- wagmi v2
- viem
- @tanstack/react-query

## 기능 요구사항
- 아젠다 개수 조회: agendaManager 컨트랙트의 numAgendas() 함수 사용
- 아젠다 목록: 최신 아젠다부터 0번까지 역순으로 번호만 리스트로 표시
- 아젠다 상세: agendaManager 컨트랙트의 agendas(index) 함수로 상세 정보 조회
- 네트워크 선택: 메인넷/세폴리아 전환, 각 네트워크별 컨트랙트 주소 분리 관리
- 아젠다 번호 클릭 시 카드 형태로 상세 정보 표시
- currentAgendaStatus: committee 컨트랙트의 currentAgendaStatus(_agendaID) 함수로 실시간 상태/결과 조회 (반환값이 배열일 수 있음)
- 로딩/에러 처리: 모든 데이터 fetch에 대해 로딩/에러 UI 처리
- 타임스탬프는 읽기 쉬운 날짜로 변환
- BigInt 값은 화면 출력/직렬화 시 안전하게 처리
- Enum 매핑은 agendas용/committee용을 아래와 같이 각각 정확히 구현

## 컨트랙트 주소
- 메인넷
  - committee: 0xDD9f0cCc044B0781289Ee318e5971b0139602C26
  - agendaManager: 0xcD4421d082752f363E1687544a09d5112cD4f484
- 세폴리아
  - committee: 0xA2101482b28E3D99ff6ced517bA41EFf4971a386
  - agendaManager: 0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08

## 필요한 ABI
  [
    {
      "inputs": [],
      "name": "numAgendas",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_index", "type": "uint256" }],
      "name": "agendas",
      "outputs": [{
        "components": [
          { "internalType": "uint256", "name": "createdTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "noticeEndTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "votingPeriodInSeconds", "type": "uint256" },
          { "internalType": "uint256", "name": "votingStartedTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "votingEndTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "executableLimitTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "executedTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "countingYes", "type": "uint256" },
          { "internalType": "uint256", "name": "countingNo", "type": "uint256" },
          { "internalType": "uint256", "name": "countingAbstain", "type": "uint256" },
          { "internalType": "uint8", "name": "status", "type": "uint8" },
          { "internalType": "uint8", "name": "result", "type": "uint8" },
          { "internalType": "address[]", "name": "voters", "type": "address[]" },
          { "internalType": "bool", "name": "executed", "type": "bool" }
        ],
        "internalType": "struct LibAgenda.Agenda",
        "name": "",
        "type": "tuple"
      }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_agendaID", "type": "uint256" }],
      "name": "currentAgendaStatus",
      "outputs": [
        { "internalType": "uint256", "name": "agendaResult", "type": "uint256" },
        { "internalType": "uint256", "name": "agendaStatus", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

## Enum 매핑 (반드시 아래와 같이 구분해서 구현)
- agendas 함수(아젠다 매니저 컨트랙트)
  - status: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED
  - result: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS
- currentAgendaStatus 함수(커미티 컨트랙트)
  - status: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA
  - result: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS, 4=NO_CONSENSUS, 5=NO_AGENDA

## UI 요구사항
- 심플하고 깔끔한 인라인 스타일만 사용 (별도 CSS 파일 없이)
- 반응형 디자인
- 네트워크 선택 드롭다운, 현재 선택된 committee/agendaManager 주소 모두 표시
- 총 아젠다 개수 표시
- 아젠다 번호 클릭 시 카드 형태로 상세 정보 펼쳐짐
- currentAgendaStatus의 결과도 별도 섹션으로 표시
- BigInt, 배열 반환 등 타입 안전성 확보

## 중요
- wagmi v2 최신 문법 사용
- QueryClientProvider, WagmiProvider 설정 필수 (클라이언트 컴포넌트 분리)
- useReadContract에 chainId 명시적 지정
- currentAgendaStatus 반환값이 배열일 수 있으니 파싱에 유의
- 모든 네트워크별 주소/ABI/enum 매핑 정확히 반영

## 추가
- 코드 전체를 하나의 실행 가능한 Next.js 14 App Router 프로젝트로 작성

```
