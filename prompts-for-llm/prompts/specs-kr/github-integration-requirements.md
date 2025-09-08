# 🔗 Tokamak DAO 아젠다 메타데이터 GitHub 통합 시스템

## 📋 개요

이 문서는 Tokamak DAO 아젠다 메타데이터 생성기에서 GitHub를 통한 메타데이터 저장 및 PR 생성 시스템의 요구사항을 정리한 것입니다.

## 🎯 GitHub 통합 목적

- 아젠다 메타데이터의 중앙 집중식 저장소 관리
- Pull Request를 통한 메타데이터 검토 프로세스
- 자동화된 메타데이터 업데이트 워크플로우
- 버전 관리 및 변경 이력 추적

## 📊 GitHub 저장소 설정

### 저장소 정보 (고정값)
- **Owner**: tokamak-network
- **Repository**: dao-agenda-metadata-repository
- **URL**: https://github.com/tokamak-network/dao-agenda-metadata-repository
- **Branch**: main
- **File Path**: data/agendas/{network}/agenda-{id}.json
- **Note**: 사용자 입력 불필요, 고정값으로 하드코딩

### 파일 구조
```
data/
├── agendas/
│   ├── mainnet/
│   │   ├── agenda-1.json
│   │   ├── agenda-2.json
│   │   └── ...
│   └── sepolia/
│       ├── agenda-1.json
│       ├── agenda-2.json
│       └── ...
```

## 🔧 핵심 기능 요구사항

### 1. GitHub 설정 관리
- **사용자 입력**: GitHub username과 personal access token
- **입력 시점**: PR 생성 직전에만 입력 요구
- **보안**: 토큰의 안전한 저장 및 사용
- **검증**: 입력된 토큰의 유효성 확인

### 2. 메타데이터 저장 기능
- **자동 저장**: 완성된 메타데이터를 올바른 경로에 저장
- **네트워크별 분리**: mainnet/sepolia별 디렉토리 구조
- **파일명 규칙**: agenda-{id}.json 형식
- **JSON 형식**: 표준 JSON 형식으로 저장

### 3. Pull Request 생성 기능
- **자동 PR 생성**: GitHub API를 통한 자동 PR 생성
- **포크 기반**: 사용자 계정으로 저장소 포크 후 PR 제출
- **PR 제목 규칙**: 신규/수정 모드별 다른 제목 형식
- **PR 내용**: 메타데이터 변경 사항 및 설명 포함

## 📝 PR 제목 형식

### 신규 아젠다 생성
```
[Agenda] <network> - <id> - <title>
```

### 기존 아젠다 수정
```
[Agenda Update] <network> - <id> - <title>
```

### 예시
- `[Agenda] sepolia - 123 - Test Agenda`
- `[Agenda Update] mainnet - 456 - Updated Governance Proposal`


## 📊 필수 메타데이터 스키마

### 기본 구조
```typescript
interface AgendaMetadata {
  id: number;                    // 아젠다 ID
  title: string;                 // 아젠다 제목
  description: string;           // 아젠다 설명
  network: "mainnet" | "sepolia"; // 네트워크
  transaction: string;           // 트랜잭션 해시 (사용자가 입력한 트랜잭션 해시)
  creator: {
    address: string;             // 생성자 주소
    signature: string;           // 생성자 서명
  };
  actions: Action[];             // 실행 액션 배열
  createdAt: string;            // 생성 시간 (ISO 8601)
  updatedAt?: string;           // 업데이트 시간 (업데이트시만)
  snapshotUrl?: string;         // 스냅샷 URL (선택)
  discourseUrl?: string;        // 디스코스 URL (선택)
}

interface Action {
  title: string;                // 액션 제목
  contractAddress: string;      // 컨트랙트 주소
  method: string;              // 함수 시그니처
  calldata: string;            // 호출 데이터
  abi: any[];                  // 함수 ABI
  sendEth?: boolean;           // ETH 전송 여부
  id?: string;                 // 액션 ID
  type?: string;               // 액션 타입
}
```

