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
  batchMode?: boolean; // 배치 실행 모드 옵션
}

export async function POST(request: NextRequest) {
  try {
    const { actions, daoContractAddress, forkRpcUrl, localRpcUrl, blockNumber, batchMode }: SimulateRequestBody =
      await request.json();

    // console.log("[API] Simulation request received:", {
    //   actionsCount: actions.length,
    //   dao: daoContractAddress,
    //   forkUrl: forkRpcUrl,
    //   localUrl: localRpcUrl,
    //   block: blockNumber,
    //   batchMode: batchMode || false,
    // });

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
            // console.log(`[API] Skipping SSE event '${eventName}' - stream already closed`);
            return;
          }
          try {
            const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error: any) {
            if (error.code === 'ERR_INVALID_STATE') {
              // console.log(`[API] Stream closed during SSE event '${eventName}'`);
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
            // console.log("[API Cleanup] Impersonation stopped.");
          } catch (e) {
            console.error("[API Cleanup] Error stopping impersonation:", e);
          }
          sendSseEvent("simulationComplete", {
            message: "Simulation stream finished.",
          });
          isStreamClosed = true;
          controller.close();
          // console.log("[API Cleanup] SSE stream explicitly ended.");
        };

        const simulateActions = async () => {
          try {
            // Step 1: 로컬 노드 연결 테스트
            // console.log("[API LOG] Testing connection to local Hardhat node...");
            sendSseEvent("log", {
              message: `Testing connection to local Hardhat node: ${localRpcUrl}...`,
            });

            try {
              const blockNumber = await localProvider.getBlockNumber();
              // console.log(`[API LOG] Local node connected successfully. Current block: ${blockNumber}`);
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
            // console.log("[API LOG] Attempting to impersonate account...");
            sendSseEvent("log", {
              message: `Impersonating account ${daoContractAddress}...`,
            });

            try {
              await localProvider.send("hardhat_impersonateAccount", [
                daoContractAddress,
              ]);
              // console.log("[API LOG] Account impersonation successful.");
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
              // console.log("[API LOG] Account balance set successfully.");
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



            // 배치 모드 메시지 추가
            if (batchMode) {
              console.log("[API LOG] Starting batch simulation mode - all actions will be executed in sequence");
              sendSseEvent("log", {
                message: "Batch simulation mode: All actions will be executed in the same block sequence",
              });
            } else {
              console.log("[API LOG] Starting individual simulation mode - each action will be executed separately");
              sendSseEvent("log", {
                message: "Individual simulation mode: Each action will be executed in separate blocks",
              });
            }

            // 배치 모드에서는 자동 마이닝을 비활성화
            if (batchMode) {
              try {
                await localProvider.send("evm_setAutomine", [false]);
                console.log("[API LOG] Auto mining disabled for batch mode");
                sendSseEvent("log", {
                  message: "Auto mining disabled for batch execution",
                });
              } catch (error) {
                console.warn("[API WARN] Could not disable auto mining:", error);
              }
            }

            const txHashes: string[] = [];
            const actionResults: { [actionId: string]: { success: boolean; receipt?: any; error?: string } } = {};

            for (const action of actions) {
              console.log(
                `[API ACTION ${action.id} LOG] Starting ${batchMode ? 'batch' : 'individual'} simulation for: ${action.title}`
              );
              let simulatingActionState: Action = {
                ...action,
                simulationResult: "Simulating...",
                logs: [],
              };
              sendSseEvent("actionUpdate", { action: simulatingActionState });
              sendSseEvent("actionLog", {
                actionId: action.id,
                message: `Starting ${batchMode ? 'batch' : 'individual'} simulation for: ${action.title}`,
              });

              let result: "Passed" | "Failed" = "Failed";
              let gasUsedString = "";
              let errorMessage = "";

              try {
                // 가스 한도 추정
                let gasLimit = "0x1C9C380"; // 30M gas as default
                try {
                  const estimatedGas = await localProvider.estimateGas({
                    from: daoContractAddress,
                    to: action.contractAddress,
                    data: action.calldata,
                    value: "0x0",
                  });
                  gasLimit = "0x" + (estimatedGas * BigInt(120) / BigInt(100)).toString(16); // 120% of estimated
                } catch (gasError) {
                  // Gas estimation failed, use default
                }

                const txParams = {
                  from: daoContractAddress,
                  to: action.contractAddress,
                  data: action.calldata,
                  value: "0x0",
                  gas: gasLimit,
                };
                sendSseEvent("actionLog", {
                  actionId: action.id,
                  message: `Sending transaction...`,
                });
                const txHash = await localProvider.send("eth_sendTransaction", [
                  txParams,
                ]);
                console.log(
                  `[API ACTION ${action.id} LOG] Tx sent: ${txHash}. ${batchMode ? 'Queued for batch execution' : 'Waiting for receipt...'}`,
                );
                sendSseEvent("actionLog", {
                  actionId: action.id,
                  message: `Tx sent: ${txHash}. ${batchMode ? 'Queued for batch execution' : 'Waiting for receipt...'}`,
                });

                txHashes.push(txHash);



                if (!batchMode) {
                  // 개별 모드에서는 즉시 영수증 처리
                  let receipt = null;
                  for (let i = 0; i < 10; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    receipt = await localProvider.getTransactionReceipt(txHash);
                    if (receipt) break;
                  }

                  if (receipt) {
                    result = "Passed";
                    gasUsedString = receipt.gasUsed
                      ? receipt.gasUsed.toString()
                      : "N/A";
                    console.log(
                      `[API ACTION ${action.id} LOG] Transaction successful. Gas used: ${gasUsedString}`
                    );
                    sendSseEvent("actionLog", {
                      actionId: action.id,
                      message: `Transaction successful. Gas used: ${gasUsedString}`,
                    });
                  } else {
                    result = "Failed";
                    errorMessage = "Transaction receipt not found";
                    console.log(
                      `[API ACTION ${action.id} LOG] Transaction failed: ${errorMessage}`
                    );
                    sendSseEvent("actionLog", {
                      actionId: action.id,
                      message: `Transaction failed: ${errorMessage}`,
                    });
                  }

                  // 개별 모드에서 즉시 결과 업데이트
                  const finalActionState: Action = {
                    ...action,
                    simulationResult: result,
                    gasUsed: gasUsedString,
                    errorMessage: errorMessage,
                  };
                  sendSseEvent("actionUpdate", { action: finalActionState });
                } else {
                  // 배치 모드에서는 나중에 처리하기 위해 저장
                  actionResults[action.id] = { success: true };
                }
              } catch (error: any) {
                console.error(
                  `[API ACTION ${action.id} LOG] Transaction failed:`,
                  error
                );
                result = "Failed";
                errorMessage = error.message || "Transaction failed";
                sendSseEvent("actionLog", {
                  actionId: action.id,
                  message: `Transaction failed: ${errorMessage}`,
                });

                if (!batchMode) {
                  // 개별 모드에서 즉시 결과 업데이트
                  const finalActionState: Action = {
                    ...action,
                    simulationResult: result,
                    gasUsed: gasUsedString,
                    errorMessage: errorMessage,
                  };
                  sendSseEvent("actionUpdate", { action: finalActionState });
                } else {
                  // 배치 모드에서는 에러 저장
                  actionResults[action.id] = { success: false, error: errorMessage };
                }
              }
            }

            // 배치 모드에서 모든 트랜잭션을 보낸 후 처리
            if (batchMode && txHashes.length > 0) {
              try {
                console.log("[API LOG] Mining all transactions in batch...");
                sendSseEvent("log", {
                  message: "Mining all transactions in a single block...",
                });



                // 블록 마이닝 실행
                await localProvider.send("evm_mine", []);



                console.log("[API LOG] Block mined. Processing receipts...");
                sendSseEvent("log", {
                  message: "Block mined successfully. Processing transaction receipts...",
                });



                // 모든 트랜잭션 영수증을 가져와서 결과 업데이트
                for (let i = 0; i < actions.length; i++) {
                  const action = actions[i];
                  const txHash = txHashes[i];

                  if (actionResults[action.id]?.success) {
                    try {
                      // 배치 모드에서도 영수증을 기다리는 로직 추가
                      let receipt = null;
                      for (let retryCount = 0; retryCount < 10; retryCount++) {
                        await new Promise((resolve) => setTimeout(resolve, 300));
                        receipt = await localProvider.getTransactionReceipt(txHash);
                        if (receipt) break;
                      }

                      let result: "Passed" | "Failed" = "Failed";
                      let gasUsedString = "";
                      let errorMessage = "";

                      if (receipt && receipt.status === 1) {
                        result = "Passed";
                        gasUsedString = receipt.gasUsed ? receipt.gasUsed.toString() : "N/A";
                        console.log(`[API ACTION ${action.id} LOG] Batch execution successful. Gas used: ${gasUsedString}`);
                        sendSseEvent("actionLog", {
                          actionId: action.id,
                          message: `Batch execution successful. Gas used: ${gasUsedString}`,
                        });
                      } else {
                        result = "Failed";
                        errorMessage = receipt ? `Transaction failed with status: ${receipt.status}` : "Transaction receipt not found";
                        console.log(`[API ACTION ${action.id} LOG] Batch execution failed: ${errorMessage}`);
                        sendSseEvent("actionLog", {
                          actionId: action.id,
                          message: `Batch execution failed: ${errorMessage}`,
                        });
                      }

                      const finalActionState: Action = {
                        ...action,
                        simulationResult: result,
                        gasUsed: gasUsedString,
                        errorMessage: errorMessage,
                      };
                      sendSseEvent("actionUpdate", { action: finalActionState });
                    } catch (error: any) {
                      console.error(`[API ACTION ${action.id} LOG] Error processing receipt:`, error);
                      const finalActionState: Action = {
                        ...action,
                        simulationResult: "Failed",
                        gasUsed: "",
                        errorMessage: error.message || "Error processing transaction receipt",
                      };
                      sendSseEvent("actionUpdate", { action: finalActionState });
                    }
                  } else {
                    // 이미 실패한 트랜잭션 처리
                    const finalActionState: Action = {
                      ...action,
                      simulationResult: "Failed",
                      gasUsed: "",
                      errorMessage: actionResults[action.id].error || "Transaction failed",
                    };
                    sendSseEvent("actionUpdate", { action: finalActionState });
                  }
                }

                // 자동 마이닝 재활성화
                try {
                  await localProvider.send("evm_setAutomine", [true]);
                  console.log("[API LOG] Auto mining re-enabled");
                  sendSseEvent("log", {
                    message: "Auto mining re-enabled",
                  });
                } catch (error) {
                  console.warn("[API WARN] Could not re-enable auto mining:", error);
                }

                sendSseEvent("log", {
                  message: "Batch simulation completed successfully",
                });

                                                // 배치 시뮬레이션 완료 후 시간 경과 시뮬레이션
                const blocksToMine = 3; // 3개의 빈 블록 마이닝
                const timePerBlock = 12; // 12초 (이더리움 평균 블록 시간)

                sendSseEvent("log", {
                  message: `Simulating time passage: ${blocksToMine} blocks (${blocksToMine * timePerBlock}s)...`,
                });

                                // 시간 증가
                try {
                  await localProvider.send("evm_increaseTime", [blocksToMine * timePerBlock]);
                } catch (error) {
                  console.warn(`[API WARN] Could not increase time:`, error);
                }

                // 빈 블록들 마이닝
                for (let i = 0; i < blocksToMine; i++) {
                  try {
                    await localProvider.send("evm_mine", []);
                  } catch (error) {
                    console.warn(`[API WARN] Could not mine empty block ${i + 1}:`, error);
                  }
                }

                const finalBlockNumber = await localProvider.getBlockNumber();
                sendSseEvent("log", {
                  message: `Time passage simulation completed. Current block: ${finalBlockNumber}`,
                });


              } catch (error: any) {
                console.error("[API ERROR] Batch processing failed:", error);
                sendSseEvent("error", {
                  message: `Batch processing failed: ${error.message}`,
                });
              }
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