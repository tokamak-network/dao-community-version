# 🏛️ Tokamak DAO 아젠다 메타데이터 생성기

## 📋 구현 요청

```
Tokamak DAO 아젠다 메타데이터를 생성하고 관리하는 완전한 웹 애플리케이션을 구현해주세요.
```

## 🎯 핵심 기능 요구사항

## 🎯 핵심 워크플로우

### Step 1: 트랜잭션 입력
**사용자 동작:**
1. 네트워크 선택 (mainnet/sepolia) - 필수
2. 트랜잭션 해시 입력
3. "Parse Transaction" 버튼 클릭

**시스템 동작:**
1. 트랜잭션 해시 형식 검증
2. 선택된 네트워크에서 트랜잭션 조회
3. AgendaCreated 이벤트 파싱
4. 아젠다 정보 추출 및 표시
5. 자동으로 Step 2로 이동

**에러 처리:**
- 잘못된 해시 형식: "Invalid transaction hash format"
- 트랜잭션 없음: "Transaction not found on selected network"
- 아젠다 이벤트 없음: "Not an agenda creation transaction"

### Step 2: 메타데이터 입력
**사용자 동작:**
1. 아젠다 제목 입력 (필수)
2. 아젠다 설명 입력 (필수)
3. 스냅샷 URL 입력 (선택)
4. 디스코스 URL 입력 (선택)
5. 액션 정보 입력 (함수 시그니처, 파라미터)

**시스템 동작:**
1. 자동 파싱된 메모 URL 표시 (있는 경우)
2. 실시간 JSON 미리보기 생성
3. 콜데이터 검증 (입력값 vs 원본)

### Step 3: 지갑 연결 및 서명
**사용자 동작:**
1. "Connect Wallet" 버튼 클릭
2. 메타마스크에서 서명 승인

**시스템 동작:**
1. 서명 메시지 생성
2. 서명 유효성 검증
3. 1시간 유효성 확인

### Step 4: 유효성 검증
**시스템 동작:**
1. 메타데이터 스키마 검증
2. 서명 검증
3. 타임스탬프 검증 (1시간 이내)
4. 전체 데이터 무결성 검증

**검증 결과:**
- ✅ 모든 검증 통과 시: "Validation successful" 메시지 표시
- ❌ 검증 실패 시: 구체적인 오류 메시지 표시

### Step 5: GitHub 설정
**사용자 동작:**
1. GitHub Username 입력
2. GitHub Personal Access Token 입력

**시스템 동작:**
1. 토큰 유효성 검증
2. 저장소 접근 권한 확인

### Step 6: PR 생성
**사용자 동작:**
1. "Create Pull Request" 버튼 클릭

**시스템 동작:**
1. 저장소 포크
2. 메타데이터 파일 생성
3. PR 생성
4. PR URL 반환
5. 변경 파일 제한 검증: 메타데이터 파일 1개만 변경되었는지 확인 (다른 코드/파일 변경 금지)

#### PR 변경 제한 (중요)
- PR은 반드시 "메타데이터 파일 1개만" 추가/수정해야 함
  - 허용 경로 예시: `metadata/{network}/{agendaId}.json` 또는 프로젝트에서 정의한 메타데이터 디렉터리 구조
  - 허용 파일 확장자: `.json` (기타 확장자 금지)
  - 신규 생성 모드: 해당 경로에 새 파일 1개 추가
  - 수정 모드: 해당 경로의 기존 파일 1개만 수정
- 금지 사항:
  - 소스 코드, 구성 파일, 문서 등 메타데이터 이외의 파일 변경 금지
  - 다수 파일 변경 금지 (변경 파일 수는 정확히 1개여야 함)
- 검증 로직(권장):
  - 포크 브랜치 작업 후 git diff로 변경 파일 목록 수집
  - 변경 파일 수가 1개인지 검사
  - 변경 파일 경로와 확장자가 허용 범위인지 검사
  - 위반 시 PR 생성 중단 및 사용자에게 오류 메시지 표시