## 🔧 구현 스펙

### 1. GitHub API 타입 정의

```typescript
// src/lib/github.ts
export interface GitHubConfig {
  username: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface PRData {
  title: string;
  body: string;
  head: string;
  base: string;
  files: {
    path: string;
    content: string;
  }[];
}

export const GITHUB_CONFIG: GitHubConfig = {
  username: '', // 사용자 입력
  token: '', // 사용자 입력
  owner: 'tokamak-network',
  repo: 'dao-agenda-metadata-repository',
  branch: 'main'
};
```

### 2. 핵심 함수 구현

```typescript
// GitHub API 핵심 기능
export const createPR = async (
  config: GitHubConfig,
  metadata: AgendaMetadata,
  isUpdate: boolean = false
): Promise<string> => {
  // 1. 저장소 포크 (필요시)
  // 2. 브랜치 생성
  // 3. 파일 업로드
  // 4. PR 생성
  // 5. PR URL 반환
};

export const generatePRTitle = (
  network: string,
  agendaId: number,
  title: string,
  isUpdate: boolean = false
): string => {
  const prefix = isUpdate ? '[Agenda Update]' : '[Agenda]';
  return `${prefix} ${network} - ${agendaId} - ${title}`;
};

export const generatePRBody = (
  metadata: AgendaMetadata,
  isUpdate: boolean = false
): string => {
  // PR 본문 생성 로직
};

export const validateGitHubToken = async (
  username: string,
  token: string
): Promise<boolean> => {
  // 토큰 유효성 검증
};
```

### 3. 메타데이터 검증 시스템
**필수 검증 단계:**
1. JSON 스키마 검증
2. 트랜잭션 존재 확인
3. 생성자 주소 일치 확인
4. 서명 유효성 검증
5. 액션 데이터 일치 확인
6. 시간 기반 보안 검증

## 🎨 UI/UX 요구사항

### GitHub 설정 단계 UI
- **GitHub Username 입력**: 사용자명 입력 필드
- **GitHub Token 입력**: Personal Access Token 입력 필드 (비밀번호 형식)
- **토큰 유효성 검증**: 입력 시 즉시 토큰 유효성 확인
- **보안 안내**: 토큰 생성 방법 및 권한 안내
- **연결 상태**: GitHub 연결 상태 표시

### PR 생성 단계 UI
- **PR 미리보기**: 생성될 PR의 제목과 내용 미리보기
- **진행 상태**: PR 생성 과정의 실시간 상태 표시
- **성공 결과**: 생성된 PR 링크 표시 및 복사 기능
- **오류 처리**: PR 생성 실패 시 상세한 오류 메시지

### 추가 기능
- **PR 히스토리**: 사용자가 생성한 PR 목록 표시
- **PR 상태 추적**: 생성된 PR의 상태 (open, merged, closed) 표시
- **다시 시도**: PR 생성 실패 시 재시도 기능

## 🔒 보안 요구사항

### 1. 토큰 보안
- **안전한 저장**: 토큰을 로컬 스토리지에 암호화하여 저장
- **세션 관리**: 브라우저 세션 종료 시 토큰 삭제
- **최소 권한**: 필요한 최소 권한만 가진 토큰 사용 안내

### 2. API 보안
- **HTTPS 통신**: 모든 GitHub API 통신은 HTTPS 사용
- **토큰 검증**: API 호출 전 토큰 유효성 확인
- **오류 처리**: 민감한 정보가 노출되지 않도록 오류 메시지 처리

### 3. 사용자 데이터 보호
- **개인정보 보호**: 사용자 정보의 안전한 처리
- **로그 관리**: 민감한 정보가 로그에 기록되지 않도록 주의

## 🧪 테스트 시나리오

### Test Case 1: 정상 PR 생성
**Input**:
- Network: Sepolia
- Agenda ID: 123
- Title: "Test Agenda"
- GitHub Username: "testuser"
- GitHub Token: "ghp_xxxxxxxxxxxxxxxx"

