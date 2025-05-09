import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

// Action 타입 정의 (ProposalForm.tsx와 일치 또는 공유 필요)
interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
  simulationResult?: "Passed" | "Failed";
  gasUsed?: string;
  errorMessage?: string;
  type?: string; // Action 타입은 ProposalForm에서 가져온 것과 일치해야 합니다.
}

interface SimulateRequestBody {
  actions: Action[];
  daoContractAddress: string;
  forkRpcUrl: string;
  localRpcUrl: string;
  blockNumber?: string | number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { actions, daoContractAddress, forkRpcUrl, localRpcUrl, blockNumber } =
    req.body as SimulateRequestBody;

  console.log("daoContractAddress", daoContractAddress);
  console.log("forkRpcUrl", forkRpcUrl);
  console.log("localRpcUrl", localRpcUrl);
  console.log("blockNumber", blockNumber);

  if (!actions || !daoContractAddress || !forkRpcUrl || !localRpcUrl) {
    return res.status(400).json({
      message:
        "Missing required parameters (actions, daoContractAddress, forkRpcUrl, localRpcUrl)",
    });
  }

  const localProvider = new ethers.JsonRpcProvider(localRpcUrl);
  const simulatedActions: Action[] = [];

  try {
    await localProvider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: forkRpcUrl,
          blockNumber: blockNumber
            ? typeof blockNumber === "string"
              ? parseInt(blockNumber)
              : blockNumber
            : undefined,
        },
      },
    ]);

    await localProvider.send("hardhat_impersonateAccount", [
      daoContractAddress,
    ]);

    // 위장된 계정에 충분한 잔액 설정 (예: 100 ETH)
    await localProvider.send("hardhat_setBalance", [
      daoContractAddress,
      "0x56BC75E2D63100000", // 100 ETH in Wei (100 * 10^18)
    ]);

    console.log(`Account ${daoContractAddress} impersonated and balance set.`);

    for (const action of actions) {
      let result: "Passed" | "Failed" = "Failed";
      let gasUsedString = "";
      let errorMessage = "";
      let updatedAction = { ...action };

      try {
        const txParams = {
          from: daoContractAddress,
          to: action.contractAddress,
          data: action.calldata,
          value: "0x0",
        };

        console.log(
          `Sending transaction from ${txParams.from} to ${
            txParams.to
          } with data ${
            txParams.data ? txParams.data.substring(0, 10) + "..." : "NONE"
          }`
        );

        const txHash = await localProvider.send("eth_sendTransaction", [
          txParams,
        ]);
        console.log(
          `Transaction sent for action ${action.id}, hash: ${txHash}, waiting for receipt...`
        );

        let receipt = null;
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          receipt = await localProvider.getTransactionReceipt(txHash);
          if (receipt) break;
        }

        console.log(
          `Receipt received for action ${action.id}, status: ${receipt?.status}`
        );

        if (receipt && receipt.status === 1) {
          result = "Passed";
          gasUsedString = receipt.gasUsed.toString();
        } else {
          errorMessage = `Transaction failed on-chain. Status: ${receipt?.status}.`;
          if (receipt) gasUsedString = receipt.gasUsed.toString(); // 실패해도 가스는 소모됨
          if (!receipt)
            errorMessage = "Transaction receipt not found after sending.";
        }
      } catch (e: any) {
        console.error(
          `Error simulating action ${action.id} (${action.title}):`,
          e
        );
        errorMessage =
          e.reason || e.message || "Simulation failed with an unknown error.";
        if (e.transactionHash) {
          try {
            const failedReceipt = await localProvider.getTransactionReceipt(
              e.transactionHash
            );
            if (failedReceipt) gasUsedString = failedReceipt.gasUsed.toString();
          } catch (rcptError) {
            console.error("Error fetching receipt for failed tx:", rcptError);
          }
        }
        if (e.data) {
          errorMessage += ` (data: ${e.data})`;
        }
      }

      updatedAction.simulationResult = result;
      updatedAction.gasUsed = gasUsedString;
      updatedAction.errorMessage = errorMessage;
      simulatedActions.push(updatedAction);
    }

    await localProvider.send("hardhat_stopImpersonatingAccount", [
      daoContractAddress,
    ]);

    res.status(200).json({ simulatedActions });
  } catch (error: any) {
    console.error("Simulation API error:", error);
    try {
      await localProvider.send("hardhat_stopImpersonatingAccount", [
        daoContractAddress,
      ]);
    } catch (stopImpersonateError) {
      console.error(
        "Error stopping impersonation after failure:",
        stopImpersonateError
      );
    }
    res.status(500).json({
      message: "Error during simulation process",
      error: error.message,
    });
  }
}
