# Agenda Transaction Calldata Structure

본 문서는 Tokamak DAO 아젠다 생성 트랜잭션의 calldata 구조를 설명합니다.

## 0. 필수 ABI 정의

### AgendaCreated 이벤트 ABI
```typescript
export const AGENDA_CREATED_EVENT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "id", "type": "uint256"},
      {"indexed": false, "name": "targets", "type": "address[]"},
      {"indexed": false, "name": "noticePeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "votingPeriodSeconds", "type": "uint128"},
      {"indexed": false, "name": "atomicExecute", "type": "bool"}
    ],
    "name": "AgendaCreated",
    "type": "event"
  }
] as const;
```

### TON.approveAndCall 함수 ABI
```typescript
export const TON_APPROVE_AND_CALL_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "approveAndCall",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```


## 1. 최상위 구조 (TON.approveAndCall)

아젠다 생성 트랜잭션은 TON 컨트랙트의 `approveAndCall(address,uint256,bytes)` 함수가 호출합니다:

```
Function Selector: 0xcae9ca51
Parameters:
  - address spender    : 위원회 컨트랙트 주소 (32 bytes)
  - uint256 amount     : 승인할 TON 금액 (32 bytes)
  - bytes data         : 아젠다 생성 데이터 (동적 크기)
```

### Calldata 구조
```
0xcae9ca51                                            // function selector (4 bytes)
000000000000000000000000{committee_address}          // committee address (32 bytes)
{approval_amount}                                     // approval amount (32 bytes)
{createAgenda_encoded_parameters}                           // createAgenda 를 위한 생성데이타 구조(variable)
```

## 2. 아젠다 생성 데이터 구조 (committee.createAgenda )
### 레거시 버전 (5개 파라미터)
 - encode(input, (address[], uint128, uint128, bool, bytes[]))
```
  address[] targets,              // 실행할 컨트랙트 주소 배열
  uint256 noticePeriodSeconds,    // 공지기간(초)
  uint256 votingPeriodSeconds,    // 투표기간(초)
  bool atomicExecute,             // true
  bytes[] calldata                // 실행할 함수 calldata 배열
```

### 새 버전 (6개 파라미터) - 메모 URL 지원
 - encode(input, (address[], uint128, uint128, bool, bytes[], string))
```
  address[] targets,              // 실행할 컨트랙트 주소 배열
  uint256 noticePeriodSeconds,    // 공지기간(초)
  uint256 votingPeriodSeconds,    // 투표기간(초)
  bool atomicExecute,             // true
  bytes[] calldata,               // 실행할 함수 calldata 배열
  string memo                     // 메모 URL (6번째 파라미터)
```

## 3. 메모 URL 추출 로직

```
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

      // 첫 번째 배열 개수로 파라미터 구조 판단
      const targetsOffset = parseInt(createAgendaData.slice(0, 64), 16)
      const targetsLength = parseInt(createAgendaData.slice(targetsOffset * 2, targetsOffset * 2 + 64), 16)

      // 6개 파라미터 구조일 때의 예상 총 바이트 길이 계산
      const fixedParamsSize = 6 * 32
      const targetsArraySize = 32 + (targetsLength * 32)
      const calldataArraySize = 32 + (targetsLength * 32)
      const stringSize = 32 + 32

      const expectedTotalSize6 = fixedParamsSize + targetsArraySize + calldataArraySize + stringSize
      const expectedTotalSize5 = fixedParamsSize + targetsArraySize + calldataArraySize - 32

      // 실제 길이와 비교해서 파라미터 개수 판단
      const actualSize = createAgendaData.length / 2
      const is6Params = Math.abs(actualSize - expectedTotalSize6) < Math.abs(actualSize - expectedTotalSize5)

      // 판단 결과에 따라 디코딩
      if (is6Params) {
        const decoded6 = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]', 'string'],
          createAgendaData
        )
        return decoded6[5] // Return the memo string (6th parameter)
      } else {
        return undefined // No memo in 5-parameter structure
      }
    } catch {
      return undefined
    }
  }
```