#### 🔄 자동 모드 판단
- **신규 생성 모드**: 아젠다 ID가 존재하지 않거나 메타데이터가 없을 때
- **수정 모드**: 아젠다 ID가 존재하고 메타데이터가 있을 때

**중요**:
- 지갑 연결은 서명 단계에서만 필요, 초기에는 연결 불필요
- **네트워크 선택 필수**: 트랜잭션 조회를 위해 mainnet/sepolia 중 선택 필요
- **GitHub 설정은 최종 단계**: 메타데이터 작성과 서명 완료 후 PR 생성 직전에만 입력

### 1. 아젠다 메타데이터 생성 및 관리
**입력 정보:**
- 트랜잭션 해시 (아젠다 생성 트랜잭션)
- 아젠다 제목 (title)
- 아젠다 설명 (description)
- 스냅샷 URL (선택사항)
- 디스코스 URL (선택사항)
- 액션별 함수 시그니처입력받음.
- Git 본인 계정
- Git 토큰 정보

**자동 생성 정보:**
- 아젠다 ID (트랜잭션에서 추출)
- 네트워크 (현재 연결된 네트워크)
- 생성자 주소 (트랜잭션에서 추출)
- 액션 배열 (트랜잭션 calldata에서 파싱)
- 액션별 함수 시그니처에 따른 파라미터(트랜잭션 콜데이터에서 파싱)
- 생성 시각 (현재 시간 - 보여줄때는 사용자 타임존으로, 메타데이타에서는 메타데이타 양식에 맞게 저장 )
- 스냅샷 URL (트랜잭션을 calldata에서 파싱하여, 메모이 있는경우, 스냅샷 url에 자동 입력)

### 아젠다 생성 트랜재션 분석:
**참고 문서**: `./specs/agenda-calldata-structure.md`

### Signature System
**참고 문서**: `./specs/signature-system-requirements.md`

### GitHub 와 PR 설정 기능
**참고 문서**: `./specs/github-integration-requirements.md`


## 🎨 UI/UX 요구사항

### 헤더 섹션
- 지갑 연결 상태 및 주소 표시
- 네트워크 선택기 (메인넷/세폴리아)
- 현재 컨트랙트 주소 표시

### 메인 기능 섹션

#### 1. 트랜잭션 입력 단계
**컴포넌트:** TransactionInput

**Props:**
```typescript
interface TransactionInputProps {
  onTransactionParsed: (transaction: ParsedTransaction) => void
  onError: (error: string) => void
  initialNetwork?: 'mainnet' | 'sepolia' // 기본값: 'sepolia'
}
```

**상태 관리:**
```typescript
const [txHash, setTxHash] = useState('')
const [network, setNetwork] = useState<'mainnet' | 'sepolia'>('sepolia')
const [isLoading, setIsLoading] = useState(false)
const [validationError, setValidationError] = useState('')
```

**UI 요소:**
- 네트워크 선택 드롭다운 (mainnet/sepolia) - 필수
- 트랜잭션 해시 입력 필드
- "Parse Transaction" 버튼
- 로딩 상태 표시
- 에러 메시지 표시

**핸들러:**
```typescript
const handleParse = async () => {
  // 1. 입력 검증
  if (!txHash.trim()) {
    setValidationError('Transaction hash is required')
    return
  }
  if (!safe.validateTxHash(txHash)) {
    setValidationError('Invalid transaction hash format')
    return
  }

  // 2. 트랜잭션 파싱
  setIsLoading(true)
  try {
    const chainId = network === 'mainnet' ? 1 : 11155111
    const parsedTx = await parseAgendaTransaction(txHash, chainId)
    onTransactionParsed(parsedTx)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction'
    setValidationError(errorMessage)
    onError(errorMessage)
  } finally {
    setIsLoading(false)
  }
}
```

