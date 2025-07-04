# Tokamak DAO 커뮤니티 버전 웹 애플리케이션

이 프로젝트는 Tokamak DAO(탈중앙화 자율조직) 커뮤니티 운영을 위한 웹 애플리케이션입니다.

---

## Table of Documents

- Features
- 폴더 구조
- 주요 모듈 및 함수
- 실행 방법


## Features

### DAO 커미티 메뉴

- **커미티 멤버 리스트**: 모든 DAO 커미티 멤버와 그 정보를 조회할 수 있습니다.
- **멤버 상태 확인**: 현재 사용자가 커미티 멤버인지 확인할 수 있습니다.
- **Layer2 후보자**: Layer2 챌린지 후보자를 조회 및 관리할 수 있습니다.
- **커미티 멤버 새로고침**: 블록체인에서 커미티 멤버 데이터를 새로고침합니다.
- **활동 보상 청구**: (해당되는 경우) 활동 보상을 청구할 수 있습니다.
- **챌린지 분석**: 챌린지 진행 상황과 결과를 분석 및 표시하고, (해당되는 경우) 챌린지를 요청할 수 있습니다.
- **멤버 은퇴**: (해당되는 경우) 멤버에서 은퇴할 수 있습니다.


### 아젠다 메뉴

- **아젠다 생성**: 새로운 아젠다(온체인 제안)를 생성할 수 있습니다.
- **아젠다 시뮬레이션**: 아젠다를 온체인에 제출하기 전에 로컬에 노드를 하드포크하여 사전 시뮬레이션 기능을 제공합니다. 시뮬레이션을 통해 온체인 실행결과와 가스비를 미리 알 수 있습니다.
- **아젠다 메타데이타 제출**: 아젠다 생성시, 아젠다 저장소에 아젠다 메타데이타를 제출하는 인터페이스를 제공합니다. 아젠다 메타데이타 저장소에 제출하면, 등록한 아젠다를 사용자들이 시각적으로 쉽게 인지할 수 있도록 합니다.
- **아젠다 리스트 및 상세**: 아젠다 목록과 상세 정보를 조회할 수 있습니다.
- **투표**: (다오 멤버인 경우) 아젠다에 투표할 수 있으며, 온체인 트랜잭션 및 UI 피드백이 제공됩니다.
- **실행**: 조건이 충족되면 누구든지 아젠다를 실행할 수 있습니다.
- **실시간 이벤트 모니터링**: 블록체인에서 AgendaCreated(아젠다 생성), VoteCasted(투표), AgendaExecuted(아젠다 실행) 이벤트가 발생하면 UI(아젠다의 상태)가 즉시 갱신됩니다.
- **프로그레시브 페이지네이션**: 아젠다 목록은 배치 단위로 불러와 성능과 UX를 개선합니다.
- **워커 시스템을 통한 배치 로딩**: 아젠다 목록은 백그라운드 워커가 배치 단위로 데이터를 불러오며, 레이트 리미팅 및 중단(Abort)도 지원합니다.
- **설정 가능한 배치 딜레이**: 환경 변수로 아젠다 로딩 배치 딜레이를 설정할 수 있습니다.
- **에러 처리**: 404, 네트워크 등 다양한 에러 상황에 대한 UI 및 상태 관리가 제공됩니다.
- **Context 기반 상태 관리**: 전역 상태와 페이지네이션 전용 상태를 분리하여 성능과 유지보수성을 높였습니다.

### 공통

- **컨트랙트 연동**: 모든 주요 액션(아젠다, 투표, 실행 등)은 스마트 컨트랙트와 직접 연동됩니다.
- **환경 변수 기반 설정**: RPC URL, 컨트랙트 주소, 배치 딜레이 등 주요 파라미터를 환경 변수로 설정할 수 있습니다.



## 폴더 구조

```
dao-community-sample/
├── app/                    # Next.js 13+ App Router
│   ├── agenda/            # 아젠다 관련 페이지
│   │   ├── [id]/         # 아젠다 상세 페이지
│   │   └── page.tsx      # 아젠다 목록 페이지
│   ├── dao-committee/    # DAO 커미티 페이지
│   ├── api/              # API 라우트
│   │   └── submit-pr/    # PR 제출 API
│   ├── layout.tsx        # 루트 레이아웃
│   ├── providers.tsx     # 프로바이더 설정
│   └── page.tsx          # 메인 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── agenda/           # 아젠다 관련 컴포넌트
│   ├── dao/              # DAO 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── modals/           # 모달 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   └── wallet/           # 지갑 연동 컴포넌트
├── contexts/             # React Context
│   └── CombinedDAOContext.tsx
├── lib/                  # 유틸리티 함수 및 라이브러리
│   ├── agenda-*.ts       # 아젠다 관련 로직
│   ├── dao-*.ts          # DAO 관련 로직
│   ├── utils.ts          # 공통 유틸리티
│   └── signature.ts      # 서명 관련 함수
├── types/                # TypeScript 타입 정의
├── hooks/                # 커스텀 훅
├── utils/                # 유틸리티 함수
├── config/               # 설정 파일
├── constants/            # 상수 정의
└── abis/                 # 스마트 컨트랙트 ABI
```

## 주요 모듈 및 함수

### CombinedDAOContext

**위치**: `contexts/CombinedDAOContext.tsx`

- **역할**: DAO 및 아젠다 관리를 위한 전역 상태 관리
- **주요 기능**:
  - 아젠다 목록 및 상세 정보 관리
  - DAO 커미티 멤버 정보 관리
  - Layer2 후보자 관리
  - 실시간 이벤트 모니터링
  - 블록체인 상태와 UI 동기화

### 다오커미티 컴포넌트

**위치**: `components/dao/`, `app/dao-committee/`

