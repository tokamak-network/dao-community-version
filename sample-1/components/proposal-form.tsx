"use client";

import React, { Component } from "react";
import {
  FileEdit,
  Eye,
  Save,
  FileUp,
  ChevronUp,
  ChevronDown,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalInfoButton } from "@/components/ui/proposal-info-button";
import { ProposalAddActionButton } from "@/components/ui/proposal-add-action-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProposalAddInfo } from "@/components/ui/proposal-add-info";
import { ProposalSelectAction } from "@/components/ui/proposal-select-action";
import { ProposalEditAction } from "@/components/ui/proposal-edit-action";
import { ProposalPreview } from "@/components/ui/proposal-preview";
import { ProposalImpactOverview } from "@/components/ui/proposal-impact-overview";
import { ethers, BrowserProvider, isAddress } from "ethers";
import { TON_CONTRACT_ADDRESS, DAO_COMMITTEE_PROXY_ADDRESS, DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { submitAgenda, validateAgendaParams, AgendaSubmissionParams } from "@/utils/agendaSubmission";
import { TransactionModal, TransactionStatus } from "@/components/modals/TransactionModal";
import { prepareAgenda } from "@/utils/agendaData";
import { TON_ABI } from "@/utils/tonContract";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useAgenda } from "@/contexts/AgendaContext";

interface ProposalFormProps {
  address?: `0x${string}`;
  isConnected?: boolean;
  writeContract?: any;
  writeData?: `0x${string}`;
  writeError?: any;
  createAgendaFees?: bigint | null;
  minimumNoticePeriodSeconds?: bigint | null;
  minimumVotingPeriodSeconds?: bigint | null;
}

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
  simulationResult?: "Passed" | "Failed" | "Simulating..." | "Pending";
  tenderlyUrl?: string;
  type?: string;
  gasUsed?: string;
  errorMessage?: string;
  logs?: string[];
}

interface ProposalFormState {
  title: string;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  activeTab: string;
  showSelectAction: boolean;
  actions: Action[];
  editingAction: Action | null;
  showEditAction: boolean;
  showImpactOverview: boolean;
  simulationStep: "initial" | "results";
  simulatedActions: Action[];
  generalSimulationLogs: string[];
  eventSourceInstance: EventSource | null;
  pendingText: string;
  expandedActionLogs: { [actionId: string]: boolean };
  showSimulation: boolean;
  isEditMode: boolean;
  activeEditSection: string;
  selectedActionId: string | null;
  currentSection: string;

  transactionSuccess: boolean;
  canSubmit: boolean;

  // Transaction status management
  txState: "idle" | "submitting" | "pending" | "success" | "error";
  showSuccessModal: boolean;
  isTransactionPending: boolean;
  agendaNumber: string;
}

