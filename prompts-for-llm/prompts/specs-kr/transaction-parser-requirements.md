# 🔍 Tokamak DAO 트랜잭션 파서 요구사항

## 📋 개요

이 문서는 Tokamak DAO 아젠다 메타데이터 생성기에서 사용되는 트랜잭션 파서의 요구사항과 CORS 오류 처리 방법을 정리한 것입니다.

## 🎯 트랜잭션 파서 목적

- 아젠다 생성 트랜잭션 해시로부터 메타데이터 추출
- 이벤트 로그 파싱을 통한 아젠다 정보 수집
- calldata 디코딩을 통한 메모 URL 추출
- 네트워크별 트랜잭션 검증

## 🌐 RPC 설정 및 CORS 오류 처리

### RPC URL 설정

```typescript
// CORS 문제를 피하기 위한 RPC URL 설정
const rpcUrls: Record<number, string> = {
  1: 'https://eth.llamarpc.com',                    // Mainnet - CORS 지원
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com'  // Sepolia - CORS 지원
}
```

### CORS 오류 해결 방법

#### 1. CORS 오류 감지
```typescript
try {
  const tx = await this.provider.getTransaction(txHash)
} catch (error) {
  const errorMessage = safe.getErrorMessage(error)

  // CORS 오류 감지
  if (errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control') ||
      errorMessage.includes('blocked by CORS policy') ||
      errorMessage.includes('ERR_FAILED')) {

    throw new Error('Network access blocked by browser security policy. Please try again or contact support.')
  }

  throw new Error(errorMessage)
}
```

#### 2. Fallback RPC 시스템 (권장)
```typescript
const rpcUrls: Record<number, string[]> = {
  1: ['https://eth.llamarpc.com', 'https://ethereum.publicnode.com'],
  11155111: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org']
}

private async tryNextProvider(currentIndex: number = 0): Promise<ethers.JsonRpcProvider> {
  if (currentIndex >= this.fallbackUrls.length) {
    throw new Error('All RPC endpoints failed')
  }

  const url = this.fallbackUrls[currentIndex]
  try {
    const provider = new ethers.JsonRpcProvider(url)
    console.log(`Trying RPC: ${url}`)
    return provider
  } catch (error) {
    console.warn(`Failed to connect to ${url}:`, error)
    return this.tryNextProvider(currentIndex + 1)
  }
}
```

## 🔧 트랜잭션 파싱 구현

### 1. 기본 파싱 구조

```typescript
export class TransactionParser {
  private provider: ethers.JsonRpcProvider;

  constructor(chainId: number) {
    const rpcUrls: Record<number, string> = {
      1: 'https://eth.llamarpc.com',
      11155111: 'https://ethereum-sepolia-rpc.publicnode.com'
    }

    const rpcUrl = rpcUrls[chainId]
    if (!rpcUrl) {
      throw new Error(`Unsupported network: ${chainId}`)
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  async parseAgendaTransaction(txHash: string, chainId: number): Promise<ParsedTransaction> {
    try {
      const tx = await this.provider.getTransaction(txHash)
      if (!tx) {
        throw new Error('Transaction not found on selected network')
      }

      const receipt = await this.provider.getTransactionReceipt(txHash)
      if (!receipt) {
        throw new Error('Transaction receipt not found')
      }

      // 아젠다 생성 이벤트 찾기
      const agendaCreatedEvent = this.findAgendaCreatedEvent([...receipt.logs], contracts.committee)
      if (!agendaCreatedEvent) {
        throw new Error('This transaction does not contain an agenda creation event')
      }

      // 메모 URL 파싱
      const memo = this.parseMemoFromCalldata(tx.data)

      return {
        id: Number(agendaCreatedEvent.id),
        creator: agendaCreatedEvent.from,
        targets: agendaCreatedEvent.targets,
        noticePeriodSeconds: Number(agendaCreatedEvent.noticePeriodSeconds),
        votingPeriodSeconds: Number(agendaCreatedEvent.votingPeriodSeconds),
        atomicExecute: agendaCreatedEvent.atomicExecute,
        calldata: this.parseCalldataFromTransaction(tx.data),
        memo,
        network: getNetworkName(chainId) as 'mainnet' | 'sepolia',
        txHash
      }
    } catch (error) {
      throw new Error(safe.getErrorMessage(error))
    }
  }
}
```

