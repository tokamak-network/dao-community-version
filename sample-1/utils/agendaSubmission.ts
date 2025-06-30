import { isAddress } from "ethers";
import { prepareAgenda, PrepareAgendaParams } from "./agendaData";
import { checkTonBalance, getNextAgendaNumber, TON_ABI } from "./tonContract";

export interface AgendaSubmissionParams {
  // User info
  userAddress: string;

  // Contract addresses
  tonContractAddress: string;
  daoCommitteeProxyAddress: string;
  daoAgendaManagerAddress: string;

  // Agenda data
  actions: Array<{
    id: string;
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi?: any[];
  }>;

  // Form data
  snapshotUrl: string;
  discourseUrl: string;

  // Contract settings
  createAgendaFees: bigint;
  minimumNoticePeriodSeconds: bigint;
  minimumVotingPeriodSeconds: bigint;

  // Wagmi function
  writeContract: any;
}

export interface AgendaSubmissionResult {
  success: boolean;
  agendaNumber?: string;
  error?: string;
  errorType?: 'validation' | 'balance' | 'contract' | 'user_rejected' | 'unknown';
}

/**
 * Complete agenda submission workflow
 */
export async function submitAgenda(params: AgendaSubmissionParams): Promise<AgendaSubmissionResult> {
  const {
    userAddress,
    tonContractAddress,
    daoCommitteeProxyAddress,
    daoAgendaManagerAddress,
    actions,
    snapshotUrl,
    discourseUrl,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    writeContract,
  } = params;

  try {
    // 1. Validate user address
    if (!userAddress || !isAddress(userAddress)) {
      return {
        success: false,
        error: "Invalid wallet address. Please reconnect your wallet.",
        errorType: 'validation'
      };
    }

    // 2. Validate createAgendaFees
    if (!createAgendaFees) {
      return {
        success: false,
        error: "Invalid createAgendaFees. Please reconnect your wallet.",
        errorType: 'validation'
      };
    }

    // 3. Check TON balance
    const balanceCheck = await checkTonBalance({
      userAddress,
      tonContractAddress,
      requiredAmount: createAgendaFees,
    });

    if (!balanceCheck.sufficient) {
      return {
        success: false,
        error: `The agenda fee is ${balanceCheck.required} TON, but your wallet TON balance is insufficient. Current TON balance: ${balanceCheck.balance} TON`,
        errorType: 'balance'
      };
    }

    // 4. Prepare agenda data
    const agendaData = await prepareAgenda({
      actions,
      snapshotUrl,
      discourseUrl,
      minimumNoticePeriodSeconds,
      minimumVotingPeriodSeconds,
      daoCommitteeProxyAddress,
    });

    // 5. Get agenda number before transaction
    const agendaNumber = await getNextAgendaNumber({
      daoAgendaManagerAddress,
    });

    // 6. Validate writeContract function
    if (!writeContract) {
      return {
        success: false,
        error: "Contract write not ready",
        errorType: 'contract'
      };
    }

    // 7. Execute transaction
    await writeContract({
      address: tonContractAddress as `0x${string}`,
      abi: TON_ABI,
      functionName: "approveAndCall",
      args: [
        daoCommitteeProxyAddress as `0x${string}`,
        createAgendaFees,
        agendaData.param,
      ],
    });

    return {
      success: true,
      agendaNumber,
    };

  } catch (error: any) {
    console.error("Error submitting agenda:", error);

    // Log detailed error information
    if (error.code) console.error("Error code:", error.code);
    if (error.message) console.error("Error message:", error.message);
    if (error.data) console.error("Error data:", error.data);

    // Handle user rejection
    if (error.message && error.message.includes("User denied transaction signature")) {
      return {
        success: false,
        error: "Transaction was cancelled by user.",
        errorType: 'user_rejected'
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error.message || "An unknown error occurred during submission.",
      errorType: 'unknown'
    };
  }
}

/**
 * Validate agenda submission parameters before submission
 */
export function validateAgendaParams(params: AgendaSubmissionParams): { valid: boolean; error?: string } {
  // Check required addresses
  if (!params.userAddress) {
    return { valid: false, error: "Wallet not connected" };
  }

  if (!params.tonContractAddress) {
    return { valid: false, error: "TON contract address not configured" };
  }

  if (!params.daoCommitteeProxyAddress) {
    return { valid: false, error: "DAO committee proxy address not configured" };
  }

  if (!params.daoAgendaManagerAddress) {
    return { valid: false, error: "DAO agenda manager address not configured" };
  }

  // Check actions
  if (!params.actions || params.actions.length === 0) {
    return { valid: false, error: "At least one action is required" };
  }

  // Check required parameters
  if (!params.createAgendaFees) {
    return { valid: false, error: "Create agenda fees not available" };
  }

  if (!params.minimumNoticePeriodSeconds) {
    return { valid: false, error: "Minimum notice period not available" };
  }

  if (!params.minimumVotingPeriodSeconds) {
    return { valid: false, error: "Minimum voting period not available" };
  }

  return { valid: true };
}