export default class ProposalForm extends Component<ProposalFormProps, ProposalFormState> {
  private pendingAnimationInterval: NodeJS.Timeout | null = null;
  private fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: ProposalFormProps) {
    super(props);
    this.state = {
      title: "",
      description: "",
      snapshotUrl: "",
      discourseUrl: "",
      activeTab: "edit",
      showSelectAction: false,
      actions: [],
      editingAction: null,
      showEditAction: false,
      showImpactOverview: false,
      simulationStep: "initial",
      simulatedActions: [],
      generalSimulationLogs: [],
      eventSourceInstance: null,
      pendingText: "Pending...",
      expandedActionLogs: {},
      showSimulation: false,
      isEditMode: false,
      activeEditSection: "",
      selectedActionId: null,
      currentSection: "actions",
      transactionSuccess: false,
      canSubmit: false,

      // Transaction status management
      txState: "idle",
      showSuccessModal: false,
      isTransactionPending: false,
      agendaNumber: "",
    };
  }

  componentDidMount() {
    let dotCount = 0;
    this.pendingAnimationInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      this.setState({ pendingText: `Pending${Array(dotCount + 1).join(".")}` });
    }, 500);
  }

  componentWillUnmount() {
    if (this.state.eventSourceInstance) {
      this.state.eventSourceInstance.close();
      console.log("SSE connection closed on component unmount.");
    }
    if (this.pendingAnimationInterval) {
      clearInterval(this.pendingAnimationInterval);
    }
  }

  handleAddActionClick = () => {
    this.setState({
      showSelectAction: true,
      showEditAction: false,
      showImpactOverview: false,
      simulationStep: "initial",
      activeTab: "edit",
      isEditMode: false,
      activeEditSection: "",
      showSimulation: false,
    });
  };

  handleAddAction = (newActionData: Omit<Action, "id">) => {
    const newAction: Action = {
      ...newActionData,
      id: Date.now().toString(),
      type: "Custom",
    };

    this.setState((prevState) => ({
      actions: [...prevState.actions, newAction],
      showSelectAction: false,
    }));
  };

  handleEditActionClick = (actionToEdit: Action) => {
    this.setState({
      editingAction: actionToEdit,
      showEditAction: true,
      showSelectAction: false,
      showImpactOverview: false,
    });
  };

  handleSaveChanges = (updatedAction: Action) => {
    this.setState((prevState) => ({
      actions: prevState.actions.map((action) =>
        action.id === updatedAction.id ? updatedAction : action
      ),
      showEditAction: false,
      editingAction: null,
    }));
  };

  handleCancelEdit = () => {
    this.setState({
      showEditAction: false,
      editingAction: null,
    });
  };

  handleRemoveAction = (actionId: string) => {
    this.setState((prevState) => ({
      actions: prevState.actions.filter((action) => action.id !== actionId),
      showEditAction: false,
      editingAction: null,
    }));
  };

  handleImpactOverviewClick = () => {
    this.setState({
      showImpactOverview: true,
      showSelectAction: false,
      showEditAction: false,
    });
  };

  handleSimulateExecutionClick = async () => {
    if (this.state.eventSourceInstance) {
      this.state.eventSourceInstance.close();
      this.setState({ eventSourceInstance: null });
    }

    const initialSimActions = this.state.actions.map((action) => ({
      ...action,
      simulationResult: "Pending" as "Pending",
      gasUsed: "",
      errorMessage: "",
      logs: [],
    }));

    this.setState({
      simulationStep: "results",
      simulatedActions: initialSimActions,
      generalSimulationLogs: ["Connecting to simulation server..."],
      expandedActionLogs: {},
    });

    const daoAddress = process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS;
    const forkRpc = process.env.NEXT_PUBLIC_RPC_URL;
    const localRpc = process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL;

    if (!daoAddress || !forkRpc || !localRpc) {
      alert("Required environment variables are not set.");
      const errorActions = this.state.actions.map((a) => ({
        ...a,
        simulationResult: "Failed" as "Failed",
        errorMessage: "Config error",
      }));
      this.setState({
        simulationStep: "results",
        simulatedActions: errorActions,
        generalSimulationLogs: ["Configuration error. Check .env.local file."],
      });
      return;
    }

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: this.state.actions,
          daoContractAddress: daoAddress,
          forkRpcUrl: forkRpc,
          localRpcUrl: localRpc,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg =
          errorData.message ||
          `API request failed with status ${response.status}`;
        this.setState((prevState) => ({
          simulatedActions: prevState.simulatedActions.map((sa) => ({
            ...sa,
            simulationResult: "Failed",
            errorMessage:
              sa.simulationResult === "Pending" ||
              sa.simulationResult === "Simulating..."
                ? errorMsg
                : sa.errorMessage,
            logs: [...(sa.logs || []), `API Request Error: ${errorMsg}`],
          })),
          generalSimulationLogs: [
            ...prevState.generalSimulationLogs.filter(
              (log) => log !== "Connecting to simulation server..."
            ),
            `Error: ${errorMsg}`,
          ],
        }));
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let firstLogReceived = false;

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("Stream finished.");
            const finalLogs = this.state.generalSimulationLogs.filter(
              (log) => log !== "Connecting to simulation server..."
            );
            if (
              this.state.generalSimulationLogs.some(
                (log) =>
                  log.startsWith("Error:") ||
                  log.startsWith("Critical Error:") ||
                  log.startsWith("Stream Error:") ||
                  log.startsWith("Initialization Error:")
              ) === false
            ) {
              this.setState({
                generalSimulationLogs: [
                  ...finalLogs,
                  "Simulation process completed.",
                ],
              });
            }
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          console.log("[FRONTEND SSE BUFFER AFTER DECODE]", buffer);

          if (!firstLogReceived && buffer.length > 0) {
            firstLogReceived = true;
            this.setState({
              generalSimulationLogs: this.state.generalSimulationLogs.filter(
                (log) => log !== "Connecting to simulation server..."
              ),
            });
          }

          let eventEndIndex = buffer.indexOf("\n\n");
          while (eventEndIndex !== -1) {
            const eventString = buffer.substring(0, eventEndIndex);
            buffer = buffer.substring(eventEndIndex + 2);
            console.log(
              "[FRONTEND SSE RAW EVENT STRING]",
              JSON.stringify(eventString)
            );

            let eventName = "message";
            let eventDataString = eventString;

            if (eventString.startsWith("event:")) {
              const firstNewline = eventString.indexOf("\n");
              eventName = eventString
                .substring("event:".length, firstNewline)
                .trim();
              eventDataString = eventString.substring(firstNewline + 1);
            }
            if (eventDataString.startsWith("data:")) {
              eventDataString = eventDataString
                .substring("data:".length)
                .trim();
            }

            console.log("[FRONTEND SSE PARSED EVENT INFO]", {
              eventName,
              eventDataString,
            });

            try {
              const parsedData = JSON.parse(eventDataString);
              console.log("[FRONTEND SSE JSON PARSED DATA]", parsedData);

              if (eventName === "log") {
                console.log(
                  "[FRONTEND SSE EVENT TYPE] log - Message:",
                  parsedData.message
                );
                this.setState((prevState) => ({
                  generalSimulationLogs: [
                    ...prevState.generalSimulationLogs,
                    parsedData.message,
                  ],
                }));
              } else if (eventName === "actionLog") {
                console.log(
                  "[FRONTEND SSE EVENT TYPE] actionLog - ActionID:",
                  parsedData.actionId,
                  "Message:",
                  parsedData.message
                );
                this.setState((prevState) => ({
                  simulatedActions: prevState.simulatedActions.map((action) =>
                    action.id === parsedData.actionId
                      ? {
                          ...action,
                          logs: [...(action.logs || []), parsedData.message],
                        }
                      : action
                  ),
                }));
              } else if (eventName === "actionUpdate") {
                console.log(
                  "[FRONTEND SSE EVENT TYPE] actionUpdate - ActionID:",
                  parsedData.action.id,
                  "Data:",
                  parsedData.action
                );
                this.setState((prevState) => ({
                  simulatedActions: prevState.simulatedActions.map((sa) => {
                    if (sa.id === parsedData.action.id) {
                      const currentLogs = sa.logs || [];
                      return {
                        ...sa,
                        ...parsedData.action,
                        logs: parsedData.action.logs || currentLogs,
                        simulationResult: parsedData.action.simulationResult,
                      };
                    }
                    return sa;
                  }),
                }));
              } else if (eventName === "error") {
                const errorDetail = parsedData.detail || parsedData.message;
                console.log(
                  "[FRONTEND SSE EVENT TYPE] error - Detail:",
                  errorDetail
                );
                this.setState((prevState) => ({
                  simulatedActions: prevState.simulatedActions.map((sa) => ({
                    ...sa,
                    simulationResult:
                      sa.simulationResult === "Pending" ||
                      sa.simulationResult === "Simulating..."
                        ? "Failed"
                        : sa.simulationResult,
                    errorMessage: sa.errorMessage || errorDetail,
                    logs: [...(sa.logs || []), `SSE Error: ${errorDetail}`],
                  })),
                  generalSimulationLogs: [
                    ...prevState.generalSimulationLogs,
                    `Critical Error: ${errorDetail}`,
                  ],
                }));
                reader.cancel();
                break;
              } else if (eventName === "simulationComplete") {
                console.log(
                  "[FRONTEND SSE EVENT TYPE] simulationComplete - Message:",
                  parsedData.message
                );
                this.setState((prevState) => ({
                  generalSimulationLogs: [
                    ...prevState.generalSimulationLogs,
                    parsedData.message,
                  ],
                }));
                reader.cancel();
                break;
              }
            } catch (e) {
              console.error(
                "[FRONTEND SSE ERROR] Error parsing JSON or in handler:",
                eventDataString,
                e
              );
            }
            eventEndIndex = buffer.indexOf("\n\n");
          }
        }
      };
      processStream().catch((streamError) => {
        const errorMsg = streamError.message || "Stream processing error.";
        console.error("Stream processing error:", streamError);
        alert(`Error processing simulation stream: ${errorMsg}`);
        this.setState((prevState) => ({
          simulatedActions: prevState.simulatedActions.map((sa) => ({
            ...sa,
            simulationResult: "Failed",
            errorMessage: errorMsg,
            logs: [...(sa.logs || []), `Stream Error: ${errorMsg}`],
          })),
          generalSimulationLogs: [
            ...prevState.generalSimulationLogs.filter(
              (log) => log !== "Connecting to simulation server..."
            ),
            `Stream Error: ${errorMsg}`,
          ],
        }));
      });
    } catch (error: any) {
      const errorMsg = error.message || "Simulation initialization failed.";
      console.error("Initial fetch POST failed:", error);
      alert(`Simulation initialization failed: ${errorMsg}`);
      const errorSimActions = this.state.actions.map((action) => ({
        ...action,
        simulationResult: "Failed" as "Failed",
        errorMessage: errorMsg,
        logs: [...(action.logs || []), `Initialization Error: ${errorMsg}`],
      }));
      this.setState({
        simulatedActions: errorSimActions,
        generalSimulationLogs: [
          ...this.state.generalSimulationLogs.filter(
            (log) => log !== "Connecting to simulation server..."
          ),
          `Initialization Error: ${errorMsg}`,
        ],
      });
    }
  };

  resetToDefaultView = () => {
    this.setState({
      showSelectAction: false,
      showEditAction: false,
      showImpactOverview: false,
      simulationStep: "initial",
      activeTab: "edit",
      isEditMode: false,
      activeEditSection: "",
      showSimulation: false,
    });
  };

  toggleActionLogs = (actionId: string) => {
    this.setState((prevState) => ({
      expandedActionLogs: {
        ...prevState.expandedActionLogs,
        [actionId]: !prevState.expandedActionLogs[actionId],
      },
    }));
  };

  handleActionCardClick = (action: Action) => {
    this.handleEditActionClick(action);
  };

  handleMoveActionUp = (index: number) => {
    if (index === 0) return; // Already at top

    this.setState((prevState) => {
      const newActions = [...prevState.actions];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      return { actions: newActions };
    });
  };

  handleMoveActionDown = (index: number) => {
    if (index === this.state.actions.length - 1) return; // Already at bottom

    this.setState((prevState) => {
      const newActions = [...prevState.actions];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      return { actions: newActions };
    });
  };

  handleSaveLocally = () => {
    const proposalData = {
      title: this.state.title,
      description: this.state.description,
      snapshotUrl: this.state.snapshotUrl,
      discourseUrl: this.state.discourseUrl,
      actions: this.state.actions,
      savedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(proposalData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    // Format: proposal-2025-06-17T02-38-36-622Z.json
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const exportFileDefaultName = `proposal-${timestamp}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const proposalData = JSON.parse(e.target?.result as string);
          this.setState({
            title: proposalData.title || "",
            description: proposalData.description || "",
            snapshotUrl: proposalData.snapshotUrl || "",
            discourseUrl: proposalData.discourseUrl || "",
            actions: proposalData.actions || [],
          });
        } catch (error) {
          alert("Invalid file format");
        }
      };
      reader.readAsText(file);
    }
  };

  handleTransactionSuccess = () => {
    this.setState({ transactionSuccess: true });
  };

  handleSubmitStatusChange = (canSubmit: boolean) => {
    this.setState({ canSubmit });
  };

  handlePublish = async () => {
    const { address, writeContract, createAgendaFees, minimumNoticePeriodSeconds, minimumVotingPeriodSeconds } = this.props;

    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.");
      return;
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.");
      return;
    }

    if (!createAgendaFees) {
      alert("Invalid createAgendaFees. Please reconnect your wallet.");
      return;
    }

    if (!minimumNoticePeriodSeconds || !minimumVotingPeriodSeconds) {
      alert("Contract settings not loaded. Please try again.");
      return;
    }

    if (!TON_CONTRACT_ADDRESS || !DAO_COMMITTEE_PROXY_ADDRESS || !DAO_AGENDA_MANAGER_ADDRESS) {
      alert("Contract addresses not configured. Please check environment variables.");
      return;
    }

    try {
      this.setState({
        txState: "submitting",
        showSuccessModal: true,
        isTransactionPending: true
      });

      // Prepare agenda data using our utility
      const { param } = await prepareAgenda({
        actions: this.state.actions,
        snapshotUrl: this.state.snapshotUrl,
        discourseUrl: this.state.discourseUrl,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
        daoCommitteeProxyAddress: DAO_COMMITTEE_PROXY_ADDRESS,
      });

      // Check TON balance
      const provider = new BrowserProvider(window.ethereum as any);
      const tonContract = new ethers.Contract(
        TON_CONTRACT_ADDRESS,
        TON_ABI,
        provider
      );
      const tonBalanceRaw = await tonContract.balanceOf(address);
      const balanceInTon = Number(ethers.formatUnits(tonBalanceRaw, 18));
      const feeInTon = Number(ethers.formatUnits(createAgendaFees, 18));

      if (balanceInTon < feeInTon) {
        alert(
          `The agenda fee is ${feeInTon} TON, but your wallet TON balance is insufficient. Current TON balance: ${balanceInTon} TON`
        );
        this.setState({
          txState: "idle",
          showSuccessModal: false,
          isTransactionPending: false
        });
        return;
      }

      // Get agenda number before transaction
      console.log("Getting agenda number before transaction...");
      const daoAgendaManager = new ethers.Contract(
        DAO_AGENDA_MANAGER_ADDRESS,
        ["function numAgendas() view returns (uint256)"],
        provider
      );
      const numAgendas = await daoAgendaManager.numAgendas();
      const agendaNumber = numAgendas.toString();
      console.log("Current agenda number:", agendaNumber);
      this.setState({ agendaNumber });

      if (!writeContract) {
        throw new Error("Contract write not ready");
      }

      // Execute transaction
      await writeContract({
        address: TON_CONTRACT_ADDRESS as `0x${string}`,
        abi: TON_ABI,
        functionName: "approveAndCall",
        args: [
          DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`,
          createAgendaFees,
          param,
        ],
      });

      // Transaction submitted successfully
      this.setState({ txState: "pending" });

    } catch (error) {
      console.error("Error publishing proposal:", error);

      if (error && typeof error === "object") {
        if ((error as any).code)
          console.error("Error code:", (error as any).code);
        if ((error as any).message)
          console.error("Error message:", (error as any).message);
        if ((error as any).data)
          console.error("Error data:", (error as any).data);

        if (
          (error as any).message &&
          (error as any).message.includes("User denied transaction signature")
        ) {
          this.setState({
            txState: "idle",
            showSuccessModal: false,
            isTransactionPending: false
          });
          return;
        }
      }

      this.setState({
        txState: "error",
        showSuccessModal: true,
        isTransactionPending: false
      });
    }
  };

  render() {
    const {
      title,
      description,
      snapshotUrl,
      discourseUrl,
      activeTab,
      showSelectAction,
      actions,
      editingAction,
      showEditAction,
      showImpactOverview,
      simulationStep,
      simulatedActions,
      generalSimulationLogs,
      pendingText,
      expandedActionLogs,

    } = this.state;



    const getCurrentStep = () => {
      const isBasicInfoComplete =
        title.trim() !== "" &&
        description.trim() !== "" &&
        snapshotUrl.trim() !== "";

      if (!isBasicInfoComplete) return 1;
      if (actions.length === 0) return 2;
      return 3;
    };

    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-5xl px-4 py-8 transition-all duration-300 mx-auto">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Tabs
                    value={this.state.activeTab}
                    onValueChange={(value) => this.setState({ activeTab: value })}
                    className="w-auto"
                  >
                    <TabsList className="bg-transparent p-0 h-auto">
                      <TabsTrigger
                        value="edit"
                        className={`px-4 py-2 border-b-2 ${
                          this.state.activeTab === "edit"
                            ? "border-gray-900 text-gray-900"
                            : "border-transparent text-gray-500"
                        }`}
                      >
                        <FileEdit className="w-4 h-4 mr-2" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className={cn(
                          "px-4 py-2 border-b-2 relative",
                          this.state.activeTab === "preview"
                            ? "border-gray-900 text-gray-900"
                            : "border-transparent text-gray-500",
                          getCurrentStep() === 3 &&
                            this.state.activeTab !== "preview" &&
                            "animate-pulse"
                        )}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                        {getCurrentStep() === 3 &&
                          this.state.activeTab !== "preview" && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={this.handleLoadFromFile}
                      className="hidden"
                      ref={this.fileInputRef}
                    />
                    <button
                      onClick={() => this.fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      Load from File
                    </button>
                    <button
                      onClick={this.handleSaveLocally}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Locally
                    </button>
                    <button
                      onClick={this.handlePublish}
                      disabled={!this.state.canSubmit}

                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        this.state.canSubmit
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Submit DAO Agenda
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="space-y-4">
                    <ProposalInfoButton
                      title={this.state.title}
                      description={this.state.description}
                      snapshotUrl={this.state.snapshotUrl}
                      discourseUrl={this.state.discourseUrl}
                      onClick={this.resetToDefaultView}
                      buttonText="Proposal text"
                    />
                    {this.state.actions.map((action, index) => (
                      <div
                        key={action.id}
                        className="border rounded-md border-gray-200 hover:bg-gray-100 transition-colors duration-150 overflow-hidden"
                      >
                        <div className="flex items-center">
                          <div className="flex flex-col gap-0 px-1 py-1 border-r border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleMoveActionUp(index);
                              }}
                              disabled={index === 0}
                              className={`p-0.5 rounded transition-colors ${
                                index === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Move up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleMoveActionDown(index);
                              }}
                              disabled={index === this.state.actions.length - 1}
                              className={`p-0.5 rounded transition-colors ${
                                index === this.state.actions.length - 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Move down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          <div
                            className="flex-1 p-4 cursor-pointer min-w-0"
                            onClick={() => this.handleActionCardClick(action)}
                          >
                            <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                              <Code className="w-4 h-4 mr-2 text-gray-400" />
                              Action #{index + 1}
                            </div>
                            <div className="text-xs text-gray-500 truncate overflow-hidden">
                              {action.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <ProposalAddActionButton onClick={this.handleAddActionClick} />
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={this.handleImpactOverviewClick}
                      disabled={this.state.actions.length === 0}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Impact overview
                    </Button>
                  </div>

                  <div className="lg:col-span-4">
                    {this.state.activeTab === "preview" ? (
                      <ProposalPreview
                        title={this.state.title}
                        description={this.state.description}
                        snapshotUrl={this.state.snapshotUrl}
                        discourseUrl={this.state.discourseUrl}
                        actions={this.state.actions}
                        onModeChange={(mode, section) => {
                          this.setState({
                            activeTab: mode,
                            currentSection: section || "actions",
                          });
                        }}
                        onActionSelect={(actionId) => {
                          const action = this.state.actions.find(
                            (a) => a.id === actionId
                          );
                          if (action) {
                            this.handleActionCardClick(action);
                          }
                        }}
                        selectedActionId={this.state.selectedActionId}
                        onEditButtonActivate={(section) => {
                          this.setState({ activeEditSection: section });
                        }}
                        isEditMode={this.state.isEditMode}
                        onImpactOverviewClick={this.handleImpactOverviewClick}
                        showSimulation={this.state.showSimulation}
                        onTransactionSuccess={this.handleTransactionSuccess}
                        onSubmitStatusChange={this.handleSubmitStatusChange}
                      />
                    ) : this.state.showImpactOverview ? (
                      <ProposalImpactOverview
                        simulationStep={this.state.simulationStep}
                        generalSimulationLogs={this.state.generalSimulationLogs}
                        simulatedActions={this.state.simulatedActions}
                        pendingText={this.state.pendingText}
                        expandedActionLogs={this.state.expandedActionLogs}
                        onSimulateExecution={this.handleSimulateExecutionClick}
                        onToggleActionLogs={this.toggleActionLogs}
                      />
                    ) : this.state.showEditAction && this.state.editingAction ? (
                      <ProposalEditAction
                        actionToEdit={this.state.editingAction}
                        onSaveChanges={this.handleSaveChanges}
                        onCancel={this.handleCancelEdit}
                        onRemoveAction={this.handleRemoveAction}
                        actionNumber={
                          this.state.actions.findIndex(
                            (a) => a.id === this.state.editingAction?.id
                          ) + 1
                        }
                      />
                    ) : this.state.showSelectAction ? (
                      <ProposalSelectAction onAddAction={this.handleAddAction} />
                    ) : (
                      <ProposalAddInfo
                        title={this.state.title}
                        description={this.state.description}
                        snapshotUrl={this.state.snapshotUrl}
                        discourseUrl={this.state.discourseUrl}
                        setTitle={(title: string) => this.setState({ title })}
                        setDescription={(description: string) =>
                          this.setState({ description })
                        }
                        setSnapshotUrl={(snapshotUrl: string) =>
                          this.setState({ snapshotUrl })
                        }
                        setDiscourseUrl={(discourseUrl: string) =>
                          this.setState({ discourseUrl })
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={this.state.showSuccessModal}
          onClose={() => this.setState({
            showSuccessModal: false,
            txState: "idle",
            isTransactionPending: false
          })}
          status={this.state.txState === "pending" ? "pending" :
                 this.state.txState === "submitting" ? "submitting" :
                 this.state.txState === "success" ? "confirmed" :
                 this.state.txState === "error" ? "error" : "submitting"}
          txHash={this.props.writeData}
          agendaNumber={this.state.agendaNumber}
          onSaveLocally={() => {
            // TODO: Implement save locally with signature
            console.log("Save locally clicked");
          }}
        />

      </div>
    );
  }
}