- **주요 컴포넌트**:
  - `CheckChallengeButton.tsx`: 챌린지 확인 및 요청 버튼
- **기능**:
  - 커미티 멤버 목록 표시
  - 멤버 상태 확인 및 관리
  - 챌린지 분석 및 처리
  - 활동 보상 청구

### AgendaPagination

**위치**: `lib/agenda-pagination.ts`

- **역할**: 아젠다의 프로그레시브 페이지네이션 처리
- **주요 기능**:
  - 배치 단위 아젠다 로딩
  - 중복 없는 upsert(추가/갱신) 로직
  - 레이트 리미팅 및 중단 지원
  - 성능 최적화된 데이터 로딩

### 워커

**위치**: `lib/shared-rpc-client.ts`, `lib/rpc-utils.ts`

- **역할**: 백그라운드 배치 작업 및 RPC 요청 관리
- **주요 기능**:
  - 멀티워커 RPC 요청 처리
  - 우선순위 기반 큐 관리
  - 레이트 리미팅 및 에러 처리
  - 진행률 추적 및 모니터링

### 시뮬레이션

**위치**: `components/ui/proposal-impact-overview.tsx`

- **역할**: 아젠다 실행 전 시뮬레이션 제공
- **주요 기능**:
  - 로컬 노드 하드포크를 통한 시뮬레이션
  - 가스비 및 실행 결과 미리 확인
  - 실시간 시뮬레이션 로그 표시
  - 에러 및 성공 케이스 처리

### PR 제출

**위치**: `app/api/submit-pr/route.ts`, `components/modals/AgendaSubmissionModal.tsx`

- **역할**: 아젠다 메타데이터를 GitHub 저장소에 PR로 제출
- **주요 기능**:
  - 자동 포크 및 브랜치 생성
  - 메타데이터 파일 생성 및 업데이트
  - PR 생성 및 제출
  - 로컬 백업 파일 다운로드

### 이벤트 구독 및 반영

**위치**: `lib/agenda-event-monitor.ts`, `lib/dao-event-monitor.ts`

- **역할**: 블록체인 이벤트 실시간 모니터링 및 UI 반영
- **주요 기능**:
  - AgendaCreated, VoteCasted, AgendaExecuted 이벤트 구독
  - 이벤트 발생 시 UI 상태 즉시 갱신
  - 이벤트 핸들러를 통한 상태 업데이트
  - 에러 처리 및 재연결 로직

## 환경설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

### 필수 환경 변수

```bash
# 체인 설정
NEXT_PUBLIC_CHAIN_ID=11155111                    # 1: 메인넷, 11155111: 세폴리아
NEXT_PUBLIC_CHAIN_NAME=Sepolia                   # 체인 이름
NEXT_PUBLIC_CHAIN_NETWORK=sepolia                # 네트워크 이름

# RPC 설정
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_LOCALHOST_RPC_URL=http://localhost:8545  # 시뮬레이션용

# 컨트랙트 주소
NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS=0x...     # DAO 아젠다 매니저 주소
NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS=0x...    # DAO 커미티 프록시 주소
NEXT_PUBLIC_TON_CONTRACT_ADDRESS=0x...           # TON 컨트랙트 주소
NEXT_PUBLIC_SEIG_MANAGER_ADDRESS=0x...           # 세이그 매니저 주소
NEXT_PUBLIC_LAYER2_MANAGER_ADDRESS=0x...         # Layer2 매니저 주소
NEXT_PUBLIC_LAYER2_REGISTRY_ADDRESS=0x...        # Layer2 레지스트리 주소
```

### 선택적 환경 변수

```bash
# 성능 튜닝
NEXT_PUBLIC_CONTRACT_BATCH_DELAY_MS=1500         # 배치 로딩 딜레이 (ms)
NEXT_PUBLIC_CONTRACT_BATCH_SIZE=3                # 배치 크기
NEXT_PUBLIC_CONTRACT_CACHE_DURATION_MS=12000     # 캐시 지속 시간 (ms)

# 이벤트 모니터링
NEXT_PUBLIC_EVENT_START_BLOCK=0                  # 이벤트 시작 블록
NEXT_PUBLIC_BLOCK_RANGE=500                      # 블록 범위
NEXT_PUBLIC_POLLING_INTERVAL=60000               # 폴링 간격 (ms)

# 워커 설정
NEXT_PUBLIC_RPC_WORKER_COUNT=5                   # RPC 워커 개수
NEXT_PUBLIC_WORKER_REQUEST_INTERVAL=300          # 워커 요청 간격 (ms)
```

### GitHub 설정 (PR 제출용)

```bash
# GitHub 설정
GITHUB_TOKEN=your_github_token                   # GitHub 개인 액세스 토큰
GITHUB_FORK_OWNER=your_github_username           # 포크 소유자
GITHUB_FORK_REPO=dao-agenda-metadata-repository  # 포크 저장소
GITHUB_BASE_OWNER=tokamak-network                # 베이스 소유자
GITHUB_BASE_REPO=dao-agenda-metadata-repository  # 베이스 저장소
```

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 위의 환경 변수를 설정합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm run start
```

### 5. 지갑 연결

- MetaMask 또는 호환 지갑을 설치합니다
- 설정한 네트워크(메인넷 또는 세폴리아)에 연결합니다
- 지갑을 연결하여 DAO 기능을 사용합니다

### 6. 시뮬레이션 서버 (선택사항)

아젠다 시뮬레이션 기능을 사용하려면 로컬 노드가 필요합니다:

```bash
# Hardhat 또는 Anvil 로컬 노드 실행
npx hardhat node
# 또는
anvil
```

### 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Blockchain**: wagmi, viem, ethers.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Context
- **Build Tool**: Next.js