#### 2. 메타데이터 입력 단계
- 아젠다 제목 입력
- 아젠다 설명 입력 (텍스트에리어)
- 스냅샷 URL 입력 (선택사항)
  - **자동 파싱된 메모 URL 표시**: 트랜잭션에서 추출된 메모 URL을 읽기 전용으로 표시
  - **수동 입력 가능**: 자동 파싱된 URL이 없거나 수정이 필요한 경우 수동 입력
  - **파싱 상태 표시**: "메모 URL 파싱 중...", "메모 URL 발견: [URL]", "메모 URL 없음" 등 상태 표시
- 디스코스 URL 입력 (선택사항)
- 액션 배열 (트랜잭션의 calldata파싱하여 타겟배열 수만큼의 ActionEditor 컴포넌트로 표시)
  - **ActionEditor 컴포넌트 필수 구현:**
    - 컨트랙트 주소 입력 (유효성 검증: 0x + 40자리 hex)
    - 함수 시그니처 입력 (`transfer(address,uint256)` 형식)
    - **동적 파라미터 필드 생성**: 함수 시그니처 파싱 후 자동으로 파라미터 입력 필드 생성
    - **타입별 검증**: address, uint256, bool, string, bytes, 배열 타입별 실시간 검증
    - **실시간 콜데이터 생성**: ethers.js Interface 사용하여 입력값으로 콜데이터 생성
    - **콜데이터 비교 검증**: 생성된 콜데이터와 원본 트랜잭션 콜데이터 실시간 비교
    - **시각적 검증 결과**: 일치(녹색)/불일치(적색) 상태 표시 및 상세 정보 제공
- 실시간 JSON 미리보기 (입력한 트랜잭션 해시가 `transaction` 필드에 포함되어야 함)

#### 2-1. 아젠다 수정 모드
- 기존 아젠다 ID 입력
- 기존 메타데이터 로드
- 수정 가능한 필드 편집
- 업데이트 서명 생성

#### 2-2. 콜데이터 검증 시스템 상세 구현 요구사항
**필수 기능:**
- CallDataValidator 클래스 사용 (dao-common-requirements.md 참조)
- ethers.js Interface를 활용한 함수 시그니처 파싱
- 동적 파라미터 입력 필드 자동 생성 알고리즘
- 실시간 콜데이터 생성 및 원본과 바이트 단위 비교
- 시각적 검증 피드백: 성공(녹색), 실패(적색), 로딩(회색)