**Expected Output**:
- Repository forked successfully
- Branch created: agenda-123-sepolia
- File uploaded: data/agendas/sepolia/agenda-123.json
- PR created: [Agenda] sepolia - 123 - Test Agenda
- PR URL returned
- Status: Success

### Test Case 2: 기존 아젠다 수정 PR
**Input**:
- Network: Mainnet
- Agenda ID: 456
- Title: "Updated Governance Proposal"
- Mode: Update

**Expected Output**:
- Existing metadata loaded
- Updated metadata prepared
- PR created: [Agenda Update] mainnet - 456 - Updated Governance Proposal
- PR URL returned
- Status: Success

### Test Case 3: 잘못된 GitHub 토큰
**Input**:
- GitHub Username: "testuser"
- GitHub Token: "invalid_token"

**Expected Output**:
- Token validation: FAIL
- Error message: "Invalid GitHub token. Please check your token and try again."
- Status: Error

### Test Case 4: 저장소 접근 권한 없음
**Input**:
- Valid token but no access to tokamak-network/dao-agenda-metadata-repository

**Expected Output**:
- Repository access check: FAIL
- Error message: "No access to repository. Please contact repository owner."
- Status: Error

### Test Case 5: 네트워크 오류
**Input**:
- Valid credentials but network connectivity issues

**Expected Output**:
- Network error handling
- Retry mechanism available
- Error message: "Network error. Please check your connection and try again."
- Status: Error

## ⚠️ 중요한 구현 노트

### 1. GitHub API 제한
- **Rate Limiting**: GitHub API 호출 제한 고려
- **에러 처리**: 403, 404, 422 등 다양한 HTTP 상태 코드 처리
- **재시도 로직**: 일시적 오류에 대한 재시도 메커니즘

### 2. 파일 관리
- **파일 존재 확인**: 기존 파일 존재 여부 확인
- **충돌 처리**: 동시 편집 시 충돌 처리
- **백업**: 중요한 변경사항 백업

### 3. 사용자 경험
- **로딩 상태**: API 호출 중 명확한 로딩 표시
- **진행 단계**: PR 생성 과정의 단계별 진행 표시
- **성공 피드백**: PR 생성 성공 시 명확한 피드백

### 4. 오류 처리 개선
- **상세한 오류 메시지**: 각 오류 상황별 명확한 메시지
- **해결 방안 제시**: 오류 발생 시 해결 방법 안내
- **디버깅 정보**: 개발자를 위한 상세한 디버깅 정보

## 📋 검증 체크리스트

### ✅ GitHub 설정 검증
- [ ] GitHub username 입력 및 검증
- [ ] GitHub token 입력 및 유효성 확인
- [ ] 저장소 접근 권한 확인
- [ ] 토큰 권한 검증

### ✅ 메타데이터 저장 검증
- [ ] 올바른 파일 경로 생성
- [ ] JSON 형식 검증
- [ ] 네트워크별 디렉토리 분리
- [ ] 파일명 규칙 준수

### ✅ PR 생성 검증
- [ ] 저장소 포크 기능
- [ ] 브랜치 생성
- [ ] 파일 업로드
- [ ] PR 제목 형식 준수
- [ ] PR 본문 생성
- [ ] PR URL 반환

### ✅ 오류 처리 검증
- [ ] 토큰 오류 처리
- [ ] 네트워크 오류 처리
- [ ] 권한 오류 처리
- [ ] API 제한 처리
- [ ] 재시도 메커니즘

### ✅ 보안 검증
- [ ] 토큰 안전한 저장
- [ ] HTTPS 통신
- [ ] 민감 정보 보호
- [ ] 세션 관리

### ✅ 사용자 경험 검증
- [ ] 명확한 진행 상태 표시
- [ ] 직관적인 오류 메시지
- [ ] 성공 피드백
- [ ] 모바일 지원
