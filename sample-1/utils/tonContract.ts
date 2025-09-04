import { ethers, BrowserProvider } from "ethers";

// TON contract ABI
export const TON_ABI = [
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
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface TonBalanceCheckParams {
  userAddress: string;
  tonContractAddress: string;
  requiredAmount: bigint;
}

export interface TonBalanceCheckResult {
  balance: number;
  required: number;
  sufficient: boolean;
}

/**
 * Check if user has sufficient TON balance for agenda fees
 */
export async function checkTonBalance(params: TonBalanceCheckParams): Promise<TonBalanceCheckResult> {
  const { userAddress, tonContractAddress, requiredAmount } = params;

  const provider = new BrowserProvider(window.ethereum as any);
  const tonContract = new ethers.Contract(
    tonContractAddress,
    TON_ABI,
    provider
  );

  const tonBalanceRaw = await tonContract.balanceOf(userAddress);
  const balance = Number(ethers.formatUnits(tonBalanceRaw, 18));
  const required = Number(ethers.formatUnits(requiredAmount, 18));

  return {
    balance,
    required,
    sufficient: balance >= required,
  };
}

export interface GetAgendaNumberParams {
  daoAgendaManagerAddress: string;
}

/**
 * Get the current agenda number from DAO Agenda Manager
 */
export async function getNextAgendaNumber(params: GetAgendaNumberParams): Promise<string> {
  const { daoAgendaManagerAddress } = params;

  const provider = new BrowserProvider(window.ethereum as any);
  const daoAgendaManager = new ethers.Contract(
    daoAgendaManagerAddress,
    ["function numAgendas() view returns (uint256)"],
    provider
  );

  const numAgendas = await daoAgendaManager.numAgendas();
  const agendaNumber = numAgendas.toString();

  return agendaNumber;
}