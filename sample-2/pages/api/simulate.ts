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
  simulationResult?: "Passed" | "Failed" | "Simulating...";
  gasUsed?: string;
  errorMessage?: string;
  type?: string; // Action 타입은 ProposalForm에서 가져온 것과 일치해야 합니다.
  logs?: string[]; // 로그 저장을 위한 필드 (API 응답에는 포함되지 않음, SSE 이벤트로 전달)
}

interface SimulateRequestBody {
  actions: Omit<
    Action,
    "logs" | "simulationResult" | "gasUsed" | "errorMessage"
  >[]; // API 요청 시에는 결과 필드 제외
  daoContractAddress: string;
  forkRpcUrl: string;
  localRpcUrl: string;
  blockNumber?: string | number;
}

// Helper function to send SSE data
const sendSseEvent = (res: NextApiResponse, eventName: string, data: any) => {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  // console.log(`[API SSE WRITING RAW]:\n${message}`); // 필요시 원본 메시지 로그
  res.write(message);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { actions, daoContractAddress, forkRpcUrl, localRpcUrl, blockNumber } =
    req.body as SimulateRequestBody;

  console.log("[API] Simulation request received:", {
    actionsCount: actions.length,
    dao: daoContractAddress,
    forkUrl: forkRpcUrl,
    localUrl: localRpcUrl,
    block: blockNumber,
  });

  if (!actions || !daoContractAddress || !forkRpcUrl || !localRpcUrl) {
    return res.status(400).json({
      message:
        "Missing required parameters (actions, daoContractAddress, forkRpcUrl, localRpcUrl)",
    });
  }

  // SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx 프록시 사용 시 버퍼링 비활성화
  res.flushHeaders(); // 즉시 헤더 전송

  const localProvider = new ethers.JsonRpcProvider(localRpcUrl);

  const cleanup = async () => {
    try {
      await localProvider.send("hardhat_stopImpersonatingAccount", [
        daoContractAddress,
      ]);
      console.log("[API Cleanup] Impersonation stopped.");
    } catch (e) {
      console.error("[API Cleanup] Error stopping impersonation:", e);
    }
    if (!res.writableEnded) {
      sendSseEvent(res, "simulationComplete", {
        message: "Simulation stream finished.",
      });
      res.end();
      console.log("[API Cleanup] SSE stream explicitly ended.");
    } else {
      console.log("[API Cleanup] SSE stream was already ended.");
    }
  };

  req.on("close", () => {
    console.log("Client closed SSE connection.");
    cleanup();
  });

  try {
    console.log("[API LOG] Attempting to fork network...");
    sendSseEvent(res, "log", {
      message: `Forking network from ${forkRpcUrl}...`,
    });
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
    console.log("[API LOG] Network forked successfully.");
    sendSseEvent(res, "log", { message: "Network forked successfully." });

    console.log("[API LOG] Attempting to impersonate account...");
    sendSseEvent(res, "log", {
      message: `Impersonating account ${daoContractAddress}...`,
    });
    await localProvider.send("hardhat_impersonateAccount", [
      daoContractAddress,
    ]);
    await localProvider.send("hardhat_setBalance", [
      daoContractAddress,
      "0x56BC75E2D63100000", // 100 ETH in Wei (100 * 10^18)
    ]);
    console.log("[API LOG] Account impersonated and balance set.");
    sendSseEvent(res, "log", {
      message: `Account ${daoContractAddress} impersonated and balance set.`,
    });

    for (const action of actions) {
      console.log(
        `[API ACTION ${action.id} LOG] Starting simulation for: ${action.title}`
      );
      let simulatingActionState: Action = {
        ...action,
        simulationResult: "Simulating...",
        logs: [],
      };
      sendSseEvent(res, "actionUpdate", { action: simulatingActionState });
      sendSseEvent(res, "actionLog", {
        actionId: action.id,
        message: `Starting simulation for: ${action.title}`,
      });

      let result: "Passed" | "Failed" = "Failed";
      let gasUsedString = "";
      let errorMessage = "";

      try {
        const txParams = {
          from: daoContractAddress,
          to: action.contractAddress,
          data: action.calldata,
          value: "0x0",
        };
        console.log(
          `[API ACTION ${action.id} LOG] Sending transaction...`,
          txParams
        );
        sendSseEvent(res, "actionLog", {
          actionId: action.id,
          message: `Sending transaction...`,
        });
        const txHash = await localProvider.send("eth_sendTransaction", [
          txParams,
        ]);
        console.log(
          `[API ACTION ${action.id} LOG] Tx sent: ${txHash}. Waiting for receipt...`
        );
        sendSseEvent(res, "actionLog", {
          actionId: action.id,
          message: `Tx sent: ${txHash}. Waiting for receipt...`,
        });

        let receipt = null;
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          receipt = await localProvider.getTransactionReceipt(txHash);
          console.log(
            `[API ACTION ${action.id} LOG] Receipt attempt ${i + 1}`,
            receipt ? `Status: ${receipt.status}` : "Not found yet"
          );
          if (receipt) break;
          sendSseEvent(res, "actionLog", {
            actionId: action.id,
            message: `Receipt attempt ${i + 1}...`,
          });
        }

        if (receipt && receipt.status === 1) {
          result = "Passed";
          gasUsedString = receipt.gasUsed.toString();
          console.log(
            `[API ACTION ${action.id} LOG] PASSED. Gas: ${gasUsedString}`
          );
          sendSseEvent(res, "actionLog", {
            actionId: action.id,
            message: `PASSED. Gas: ${gasUsedString}`,
          });
        } else {
          errorMessage = `FAILED. Status: ${receipt?.status}.`;
          if (receipt) gasUsedString = receipt.gasUsed.toString();
          if (!receipt) errorMessage = "Receipt not found.";
          console.log(`[API ACTION ${action.id} LOG] FAILED: ${errorMessage}`);
          sendSseEvent(res, "actionLog", {
            actionId: action.id,
            message: errorMessage,
          });
        }
      } catch (e: any) {
        errorMessage = e.reason || e.message || "Unknown error.";
        if (e.transactionHash) {
          try {
            const failedReceipt = await localProvider.getTransactionReceipt(
              e.transactionHash
            );
            if (failedReceipt) gasUsedString = failedReceipt.gasUsed.toString();
          } catch (rcptError) {
            /* ignore */
          }
        }
        if (e.data) errorMessage += ` (data: ${e.data})`;
        console.log(`[API ACTION ${action.id} EXCEPTION] ${errorMessage}`, e);
        sendSseEvent(res, "actionLog", {
          actionId: action.id,
          message: `EXCEPTION: ${errorMessage}`,
        });
      }

      const finalActionState: Action = {
        ...action,
        simulationResult: result,
        gasUsed: gasUsedString,
        errorMessage: errorMessage,
        type: action.type || "Custom",
      };
      console.log(
        `[API ACTION ${action.id} UPDATE] Final state:`,
        finalActionState.simulationResult
      );
      sendSseEvent(res, "actionUpdate", { action: finalActionState });
    }
    console.log("[API LOG] All actions processed.");
  } catch (error: any) {
    console.error("[API ERROR]", error);
    sendSseEvent(res, "error", {
      message: error.message || "Unknown error occurred during simulation.",
      detail: error.toString(),
    });
  } finally {
    await cleanup();
  }
}
