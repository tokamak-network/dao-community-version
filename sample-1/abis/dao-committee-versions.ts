// DAO Committee 실제 컨트랙트 ABI
// 실제 스토리지 구조에 맞게 수정
export const daoCommitteeAbi = [
  // 기본 함수들
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Public 배열 접근자 (Solidity 자동 생성)
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "members",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "candidates",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // 설정값들
  {
    inputs: [],
    name: "maxMember",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "quorum",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "activityRewardPerSecond",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // 컨트랙트 주소들
  {
    inputs: [],
    name: "ton",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "daoVault",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "agendaManager",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // 후보자/멤버 관련 함수 (실제 구현에 따라 존재할 수 있음)
  {
    inputs: [{ internalType: "address", name: "candidate", type: "address" }],
    name: "candidateInfos",
    outputs: [
      { internalType: "address", name: "candidateContract", type: "address" },
      { internalType: "uint256", name: "indexMembers", type: "uint256" },
      { internalType: "uint128", name: "memberJoinedTime", type: "uint128" },
      { internalType: "uint128", name: "rewardPeriod", type: "uint128" },
      { internalType: "uint128", name: "claimedTimestamp", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // 멤버 체크 함수 (구현되어 있을 수 있음)
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_receiver", type: "address" }],
    name: "claimActivityReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_candidate",
        "type": "address"
      }
    ],
    "name": "getClaimableActivityReward",
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "targets",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "noticePeriodSeconds",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "votingPeriodSeconds",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "atomicExecute",
        "type": "bool"
      }
    ],
    "name": "AgendaCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address[]",
        "name": "target",
        "type": "address[]"
      }
    ],
    "name": "AgendaExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "voting",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "comment",
        "type": "string"
      }
    ],
    "name": "AgendaVoteCasted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "candidate",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "candidateContract",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "memo",
        "type": "string"
      }
    ],
    "name": "CandidateContractCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "slotIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "prevMember",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newMember",
        "type": "address"
      }
    ],
    "name": "ChangedMember",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "candidateContract",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newMemo",
        "type": "string"
      }
    ],
    "name": "ChangedMemo",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "candidate",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ClaimedActivityReward",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "candidate",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "candidateContract",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "memo",
        "type": "string"
      }
    ],
    "name": "Layer2Registered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "cooldown",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
] as const;

// 호환성을 위한 export
export { daoCommitteeAbi as currentDAOCommitteeAbi };