**CallDataValidator 클래스 구현:**
```typescript
export interface FunctionParameter {
  name: string
  type: string  // address, uint256, bool, string, bytes, etc.
  value: string
}

export interface CallDataValidationResult {
  isValid: boolean
  generated: string
  original: string
  error?: string
}

export class CallDataValidator {
  static parseFunctionSignature(signature: string): { name: string; inputs: { name: string; type: string }[] } | null {
    try {
      // Parse function signature like "transfer(address,uint256)"
      const match = signature.match(/^(\w+)\(([^)]*)\)$/)
      if (!match) return null

      const [, name, paramsStr] = match
      if (!paramsStr.trim()) return { name, inputs: [] }

      const paramTypes = paramsStr.split(',').map(p => p.trim())
      const inputs = paramTypes.map((type, index) => ({
        name: `param${index}`,
        type
      }))

      return { name, inputs }
    } catch {
      return null
    }
  }

  static validateParameterValue(type: string, value: string): { isValid: boolean; error?: string } {
    if (!value.trim()) return { isValid: false, error: 'Value cannot be empty' }

    switch (type) {
      case 'address':
        return /^0x[a-fA-F0-9]{40}$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Invalid address format' }

      case 'uint256':
      case 'uint':
        return /^\d+$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Must be a positive integer' }

      case 'bool':
        return (value === 'true' || value === 'false')
          ? { isValid: true }
          : { isValid: false, error: 'Must be true or false' }

      default:
        return { isValid: true }
    }
  }

  static generateCallData(contractAddress: string, functionSignature: string, parameters: FunctionParameter[]): string {
    // Implementation using ethers.js Interface
    const parsed = this.parseFunctionSignature(functionSignature)
    if (!parsed) throw new Error('Invalid function signature')

    // Create ABI for the function
    const functionAbi = {
      name: parsed.name,
      type: 'function',
      inputs: parsed.inputs
    }

    const iface = new ethers.Interface([functionAbi])

    // Convert parameter values to appropriate types
    const values = parameters.map((param, index) => {
      const type = parsed.inputs[index]?.type
      if (!type) throw new Error(`Missing type for parameter ${index}`)
      return this.convertParameterValue(type, param.value)
    })

    // Encode function call
    return iface.encodeFunctionData(parsed.name, values)
  }

  private static convertParameterValue(type: string, value: string): unknown {
    switch (type) {
      case 'address': return value
      case 'uint256':
      case 'uint': return ethers.getBigInt(value)
      case 'int256':
      case 'int': return ethers.getBigInt(value)
      case 'bool': return value === 'true'
      case 'string': return value
      case 'bytes': return value
      default:
        if (type.endsWith('[]')) {
          const arrayValue = JSON.parse(value)
          const baseType = type.slice(0, -2)
          return arrayValue.map((item: unknown) => this.convertParameterValue(baseType, String(item)))
        }
        return value
    }
  }

  static validateCallData(
    contractAddress: string,
    functionSignature: string,
    parameters: FunctionParameter[],
    originalCallData: string
  ): CallDataValidationResult {
    try {
      const generated = this.generateCallData(contractAddress, functionSignature, parameters)

      return {
        isValid: generated.toLowerCase() === originalCallData.toLowerCase(),
        generated,
        original: originalCallData
      }
    } catch (error) {
      return {
        isValid: false,
        generated: '',
        original: originalCallData,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
```

**구현 패턴:**
```typescript
// ActionEditor 컴포넌트에서 사용할 패턴
const validation = CallDataValidator.validateCallData(
  contractAddress,
  functionSignature,
  parameters,
  originalCalldata
)
// validation.isValid, validation.generated, validation.original
```

#### 3. 서명 생성 단계
- 서명 메시지 표시
- 서명 버튼 및 진행 상태
- 서명 결과 표시 및 복사 기능
- 서명 유효성 검증 결과

#### 4. 유효성 검증 단계
- 메타데이터 스키마 검증
- 서명 검증
- 타임스탬프 검증 (1시간 이내)
- 전체 데이터 무결성 검증
- 검증 결과 표시 (성공/실패)

**컴포넌트:** ValidationStep

**Props:**
```typescript
interface ValidationStepProps {
  metadata: Partial<AgendaMetadata>
  onValidationComplete: () => void
  onError: (error: string) => void
}
```

**상태 관리:**
```typescript
const [isValidating, setIsValidating] = useState(false)
const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
```

