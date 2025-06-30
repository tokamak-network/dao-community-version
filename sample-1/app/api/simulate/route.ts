import { ethers } from "ethers";
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { actions, daoContractAddress, forkRpcUrl, localRpcUrl, blockNumber }: SimulateRequestBody =
      await request.json();

    console.log("[API] Simulation request received:", {
      actionsCount: actions.length,
      dao: daoContractAddress,
      forkUrl: forkRpcUrl,
      localUrl: localRpcUrl,
      block: blockNumber,
    });

    if (!actions || !daoContractAddress || !forkRpcUrl || !localRpcUrl) {
      return NextResponse.json({
        message: "Missing required parameters (actions, daoContractAddress, forkRpcUrl, localRpcUrl)",
      }, { status: 400 });
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Helper function to send SSE data
        let isStreamClosed = false;
        const sendSseEvent = (eventName: string, data: any) => {
          if (isStreamClosed) {
            console.log(`[API] Skipping SSE event '${eventName}' - stream already closed`);
            return;
          }
          try {
            const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error: any) {
            if (error.code === 'ERR_INVALID_STATE') {
              console.log(`[API] Stream closed during SSE event '${eventName}'`);
              isStreamClosed = true;
            } else {
              console.error(`[API] SSE event error:`, error);
            }
          }
        };

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
          sendSseEvent("simulationComplete", {
            message: "Simulation stream finished.",
          });
          isStreamClosed = true;
          controller.close();
          console.log("[API Cleanup] SSE stream explicitly ended.");
        };

        const simulateActions = async () => {
          try {
            // Step 1: 로컬 노드 연결 테스트
            console.log("[API LOG] Testing connection to local Hardhat node...");
            sendSseEvent("log", {
              message: `Testing connection to local Hardhat node: ${localRpcUrl}...`,
            });

            try {
              const blockNumber = await localProvider.getBlockNumber();
              console.log(`[API LOG] Local node connected successfully. Current block: ${blockNumber}`);
              sendSseEvent("log", {
                message: `Local node connected successfully. Current block: ${blockNumber}`
              });
            } catch (connectionError: any) {
              console.error("[API ERROR] Cannot connect to local node:", connectionError);
              sendSseEvent("error", {
                message: `Cannot connect to local Hardhat node at ${localRpcUrl}`,
                detail: `Error: ${connectionError.message}. Please ensure Hardhat node is running with: npx hardhat node --fork <RPC_URL>`
              });
              return;
            }

            // Step 2: 계정 Impersonation (포킹은 이미 완료된 상태)
            console.log("[API LOG] Attempting to impersonate account...");
            sendSseEvent("log", {
              message: `Impersonating account ${daoContractAddress}...`,
            });

            try {
              await localProvider.send("hardhat_impersonateAccount", [
                daoContractAddress,
              ]);
              console.log("[API LOG] Account impersonation successful.");
              sendSseEvent("log", {
                message: `Account ${daoContractAddress} impersonated successfully.`,
              });
            } catch (impersonateError: any) {
              console.error("[API ERROR] Account impersonation failed:", impersonateError);
              sendSseEvent("error", {
                message: "Account impersonation failed",
                detail: `Error: ${impersonateError.message}. Check if DAO address is valid: ${daoContractAddress}`
              });
              return;
            }

            // Step 3: 잔액 설정
            try {
              await localProvider.send("hardhat_setBalance", [
                daoContractAddress,
                "0x56BC75E2D63100000", // 100 ETH in Wei (100 * 10^18)
              ]);
              console.log("[API LOG] Account balance set successfully.");
              sendSseEvent("log", {
                message: `Account balance set to 100 ETH.`,
              });
            } catch (balanceError: any) {
              console.error("[API ERROR] Setting balance failed:", balanceError);
              sendSseEvent("error", {
                message: "Setting account balance failed",
                detail: `Error: ${balanceError.message}`
              });
              return;
            }

            for (const action of actions) {
              console.log(
                `[API ACTION ${action.id} LOG] Starting simulation for: ${action.title}`
              );
              let simulatingActionState: Action = {
                ...action,
                simulationResult: "Simulating...",
                logs: [],
              };
              sendSseEvent("actionUpdate", { action: simulatingActionState });
              sendSseEvent("actionLog", {
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
                sendSseEvent("actionLog", {
                  actionId: action.id,
                  message: `Sending transaction...`,
                });
                const txHash = await localProvider.send("eth_sendTransaction", [
                  txParams,
                ]);
                console.log(
                  `[API ACTION ${action.id} LOG] Tx sent: ${txHash}. Waiting for receipt...`
                );
                sendSseEvent("actionLog", {
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
                  sendSseEvent("actionLog", {
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
                  sendSseEvent("actionLog", {
                    actionId: action.id,
                    message: `PASSED. Gas: ${gasUsedString}`,
                  });
                } else {
                  errorMessage = `FAILED. Status: ${receipt?.status}.`;
                  if (receipt) gasUsedString = receipt.gasUsed.toString();
                  if (!receipt) errorMessage = "Receipt not found.";
                  console.log(`[API ACTION ${action.id} LOG] FAILED: ${errorMessage}`);
                  sendSseEvent("actionLog", {
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
                sendSseEvent("actionLog", {
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
              sendSseEvent("actionUpdate", { action: finalActionState });
            }
            console.log("[API LOG] All actions processed.");
          } catch (error: any) {
            console.error("[API ERROR]", error);
            sendSseEvent("error", {
              message: error.message || "Unknown error occurred during simulation.",
              detail: error.toString(),
            });
          } finally {
            await cleanup();
          }
        };

        // Start simulation process
        simulateActions().catch((error) => {
          console.error('[API] Simulation process error:', error);
          sendSseEvent('error', {
            detail: error.message || 'Simulation process failed',
            message: 'Critical simulation error'
          });
          controller.close();
        });
      },

      cancel() {
        console.log('[API] Stream cancelled by client');
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('[API] Request error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}