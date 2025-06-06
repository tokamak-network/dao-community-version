"use client";

import React, { Component, useState } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  Eye,
  EyeOff,
  FileEdit,
  Home,
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Redo,
  Send,
  Table,
  Underline,
  Undo,
  Import,
  BarChart2,
  ExternalLink,
  Loader2,
  ChevronUp,
  Save,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalInfoButton } from "@/components/ui/proposal-info-button";
import { ProposalAddActionButton } from "@/components/ui/proposal-add-action-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProposalAddInfo } from "@/components/ui/proposal-add-info";
import { ProposalSelectAction } from "@/components/ui/proposal-select-action";
import { ProposalEditAction } from "@/components/ui/proposal-edit-action";
import { cn } from "@/lib/utils";
import { ProposalPreview } from "@/components/ui/proposal-preview";
import { useRouter } from "next/navigation";
import { ProposalImpactOverview } from "@/components/ui/proposal-impact-overview";
import { ProposalGuide } from "@/components/ui/proposal-guide";
import { ProposalTips } from "@/components/ui/proposal-tips";

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
  isValidIBaseInput: boolean;
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
  activeSidebar: "guide" | "tips" | null;
  transactionSuccess: boolean;
}

const styles = `
@keyframes eye-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

export default class ProposalForm extends Component<{}, ProposalFormState> {
  private pendingAnimationInterval: NodeJS.Timeout | null = null;
  private router: any;
  private fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: {}) {
    super(props);
    this.state = {
      title: "",
      isValidIBaseInput: false,
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
      activeSidebar: "guide",
      transactionSuccess: false,
    };
    this.handleValidBaseInput = this.handleValidBaseInput.bind(this);
    this.handleAddActionClick = this.handleAddActionClick.bind(this);
    this.handleAddAction = this.handleAddAction.bind(this);
    this.handleEditActionClick = this.handleEditActionClick.bind(this);
    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleRemoveAction = this.handleRemoveAction.bind(this);
    this.handleImpactOverviewClick = this.handleImpactOverviewClick.bind(this);
    this.handleSimulateExecutionClick =
      this.handleSimulateExecutionClick.bind(this);
    this.resetToDefaultView = this.resetToDefaultView.bind(this);
    this.toggleActionLogs = this.toggleActionLogs.bind(this);
    this.handleActionCardClick = this.handleActionCardClick.bind(this);
    this.handleSaveLocally = this.handleSaveLocally.bind(this);
    this.handleLoadFromFile = this.handleLoadFromFile.bind(this);
    this.handleTransactionSuccess = this.handleTransactionSuccess.bind(this);
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

  handleValidBaseInput() {
    this.setState((prevState) => ({
      isValidIBaseInput: !prevState.isValidIBaseInput,
    }));
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

    console.log("Adding new action:", newAction);
    this.setState((prevState) => ({
      actions: [...prevState.actions, newAction],
      showSelectAction: false,
      showEditAction: false,
      editingAction: null,
      showImpactOverview: false,
      simulationStep: "initial",
    }));
  };

  handleEditActionClick(actionToEdit: Action) {
    this.setState({
      editingAction: actionToEdit,
      showSelectAction: false,
      showEditAction: true,
    });
  }

  handleSaveChanges(updatedAction: Action) {
    this.setState((prevState) => ({
      actions: prevState.actions.map((action) =>
        action.id === updatedAction.id ? updatedAction : action
      ),
      editingAction: updatedAction,
      showEditAction: true,
    }));
  }

  handleCancelEdit() {
    this.setState({
      editingAction: null,
      showEditAction: false,
    });
  }

  handleRemoveAction(actionId: string) {
    this.setState((prevState) => ({
      actions: prevState.actions.filter((action) => action.id !== actionId),
      editingAction: null,
      showEditAction: false,
      showSelectAction: false,
    }));
  }

  handleImpactOverviewClick = () => {
    const { title, description, actions } = this.state;

    if (!title.trim() || !description.trim()) {
      alert(
        "Please enter the Proposal Title and Description before viewing the impact overview."
      );
      return;
    }

    if (actions.length === 0) {
      alert(
        "No actions to create an overview for. Please add at least one action."
      );
      return;
    }

    this.setState({
      showImpactOverview: true,
      simulationStep: "initial",
      showSelectAction: false,
      showEditAction: false,
      editingAction: null,
      isEditMode: true,
      activeEditSection: "impact",
      showSimulation: true,
      activeTab: "edit",
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
      editingAction: null,
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
    this.setState({
      editingAction: action,
      showSelectAction: false,
      showEditAction: true,
      showImpactOverview: false,
      simulationStep: "initial",
      activeTab: "edit",
      isEditMode: false,
      activeEditSection: "",
      showSimulation: false,
    });
  };

  handleSaveLocally = () => {
    const proposalData = {
      title: this.state.title,
      description: this.state.description,
      snapshotUrl: this.state.snapshotUrl,
      discourseUrl: this.state.discourseUrl,
      actions: this.state.actions,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(proposalData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const proposalData = JSON.parse(e.target?.result as string);
        const { title, description, snapshotUrl, discourseUrl, actions } =
          proposalData;

        // Check if basic info is complete
        const isBasicInfoComplete =
          title?.trim() !== "" &&
          description?.trim() !== "" &&
          snapshotUrl?.trim() !== "";

        // Reset all states first
        this.setState(
          {
            title: "",
            description: "",
            snapshotUrl: "",
            discourseUrl: "",
            actions: [],
            isValidIBaseInput: false,
            showSelectAction: false,
            showEditAction: false,
            editingAction: null,
            showImpactOverview: false,
            simulationStep: "initial",
            activeTab: "edit",
            isEditMode: false,
            activeEditSection: "",
            showSimulation: false,
          },
          () => {
            // Then set the loaded data
            this.setState({
              title: title || "",
              description: description || "",
              snapshotUrl: snapshotUrl || "",
              discourseUrl: discourseUrl || "",
              actions: actions || [],
              isValidIBaseInput: isBasicInfoComplete,
            });
          }
        );
      } catch (error) {
        console.error("Error loading proposal file:", error);
        alert(
          "Error loading proposal file. Please make sure it's a valid proposal JSON file."
        );
      }
    };
    reader.readAsText(file);
  };

  handleTransactionSuccess = () => {
    this.setState({
      transactionSuccess: true,
    });
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
      showSimulation,
      isEditMode,
      activeEditSection,
      selectedActionId,
      currentSection,
      activeSidebar,
    } = this.state;

    const guideSteps = [
      {
        number: 1,
        title: "Basic Information",
        description: "Enter the basic details of your proposal",
        tips: [
          "Title and Description are required fields",
          "Snapshot URL is required (can be Snapshot voting link, official announcement, etc.)",
          "Discourse URL is optional (forum discussion, additional documentation)",
          "v2.0.0 contracts store reference URLs on-chain for transparency",
        ],
      },
      {
        number: 2,
        title: "Actions",
        description:
          "Define the actions that will be executed if your proposal is approved",
        tips: [
          "Add one or more actions that your proposal will execute",
          "Ensure all contract addresses and methods are correct",
          "Use the simulation feature to test your actions",
        ],
      },
      {
        number: 3,
        title: "Preview & Submit",
        description:
          "Switch to the Preview tab to review your proposal and submit it to the DAO",
        tips: [
          "Double-check all information and actions in the preview",
          "Review the impact overview",
          "Make sure all required fields are filled",
          "After submission, save the proposal metadata locally using the 'Save Locally' button",
          "Keep the saved metadata file for future reference and tracking",
        ],
      },
      {
        number: 4,
        title: "PR Submission",
        description:
          "After successful transaction, submit a PR to register your proposal",
        tips: [
          "Click the PR submission button that appears after successful transaction",
          "This will register your proposal in the metadata repository",
          "Once the PR is merged, your proposal will be publicly available",
          "If your proposal details don't appear in the front service after PR merge, use the refresh button in the detail view to update the data",
          "Save your proposal metadata locally using the 'Save Locally' button for future reference",
        ],
      },
    ];

    const getCurrentStep = () => {
      // Check if all required fields in Basic Information are filled
      const isBasicInfoComplete =
        title.trim() !== "" &&
        description.trim() !== "" &&
        snapshotUrl.trim() !== "";

      if (!isBasicInfoComplete) return 1;
      if (actions.length === 0) return 2;
      if (this.state.transactionSuccess) return 4;
      return 3;
    };

    return (
      <>
        <style>{styles}</style>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  "w-full max-w-7xl px-4 py-8 transition-all duration-300 mx-auto"
                )}
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Create New Proposal
                    </h1>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={this.handleSaveLocally}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Locally
                      </button>
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
                    </div>
                  </div>
                  <Tabs
                    value={this.state.activeTab}
                    onValueChange={(value) =>
                      this.setState({ activeTab: value })
                    }
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
                        {getCurrentStep() === 3 &&
                        this.state.activeTab !== "preview" ? (
                          <div className="relative w-4 h-4 mr-2">
                            <Eye className="w-4 h-4 absolute animate-[bounce_1s_ease-in-out_infinite]" />
                          </div>
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Proposal Preview
                        {getCurrentStep() === 3 &&
                          this.state.activeTab !== "preview" && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="space-y-4">
                      <ProposalInfoButton
                        title={this.state.title}
                        description={this.state.description}
                        snapshotUrl={this.state.snapshotUrl}
                        discourseUrl={this.state.discourseUrl}
                        onClick={this.resetToDefaultView}
                        buttonText="Basic Information"
                      />
                      {this.state.actions.map((action, index) => (
                        <div
                          key={action.id}
                          className="border rounded-md p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-150 border-gray-200"
                          onClick={() => this.handleActionCardClick(action)}
                        >
                          <div className="font-medium truncate text-gray-900">
                            Action #{index + 1}. {action.title}
                          </div>
                          <div
                            className="text-sm mt-1 truncate text-gray-500"
                            title={action.method}
                          >
                            {action.method.length > 30
                              ? `${action.method.substring(0, 27)}...`
                              : action.method}
                          </div>
                        </div>
                      ))}
                      <ProposalAddActionButton
                        onClick={this.handleAddActionClick}
                      />
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={this.handleImpactOverviewClick}
                        disabled={this.state.actions.length === 0}
                      >
                        <BarChart2 className="mr-2 h-4 w-4" />
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
                        />
                      ) : this.state.showImpactOverview ? (
                        <ProposalImpactOverview
                          simulationStep={this.state.simulationStep}
                          generalSimulationLogs={
                            this.state.generalSimulationLogs
                          }
                          simulatedActions={this.state.simulatedActions}
                          pendingText={this.state.pendingText}
                          expandedActionLogs={this.state.expandedActionLogs}
                          onSimulateExecution={
                            this.handleSimulateExecutionClick
                          }
                          onToggleActionLogs={this.toggleActionLogs}
                        />
                      ) : this.state.showEditAction &&
                        this.state.editingAction ? (
                        <div>
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
                        </div>
                      ) : this.state.showSelectAction ? (
                        <ProposalSelectAction
                          onAddAction={this.handleAddAction}
                        />
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
          <div className="flex-1 flex flex-col items-center">
            <ProposalGuide
              currentStep={getCurrentStep()}
              steps={guideSteps}
              isVisible={activeSidebar === "guide"}
              onToggle={() =>
                this.setState({
                  activeSidebar: activeSidebar === "guide" ? null : "guide",
                })
              }
            />
            <ProposalTips
              currentStep={getCurrentStep()}
              isVisible={activeSidebar === "tips"}
              onToggle={() =>
                this.setState({
                  activeSidebar: activeSidebar === "tips" ? null : "tips",
                })
              }
            />
          </div>
        </div>
      </>
    );
  }
}