**핸들러 (무한 루프 방지 패턴):**
```typescript
const performValidation = useCallback(async () => {
  setIsValidating(true)

  try {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      checks: {
        schema: false,
        signature: false,
        timestamp: false,
        integrity: false
      }
    }

    // 1. 메타데이터 스키마 검증
    try {
      const schemaValidation = validateMetadata(metadata as AgendaMetadata)
      result.checks.schema = schemaValidation.isValid
      if (!schemaValidation.isValid) {
        result.errors.push(`Schema validation failed: ${schemaValidation.errors.join(', ')}`)
      }
    } catch {
      result.checks.schema = false
      result.errors.push('Schema validation error')
    }

    // 2. 서명 검증
    if (metadata.creator?.signature && metadata.creator?.address) {
      result.checks.signature = true
    } else {
      result.checks.signature = false
      result.errors.push('Missing creator signature or address')
    }

    // 3. 타임스탬프 검증 (1시간 이내)
    if (metadata.createdAt) {
      const createdTime = new Date(metadata.createdAt).getTime()
      const currentTime = Date.now()
      const oneHour = 60 * 60 * 1000

      if (currentTime - createdTime <= oneHour) {
        result.checks.timestamp = true
      } else {
        result.checks.timestamp = false
        result.errors.push('Signature timestamp is older than 1 hour')
      }
    } else {
      result.checks.timestamp = false
      result.errors.push('Missing creation timestamp')
    }

    // 4. 전체 데이터 무결성 검증
    const hasRequiredFields = !!(
      metadata.id && metadata.title && metadata.description &&
      metadata.network && metadata.transaction && metadata.creator &&
      metadata.actions?.length
    )

    result.checks.integrity = hasRequiredFields
    if (!hasRequiredFields) {
      result.errors.push('Missing required metadata fields')
    }

    // 전체 검증 결과
    result.isValid = Object.values(result.checks).every(check => check)

    setValidationResult(result)

    if (result.isValid) {
      onValidationComplete()
    } else {
      onError(`Validation failed: ${result.errors.join(', ')}`)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Validation error occurred'
    onError(errorMessage)
    setValidationResult({
      isValid: false,
      errors: [errorMessage],
      checks: { schema: false, signature: false, timestamp: false, integrity: false }
    })
  } finally {
    setIsValidating(false)
  }
}, [metadata, onValidationComplete, onError])

useEffect(() => {
  if (metadata && Object.keys(metadata).length > 0) {
    performValidation()
  }
}, [performValidation])
```

**중요:** 무한 루프 방지를 위해 반드시 `useCallback`을 사용하고, `metadata`가 존재하고 비어있지 않을 때만 검증을 실행해야 합니다.

#### 5. GitHub 설정 단계
- GitHub Username 입력
- GitHub Personal Access Token 입력
- 토큰 유효성 검증
- 저장소 접근 권한 확인

#### 6. PR 생성 단계
- 완성된 메타데이터 JSON 표시
- 모든 검증 단계 체크리스트
- GitHub PR 생성
- PR URL 반환 및 링크 제공

#### 검증 도구
**목적:** 사용자가 직접 작성한 메타데이터 JSON 검증

**컴포넌트:** ValidatePage (`/validate`)

**기능:**
1. **JSON 입력**: 사용자가 직접 JSON 입력
2. **구조 검증**: 스키마 검증
3. **내용 검증**: 필드별 유효성 검증
4. **결과 표시**: 상세한 오류/성공 메시지

**구현 제약사항:**
- ❌ 하드코딩된 샘플 데이터 로드 기능 금지
- ✅ 사용자 입력 기반 검증만 허용
- ✅ placeholder 텍스트로 예시 제공 가능

**Props:**
```typescript
interface ValidatePageProps {
  // 별도 props 없음 - 독립적인 검증 도구
}
```

**상태 관리:**
```typescript
const [jsonInput, setJsonInput] = useState('')
const [metadata, setMetadata] = useState<AgendaMetadata | null>(null)
const [parseError, setParseError] = useState('')
```

**핸들러:**
```typescript
const handleJsonChange = (value: string) => {
  setJsonInput(value)
  setParseError('')

  if (!value.trim()) {
    setMetadata(null)
    return
  }

  try {
    const parsed = JSON.parse(value) as AgendaMetadata
    setMetadata(parsed)
  } catch (error) {
    setParseError(error instanceof Error ? error.message : 'Invalid JSON')
    setMetadata(null)
  }
}
```

## ⚠️ 중요한 구현 노트

### 1. 에러 처리 명세
```typescript
// 에러 타입별 메시지
const ERROR_MESSAGES = {
  INVALID_HASH: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
  NOT_FOUND: 'Transaction not found on selected network. Please check the network and hash.',
  NOT_AGENDA: 'This transaction does not contain an agenda creation event.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  MISSING_TITLE: 'Agenda title is required.',
  MISSING_DESCRIPTION: 'Agenda description is required.',
  INVALID_ACTION: 'Action {index}: {error}',
  INVALID_SIGNATURE: 'Creator signature is invalid or expired.',
  GITHUB_TOKEN_ERROR: 'Invalid GitHub token. Please check your token and try again.'
}
```