### 2. 이벤트 로그 파싱

```typescript
private findAgendaCreatedEvent(logs: any[], committeeAddress: string) {
  const eventInterface = new ethers.Interface(AGENDA_CREATED_EVENT_ABI)

  for (const log of logs) {
    if (log.address.toLowerCase() === committeeAddress.toLowerCase()) {
      try {
        const parsedLog = eventInterface.parseLog({
          topics: log.topics,
          data: log.data
        })

        if (parsedLog && parsedLog.name === 'AgendaCreated') {
          return {
            from: parsedLog.args.from,
            id: parsedLog.args.id,
            targets: parsedLog.args.targets,
            noticePeriodSeconds: parsedLog.args.noticePeriodSeconds,
            votingPeriodSeconds: parsedLog.args.votingPeriodSeconds,
            atomicExecute: parsedLog.args.atomicExecute
          }
        }
      } catch {
        continue
      }
    }
  }
  return null
}
```

### 3. Calldata 파싱

```typescript
private parseMemoFromCalldata(input: string): string | undefined {
  try {
    const approveAndCallInterface = new ethers.Interface([
      'function approveAndCall(address spender, uint256 amount, bytes calldata data)'
    ])

    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: input })
    if (!decodedApproveAndCall) {
      return undefined
    }

    const { data: approveData } = decodedApproveAndCall.args
    const createAgendaData = approveData

    // 아젠다 생성 함수 파싱
    const createAgendaInterface = new ethers.Interface([
      'function createAgenda(address[] calldata targetAddresses, uint256 minimumNoticePeriodSeconds, uint256 minimumVotingPeriodSeconds, bool executeImmediately, bytes[] calldata callDataArray, string calldata agendaUrl)'
    ])

    const decodedCreateAgenda = createAgendaInterface.parseTransaction({ data: createAgendaData })
    if (!decodedCreateAgenda) {
      return undefined
    }

    return decodedCreateAgenda.args.agendaUrl
  } catch {
    return undefined
  }
}
```

## 📊 에러 처리 및 사용자 경험

### 에러 메시지 분류

```typescript
const ERROR_MESSAGES = {
  INVALID_HASH: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
  NOT_FOUND: 'Transaction not found on selected network. Please check the network and hash.',
  NOT_AGENDA: 'This transaction does not contain an agenda creation event.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  CORS_ERROR: 'Network access blocked. Please try again or contact support if the issue persists.'
} as const
```

### 에러 처리 로직

```typescript
try {
  const parsedTx = await parseAgendaTransaction(txHash, chainId)
  onTransactionParsed(parsedTx)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction'

  if (errorMessage.includes('not found')) {
    setValidationError(ERROR_MESSAGES.NOT_FOUND)
  } else if (errorMessage.includes('agenda creation event')) {
    setValidationError(ERROR_MESSAGES.NOT_AGENDA)
  } else if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
    setValidationError(ERROR_MESSAGES.CORS_ERROR)
  } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    setValidationError(ERROR_MESSAGES.NETWORK_ERROR)
  } else {
    setValidationError(errorMessage)
  }

  onError(errorMessage)
}
```

## 🔍 검증 및 테스트

### 트랜잭션 해시 검증

```typescript
export const validateTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}
```

### 네트워크 지원 검증

```typescript
export const isChainSupported = (chainId: number): boolean => {
  return [1, 11155111].includes(chainId)
}
```

### 테스트 케이스

```typescript
// 유효한 아젠다 생성 트랜잭션
const validTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

// CORS 오류 테스트
const corsErrorTest = async () => {
  try {
    await parser.parseAgendaTransaction(validTxHash, 11155111)
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.log('CORS error detected, implementing fallback...')
    }
  }
}
```

## 📝 구현 체크리스트

- [ ] CORS 지원 RPC URL 사용
- [ ] Fallback RPC 시스템 구현
- [ ] 에러 메시지 분류 및 처리
- [ ] 트랜잭션 해시 검증
- [ ] 이벤트 로그 파싱
- [ ] Calldata 디코딩
- [ ] 사용자 친화적 에러 메시지
- [ ] 네트워크별 검증
- [ ] 테스트 케이스 작성

---

이 문서는 트랜잭션 파서의 안정적인 구현과 CORS 오류 해결을 위한 가이드라인을 제공합니다.
