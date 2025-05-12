# Agenda Metadata Registration Guide

## PR 제출 절차

1. 메타마스크로 Creator 주소에 연결
2. 다음 메시지를 서명:
   ```
   I am the creator of Agenda #{id} and I confirm this metadata submission.
   Agenda ID: {id}
   Transaction Hash: {tx_hash}
   ```
3. PR 설명에 다음 정보를 포함:
   ```markdown
   ## 서명 정보
   - Creator Address: 0x...
   - Signed Message: 0x...
   - Transaction Hash: 0x...
   ```

## Metadata 파일 형식
- Filename: `{agendaId}.json`
- Location: `src/agenda/metadata/` directory
- Format:
```json
{
  "title": "Agenda Title",
  "description": "Detailed description of the agenda",
  "creator": "0x...", // Agenda creator's address
  "createdAt": 1746973116, // Agenda creation timestamp
  "targets": ["0x...", "0x..."], // Target contract addresses
  "atomicExecute": true, // Whether to execute atomically
  "transactionHash": "0x..." // Transaction hash of agenda creation
}
```

## 중요 사항
- Creator 주소로 서명된 메시지가 반드시 포함되어야 합니다.
- 서명은 PR 설명과 metadata 파일 모두에 포함되어야 합니다.
- 서명 검증에 실패하면 PR이 자동으로 거부됩니다.
- 트랜잭션 해시는 반드시 유효한 Agenda 생성 트랜잭션이어야 합니다.