### 2. 구현 제약사항
- ❌ **자동 파싱 금지**: 사용자가 버튼을 클릭해야만 파싱 실행
- ❌ **하드코딩된 샘플 데이터 금지**: 검증 도구에서 실제 사용자 입력만 사용
- ❌ **자동 단계 이동 금지**: 각 단계 완료 후 사용자가 다음 버튼 클릭
- ❌ **무한 루프 발생 금지**: useEffect 의존성 배열 주의, 함수 props는 useCallback 사용
- ❌ **불필요한 재렌더링 금지**: useMemo, useCallback 적절히 사용
- ❌ **ValidationStep 무한 루프 금지**: performValidation 함수는 반드시 useCallback으로 감싸고, metadata 존재 여부 확인 후 실행
- ✅ **실시간 검증**: 입력 시 즉시 유효성 검사
- ✅ **명확한 에러 메시지**: 구체적인 해결 방안 제시
- ✅ **안정적인 함수 참조**: props로 전달되는 함수는 useCallback으로 감싸기
- ✅ **PR 변경 제한 준수**: PR은 오직 메타데이터 파일 1개만 변경해야 하며, 다른 파일 변경은 금지. PR 생성 전 변경 파일 검증 필수

### 3. 성능 최적화
- **useCallback 사용**: 함수를 props로 전달할 때 반드시 useCallback으로 감싸기 (참조: dao-common-requirements.md)
- **useEffect 의존성 배열 주의**: setState를 호출하는 useEffect에서 해당 state를 의존성 배열에 포함하지 않기
- **useMemo 사용**: 계산 비용이 큰 값들을 메모이제이션
- **React Query를 통한 데이터 캐싱**
- **지연 로딩 및 코드 스플리팅**
- **ValidationStep 최적화**: performValidation 함수는 useCallback으로 감싸고, metadata 존재 여부를 확인한 후에만 실행

**ValidationStep 무한 루프 방지 패턴:**
```typescript
// ✅ CORRECT - 무한 루프 방지
const performValidation = useCallback(async () => {
  // 검증 로직
}, [metadata, onValidationComplete, onError])

useEffect(() => {
  if (metadata && Object.keys(metadata).length > 0) {
    performValidation()
  }
}, [performValidation]) // performValidation만 의존
```

> **📖 무한 루프 방지 상세 가이드는 `dao-common-requirements.md` 문서를 참조하세요.**

### 4. 보안 고려사항
- 시간 기반 보안: 서명 1시간 유효성 검증
- 타입 안전성: 모든 외부 데이터는 safe 유틸리티로 처리
- GitHub 토큰 안전한 저장 및 사용

### 5. 접근성 및 UX
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 모바일 친화적 레이아웃
- 로딩 상태 및 진행 표시기


## ✅ 아젠다 메타데이터 생성기 특화 체크리스트

### 🎯 핵심 기능 검증
- ✅ **트랜잭션 파싱**: AgendaCreated 이벤트에서 아젠다 정보 정확히 추출
- ✅ **메타데이터 생성**: JSON 스키마에 맞는 완전한 메타데이터 생성
- ✅ **서명 시스템**: 1시간 유효한 서명 생성 및 검증
- ✅ **GitHub PR**: 자동 PR 생성 및 메타데이터 저장
- ✅ **콜데이터 검증**: 입력 파라미터와 원본 콜데이터 정확히 비교
- ✅ **신규/수정 모드**: 자동 모드 감지 및 적절한 처리

