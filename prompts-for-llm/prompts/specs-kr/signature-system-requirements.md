# 🔐 Tokamak DAO 아젠다 메타데이터 서명 시스템

## 📋 개요

이 문서는 Tokamak DAO 아젠다 메타데이터 생성기에서 사용되는 서명 시스템의 요구사항을 정리한 것입니다.

## 🎯 서명 시스템 목적

- 아젠다 메타데이터의 생성자 신원 검증
- 메타데이터 무결성 보장
- 시간 기반 보안 (1시간 유효성)
- 신규 생성과 수정 모드 구분

## 📝 서명 메시지 형식

### 신규 아젠다 생성 서명
```
I am the one who submitted agenda #<id> via transaction <tx-hash>. I am creating this metadata at <timestamp>. This signature proves that I am the one who submitted this agenda.
```

### 기존 아젠다 수정 서명
```
I am the one who submitted agenda #<id> via transaction <tx-hash>. I am updating this metadata at <timestamp>. This signature proves that I am the one who submitted this agenda.
```

## 📊 메타데이터 스키마 (서명 관련)

```typescript
interface AgendaMetadata {
  id: number;                    // 아젠다 ID
  title: string;                 // 아젠다 제목
  description: string;           // 아젠다 설명
  network: "mainnet" | "sepolia"; // 네트워크
  transaction: string;           // 트랜잭션 해시
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
```

## 🔧 구현 스펙

### 1. 서명 생성 시스템

```typescript
// src/lib/signature.ts
export interface SignatureData {
  message: string;
  signature: string;
  timestamp: string;
}

export const createSignatureMessage = (
  agendaId: number,
  txHash: string,
  timestamp: string,
  isUpdate: boolean = false
): string => {
  const action = isUpdate ? "updating" : "creating";
  const proof = "submitted"; // 신규/수정 모두 "submitted" 사용

  return `I am the one who submitted agenda #${agendaId} via transaction ${txHash}. I am ${action} this metadata at ${timestamp}. This signature proves that I am the one who ${proof} this agenda.`;
};

export const generateSignature = async (
  signer: any,
  message: string
): Promise<string> => {
  // 지갑 서명 생성
};

export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  // 서명 검증
};
```

## ⚠️ 중요 구현 규칙

### 타임스탬프 동일성 규칙
1. **서명 생성 시점**: 
   - `new Date().toISOString()` 형식으로 타임스탬프 생성
   - 생성한 타임스탬프를 `metadata.createdAt`에 저장
   - 동일한 타임스탬프를 서명 메시지에 사용

2. **서명 검증 시점**: 
   - 반드시 `metadata.createdAt`에 저장된 타임스탬프를 그대로 사용
   - 절대 새로운 타임스탬프를 생성하거나 재변환하지 않음
   - `new Date(metadata.createdAt).toISOString()` 같은 재변환 금지

3. **검증 로직 예시**:
```typescript
// ✅ 올바른 구현
const timestamp = metadata.createdAt; // 저장된 타임스탬프 그대로 사용
const message = createSignatureMessage(
  metadata.id,
  metadata.transaction,
  timestamp,
  isUpdate
);
const isValid = verifySignature(message, metadata.creator.signature, metadata.creator.address);

// ❌ 잘못된 구현
const timestamp = new Date(metadata.createdAt).toISOString(); // 재변환 금지!
```
