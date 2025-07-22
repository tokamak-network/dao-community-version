# Agenda List Prompt Example

## Purpose
This prompt helps you request a list of all agendas (proposals) currently registered in the DAO community.

## Example Prompt (EN)
```
Show me a table of all current agendas (proposals) registered in the DAO community.
Include the agenda title, creation date, author, and status (e.g., ongoing, completed, voting).
```


## Example Prompt (KR)
```
React(또는 Next.js)를 사용하여 DAO 아젠다 목록을 가져오는 페이지를 만들어주세요

## 아젠다 리스트 가져오기
1. **총 개수 조회**
   - `AgendaManager.numAgendas()` 호출 → 전체 아젠다 개수 반환
2. **최신/첫 아젠다 번호**
   - 최신 아젠다 번호: `numAgendas - 1`
   - 첫 아젠다 번호: `0`
3. **목록 표시**
   - 최신 아젠다부터 역순으로 번호를 나열 (예: [numAgendas-1, ..., 0])

* 코드가 길어지지 않게 UI는 아주 간단하게 제공하고, 코드도 가능한 간단하게 합니다.
* 전체 코드(구성 요소, 상태 관리, API 통합 등)를 제공하십시오.
* 블록체인 연동은 wagmi를 사용해주세요.

const NETWORKS = {
  mainnet: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://ethereum.publicnode.com",
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia.publicnode.com",
  },
};

const CONTRACT_ADDRESSES = {
  mainnet: {
    TON: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
    DAO_COMMITTEE: "0xDD9f0cCc044B0781289Ee318e5971b0139602C26",
    DAO_AGENDA_MANAGER: "0xcD4421d082752f363E1687544a09d5112cD4f484",
  },
  sepolia: {
    TON: "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
    DAO_COMMITTEE: "0xA2101482b28E3D99ff6ced517bA41EFf4971a386",
    DAO_AGENDA_MANAGER: "0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08",
  },
};

AgendaManager_ABI =[
{
      "inputs": [],
      "name": "numAgendas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "agendas",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "createdTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "noticeEndTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "votingPeriodInSeconds",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "votingStartedTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "votingEndTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "executableLimitTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "executedTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "countingYes",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "countingNo",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "countingAbstain",
              "type": "uint256"
            },
            {
              "internalType": "enum LibAgenda.AgendaStatus",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "enum LibAgenda.AgendaResult",
              "name": "result",
              "type": "uint8"
            },
            {
              "internalType": "address[]",
              "name": "voters",
              "type": "address[]"
            },
            {
              "internalType": "bool",
              "name": "executed",
              "type": "bool"
            }
          ],
          "internalType": "struct LibAgenda.Agenda",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
]

```