### 🔧 특화 기능 검증
- ✅ **트랜잭션 입력**: 해시 형식 검증 및 네트워크별 조회
- ✅ **아젠다 정보 추출**: ID, 생성자, 타겟 배열, 메모 URL 자동 추출
- ✅ **메모 URL 파싱**: 트랜잭션 calldata에서 메모 URL 정확히 추출 및 화면 표시
- ✅ **액션 정보 입력**: 타겟 주소, 함수 시그니처, 파라미터 입력
- ✅ **실시간 JSON 미리보기**: 메타데이터 JSON 실시간 업데이트
- ✅ **GitHub 설정**: username/token 입력 및 저장소 연결
- ✅ **PR 생성**: 올바른 제목 형식과 메타데이터 내용 포함

### 🧪 테스트 시나리오

#### 시나리오 1: 정상 신규 아젠다 생성
**사용자 동작:**
1. 네트워크: Sepolia 선택
2. 트랜잭션 해시: `0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b` 입력
3. "Parse Transaction" 버튼 클릭
4. 아젠다 제목: "Test Agenda" 입력
5. 아젠다 설명: "Test description" 입력
6. "Generate Signature" 버튼 클릭
7. GitHub 설정 입력
8. "Create PR" 버튼 클릭

**예상 결과:**
- Step 1 → 2 → 3 → 4 → 5 순서로 진행
- 각 단계별 완료 상태 표시
- 최종적으로 PR 생성 성공

#### 시나리오 2: 잘못된 트랜잭션
**사용자 동작:**
1. 네트워크: Sepolia 선택
2. 트랜잭션 해시: `0x0000000000000000000000000000000000000000000000000000000000000000` 입력
3. "Parse Transaction" 버튼 클릭

**예상 결과:**
- 에러 메시지: "Transaction not found on selected network"
- Step 1에서 진행 불가

#### 시나리오 3: 네트워크 불일치
**사용자 동작:**
1. 네트워크: Mainnet 선택
2. 트랜잭션 해시: `0x7e6a94affbc4f0d34fd0c2fe8d9f258ce983cfd5a26a2674129b7e247fa2436b` (Sepolia tx) 입력
3. "Parse Transaction" 버튼 클릭

**예상 결과:**
- 에러 메시지: "Transaction not found on selected network"
- Step 1에서 진행 불가

#### 시나리오 4: 필수 필드 누락
**사용자 동작:**
1. Step 2에서 아젠다 제목을 비워두고 진행 시도

**예상 결과:**
- 에러 메시지: "Agenda title is required"
- Step 2에서 진행 불가

#### 시나리오 5: GitHub 토큰 오류
**사용자 동작:**
1. Step 4에서 잘못된 GitHub 토큰 입력

**예상 결과:**
- 에러 메시지: "Invalid GitHub token"
- Step 4에서 진행 불가

### 📱 사용자 경험 검증
- ✅ **단계별 워크플로우**: 5단계 진행 상태 표시
- ✅ **한 화면에 한 단계씩**: 현재 단계 외 다른 컴포넌트 숨김 처리
- ✅ **단계별 완전 분리**: 각 단계가 독립적인 화면으로 표시
- ✅ **컴포넌트 조건부 렌더링**: currentStep에 따른 정확한 컴포넌트 표시
- ✅ **실시간 검증**: 입력 시 즉시 유효성 검사 및 피드백
- ✅ **로딩 상태**: 트랜잭션 파싱, 서명 생성, PR 생성 중 로딩 표시
- ✅ **에러 복구**: 각 단계별 에러 발생 시 이전 단계로 복구 가능
- ✅ **모바일 지원**: 모든 입력 필드와 버튼이 모바일에서 사용 가능

### 🔒 보안 검증
- ✅ **서명 검증**: 생성자 주소와 서명 일치 확인
- ✅ **시간 제한**: 서명 1시간 유효성 검증
- ✅ **GitHub 토큰**: 안전한 토큰 저장 및 사용
- ✅ **입력 검증**: 모든 사용자 입력의 XSS 방지 및 유효성 검사
- ✅ **콜데이터 검증**: 악의적인 콜데이터 주입 방지
