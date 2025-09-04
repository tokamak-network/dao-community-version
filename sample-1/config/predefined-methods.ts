export interface PredefinedMethod {
    id: string;
    name: string;
    abi: any[];
    description?: string;
}

export const predefinedMethods: PredefinedMethod[] = [
    {
        id: 'tokamak-ton',
        name: 'Tokamak TON',
        description: 'Tokamak Network TON token interface',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "approveAndCall",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'tokamak-wton',
        name: 'Tokamak WTON',
        description: 'Tokamak Network Wrapped TON token interface',
        abi: [
            {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "uint256",
                    "name": "wtonAmount",
                    "type": "uint256"
                    }
                ],
                "name": "swapToTON",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "uint256",
                    "name": "tonAmount",
                    "type": "uint256"
                    }
                ],
                "name": "swapFromTON",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "wtonAmount",
                    "type": "uint256"
                    }
                ],
                "name": "swapToTONAndTransfer",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "tonAmount",
                    "type": "uint256"
                    }
                ],
                "name": "swapFromTONAndTransfer",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "approveAndCall",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addMinter",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "constant": false,
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "subtractedValue",
                    "type": "uint256"
                  }
                ],
                "name": "decreaseAllowance",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "constant": false,
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "addedValue",
                    "type": "uint256"
                  }
                ],
                "name": "increaseAllowance",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "constant": false,
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "target",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                  }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "constant": false,
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                  }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
        ]
    },
    {
        id: 'tokamak-deposit-manager',
        name: 'Tokamak DepositManager',
        description: 'Tokamak Network TON staking deposit manager',
        abi: [
            {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                    }
                ],
                "name": "deposit",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    }
                ],
                "name": "redeposit",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "n",
                    "type": "uint256"
                    }
                ],
                "name": "redepositMulti",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "l2chain",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "withdrawalDelay_",
                    "type": "uint256"
                    }
                ],
                "name": "setWithdrawalDelay",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                    }
                ],
                "name": "requestWithdrawal",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    },
                    {
                    "internalType": "bool",
                    "name": "receiveTON",
                    "type": "bool"
                    }
                ],
                "name": "processRequest",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    }
                ],
                "name": "requestWithdrawalAll",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "constant": false,
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                    },
                    {
                    "internalType": "uint256",
                    "name": "n",
                    "type": "uint256"
                    },
                    {
                    "internalType": "bool",
                    "name": "receiveTON",
                    "type": "bool"
                    }
                ],
                "name": "processRequests",
                "outputs": [
                    {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  }
                ],
                "name": "withdrawAndDepositL2",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                    }
                ],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                    },
                    {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                    }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                    }
                ],
                "name": "removeAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                    "internalType": "address",
                    "name": "_l1BridgeRegistry",
                    "type": "address"
                    },
                    {
                    "internalType": "address",
                    "name": "_layer2Manager",
                    "type": "address"
                    }
                ],
                "name": "setAddresses",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },

        ]
    },
    {
        id: 'tokamak-seig-manager',
        name: 'Tokamak SeigManager',
        description: 'Tokamak Network staking rewards manager',
        abi: [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                  }
                ],
                "name": "updateSeigniorageLayer",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "pause",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "unpause",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "adjustDelay_",
                    "type": "uint256"
                  }
                ],
                "name": "setAdjustDelay",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "minimumAmount_",
                    "type": "uint256"
                  }
                ],
                "name": "setMinimumAmount",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addMinter",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },

              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "factory_",
                    "type": "address"
                  }
                ],
                "name": "setCoinageFactory",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "commissionRate",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bool",
                    "name": "isCommissionRateNegative_",
                    "type": "bool"
                  }
                ],
                "name": "setCommissionRate",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "daoAddress",
                    "type": "address"
                  }
                ],
                "name": "setDao",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "powerton_",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "daoAddress",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "powerTONSeigRate_",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "daoSeigRate_",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "relativeSeigRate_",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "adjustDelay_",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "minimumAmount_",
                    "type": "uint256"
                  }
                ],
                "name": "setData",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "powerton_",
                    "type": "address"
                  }
                ],
                "name": "setPowerTON",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },

              {
                "inputs": [],
                "name": "updateSeigniorage",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              }
        ]
    },
    {
        id: 'tokamak-l1-bridge-registry',
        name: 'Tokamak L1BridgeRegistry',
        description: 'Tokamak Network L1 Bridge Registry for managing bridges',
        abi: [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addRegistrant",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "uint8",
                    "name": "_type",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address",
                    "name": "_l2TON",
                    "type": "address"
                  },
                  {
                    "internalType": "string",
                    "name": "_name",
                    "type": "string"
                  }
                ],
                "name": "registerRollupConfig",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "uint8",
                    "name": "_type",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address",
                    "name": "_l2TON",
                    "type": "address"
                  }
                ],
                "name": "registerRollupConfig",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "uint8",
                    "name": "_type",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address",
                    "name": "_l2TON",
                    "type": "address"
                  }
                ],
                "name": "registerRollupConfigByManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "uint8",
                    "name": "_type",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address",
                    "name": "_l2TON",
                    "type": "address"
                  },
                  {
                    "internalType": "string",
                    "name": "_name",
                    "type": "string"
                  }
                ],
                "name": "registerRollupConfigByManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                  }
                ],
                "name": "registeredNames",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "view",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  }
                ],
                "name": "rejectCandidateAddOn",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  }
                ],
                "name": "rejectRollupConfig",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "rejectedSeigs",
                    "type": "bool"
                  }
                ],
                "stateMutability": "view",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "removeAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "removeManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "removeRegistrant",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceRegistrant",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "renounceRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "bool",
                    "name": "rejectedL2Deposit",
                    "type": "bool"
                  }
                ],
                "name": "restoreCandidateAddOn",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "revokeManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "revokeRegistrant",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "revokeRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_layer2Manager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_seigManager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_ton",
                    "type": "address"
                  }
                ],
                "name": "setAddresses",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_seigniorageCommittee",
                    "type": "address"
                  }
                ],
                "name": "setSeigniorageCommittee",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              }
        ]
    },
    {
        id: 'tokamak-operator-manager',
        name: 'Tokamak OperatorManager',
        description: 'Tokamak Network Operator Manager for managing operators',
        abi: [
            {
                "inputs": [],
                "name": "acquireManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  }
                ],
                "name": "claimERC20",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "claimETH",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "processRequest",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "n",
                    "type": "uint256"
                  }
                ],
                "name": "processRequests",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  }
                ],
                "name": "requestWithdrawal",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_layer2Manager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_depositManager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_ton",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_wton",
                    "type": "address"
                  }
                ],
                "name": "setAddresses",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newManager",
                    "type": "address"
                  }
                ],
                "name": "transferManager",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                  }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
        ]
    },
    {
        id: 'tokamak-candidate-addon',
        name: 'Tokamak CandidateAddOn',
        description: 'Tokamak Network Candidate AddOn for managing candidates',
        abi: [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "_agendaID",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "_vote",
                    "type": "uint256"
                  },
                  {
                    "internalType": "string",
                    "name": "_comment",
                    "type": "string"
                  }
                ],
                "name": "castVote",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "_memberIndex",
                    "type": "uint256"
                  }
                ],
                "name": "changeMember",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "claimActivityReward",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_operateContract",
                    "type": "address"
                  },
                  {
                    "internalType": "string",
                    "name": "_memo",
                    "type": "string"
                  },
                  {
                    "internalType": "address",
                    "name": "_committee",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_seigManager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_ton",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_wton",
                    "type": "address"
                  }
                ],
                "name": "initialize",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "removeAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "renounceRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "retireMember",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "revokeRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "string",
                    "name": "_memo",
                    "type": "string"
                  }
                ],
                "name": "setMemo",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "updateSeigniorage",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
        ]
    },
    {
        id: 'tokamak-layer2-manager',
        name: 'Tokamak Layer2Manager',
        description: 'Tokamak Network Layer2 Manager for managing Layer2 networks',
        abi: [
            {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "addAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                  }
                ],
                "name": "onApprove",
                "outputs": [
                  {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                  }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  }
                ],
                "name": "pauseCandidateAddOn",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bool",
                    "name": "flagTon",
                    "type": "bool"
                  },
                  {
                    "internalType": "string",
                    "name": "memo",
                    "type": "string"
                  }
                ],
                "name": "registerCandidateAddOn",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "removeAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "renounceRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                  }
                ],
                "name": "revokeRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_l1BridgeRegistry",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_operatorManagerFactory",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_ton",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_wton",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_dao",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_depositManager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_seigManager",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "_swapProxy",
                    "type": "address"
                  }
                ],
                "name": "setAddresses",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "uint256",
                    "name": "_minimumInitialDepositAmount",
                    "type": "uint256"
                  }
                ],
                "name": "setMinimumInitialDepositAmount",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "_operatorManagerFactory",
                    "type": "address"
                  }
                ],
                "name": "setOperatorManagerFactory",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferAdmin",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "layer2",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  }
                ],
                "name": "transferL2Seigniorage",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                  }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
              {
                "inputs": [
                  {
                    "internalType": "address",
                    "name": "rollupConfig",
                    "type": "address"
                  }
                ],
                "name": "unpauseCandidateAddOn",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
              },
        ]
    },
    {
        id: 'erc20',
        name: 'ERC-20',
        description: 'Standard ERC-20 token interface',
        abi: [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_spender",
                        "type": "address"
                    },
                    {
                        "name": "_value",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_value",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'erc721',
        name: 'ERC-721',
        description: 'Standard ERC-721 NFT interface',
        abi: [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'erc1155',
        name: 'ERC-1155',
        description: 'Standard ERC-1155 multi-token interface',
        abi: [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_operator",
                        "type": "address"
                    },
                    {
                        "name": "_approved",
                        "type": "bool"
                    }
                ],
                "name": "setApprovalForAll",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_from",
                        "type": "address"
                    },
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_id",
                        "type": "uint256"
                    },
                    {
                        "name": "_amount",
                        "type": "uint256"
                    },
                    {
                        "name": "_data",
                        "type": "bytes"
                    }
                ],
                "name": "safeTransferFrom",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'oz-governor',
        name: 'OpenZeppelin Governor',
        description: 'OpenZeppelin Governor contract for DAO governance',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address[]",
                        "name": "targets",
                        "type": "address[]"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "values",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "bytes[]",
                        "name": "calldatas",
                        "type": "bytes[]"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    }
                ],
                "name": "propose",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "proposalId",
                        "type": "uint256"
                    }
                ],
                "name": "execute",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'ownable',
        name: 'Ownable',
        description: 'OpenZeppelin Ownable contract for basic access control',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'roles',
        name: 'AccessControl',
        description: 'OpenZeppelin AccessControl for role-based access control',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "grantRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                    }
                ],
                "name": "revokeRole",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'pausable',
        name: 'Pausable',
        description: 'OpenZeppelin Pausable for emergency stops',
        abi: [
            {
                "inputs": [],
                "name": "pause",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "unpause",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'iavatar',
        name: 'IAvatar (Gnosis Safe)',
        description: 'Gnosis Safe Avatar interface for module execution',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "target",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    }
                ],
                "name": "execTransactionFromModule",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'gnosis-safe-l2',
        name: 'GnosisSafeL2',
        description: 'Gnosis Safe L2 implementation',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "target",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    },
                    {
                        "internalType": "enum Enum.Operation",
                        "name": "operation",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "safeTxGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "baseGas",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "gasPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "gasToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "refundReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signatures",
                        "type": "bytes"
                    }
                ],
                "name": "execTransaction",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    {
        id: 'uups-upgradeable',
        name: 'UUPS Upgradeable',
        description: 'OpenZeppelin UUPS upgradeability pattern',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "newImplementation",
                        "type": "address"
                    }
                ],
                "name": "upgradeTo",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "newImplementation",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "upgradeToAndCall",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            }
        ]
    },
    {
        id: 'sudoswap-pair-factory',
        name: 'Sudoswap Pair Factory',
        description: 'Sudoswap NFT AMM Pair Factory',
        abi: [
            {
                "inputs": [
                    {
                        "internalType": "contract ICurve",
                        "name": "_bondingCurve",
                        "type": "address"
                    },
                    {
                        "internalType": "contract IERC721",
                        "name": "_nft",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_initialDelta",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_initialSpotPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_initialFee",
                        "type": "uint256"
                    }
                ],
                "name": "createPairETH",
                "outputs": [
                    {
                        "internalType": "contract LSSVMPairETH",
                        "name": "pair",
                        "type": "address"
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },

];