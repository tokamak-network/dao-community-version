"use client";

import { Component, useState } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  Eye,
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
  Upload,
  BarChart2,
  ExternalLink,
  Loader2,
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

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
  simulationResult?: "Passed" | "Failed" | "Simulating...";
  tenderlyUrl?: string;
  type?: string;
  gasUsed?: string;
  errorMessage?: string;
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
}

export default class ProposalForm extends Component<{}, ProposalFormState> {
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
    };
    this.handleValidBaseInput = this.handleValidBaseInput.bind(this);
    this.handleAddAction = this.handleAddAction.bind(this);
    this.handleEditActionClick = this.handleEditActionClick.bind(this);
    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleRemoveAction = this.handleRemoveAction.bind(this);
    this.handleImpactOverviewClick = this.handleImpactOverviewClick.bind(this);
    this.handleSimulateExecutionClick =
      this.handleSimulateExecutionClick.bind(this);
    this.resetToDefaultView = this.resetToDefaultView.bind(this);
  }

  componentDidMount() {
    // DOM에 랜더링 된 후, 실행
  }

  componentWillUnmount() {}

  handleValidBaseInput() {
    this.setState((prevState) => ({
      isValidIBaseInput: !prevState.isValidIBaseInput,
    }));
  }

  handleAddAction(newActionData: Omit<Action, "id">) {
    const newAction: Action = {
      ...newActionData,
      id: Date.now().toString(),
      type: "Custom",
    };

    console.log("handleAddAction", newAction);
    this.setState((prevState) => ({
      actions: [...prevState.actions, newAction],
      showSelectAction: false,
      showEditAction: false,
      editingAction: null,
      showImpactOverview: false,
      simulationStep: "initial",
    }));
  }

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

    // Proposal Info 유효성 검사
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
    });
  };

  handleSimulateExecutionClick = async () => {
    const initialSimActions = this.state.actions.map((action) => ({
      ...action,
      simulationResult: "Simulating..." as "Simulating...",
      gasUsed: "",
      errorMessage: "",
    }));

    this.setState({
      simulationStep: "results",
      simulatedActions: initialSimActions,
    });

    console.log("Simulate execution button clicked. Sending request to API...");

    const daoAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;
    const forkRpc = process.env.NEXT_PUBLIC_RPC_URL;
    const localRpc = process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL;

    if (!daoAddress || !forkRpc || !localRpc) {
      alert(
        "Required environment variables are not set. Please check your .env.local file (NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_DAO_CONTRACT_ADDRESS, NEXT_PUBLIC_LOCALHOST_RPC_URL)."
      );
      this.setState({ simulationStep: "initial", simulatedActions: [] });
      return;
    }

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actions: this.state.actions,
          daoContractAddress: daoAddress,
          forkRpcUrl: forkRpc,
          localRpcUrl: localRpc,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const failedSimActions = this.state.actions.map((action) => ({
          ...action,
          simulationResult: "Failed" as "Failed",
          errorMessage:
            errorData.message ||
            `API request failed with status ${response.status}`,
        }));
        this.setState({ simulatedActions: failedSimActions });
        throw new Error(
          errorData.message ||
            `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      this.setState({
        simulatedActions: data.simulatedActions || [],
      });
    } catch (error: any) {
      console.error("Simulation request failed:", error);
      alert(`Simulation failed: ${error.message}`);
      const errorSimActions = this.state.actions.map((action) => ({
        ...action,
        simulationResult: "Failed" as "Failed",
        errorMessage: error.message || "Simulation process failed.",
      }));
      this.setState({ simulatedActions: errorSimActions }); // Ensure simulationStep remains 'results' to show errors
    }
  };

  resetToDefaultView = () => {
    this.setState({
      showSelectAction: false,
      showEditAction: false,
      editingAction: null,
      showImpactOverview: false,
      simulationStep: "initial",
    });
  };

  render() {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex justify-between mb-6">
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
                  className={`px-4 py-2 border-b-2 ${
                    this.state.activeTab === "preview"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-sm rounded-md"
              >
                Save draft
              </Button>
              <Button
                size="sm"
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md"
              >
                Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="space-y-4">
              <ProposalInfoButton
                title={this.state.title}
                description={this.state.description}
                snapshotUrl={this.state.snapshotUrl}
                discourseUrl={this.state.discourseUrl}
                onClick={this.resetToDefaultView}
              />
              {this.state.actions.map((action, index) => {
                const isSelected = this.state.editingAction?.id === action.id;
                return (
                  <div
                    key={action.id}
                    className={`border rounded-md p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-150 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-300 ring-offset-1"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      this.setState({
                        editingAction: action,
                        showSelectAction: false,
                        showEditAction: true,
                        showImpactOverview: false,
                        simulationStep: "initial",
                      });
                    }}
                  >
                    <div
                      className={`font-medium truncate ${
                        isSelected ? "text-purple-700" : "text-gray-900"
                      }`}
                    >
                      Action #{index + 1}. {action.title}
                    </div>
                    <div
                      className={`text-sm mt-1 truncate ${
                        isSelected ? "text-purple-600" : "text-gray-500"
                      }`}
                      title={action.method}
                    >
                      {action.method.length > 30
                        ? `${action.method.substring(0, 27)}...`
                        : action.method}
                    </div>
                  </div>
                );
              })}
              <ProposalAddActionButton
                onClick={() =>
                  this.setState({
                    showSelectAction: true,
                    showEditAction: false,
                    editingAction: null,
                    showImpactOverview: false,
                    simulationStep: "initial",
                  })
                }
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

            {/* Main content */}
            <div className="md:col-span-2">
              {this.state.showImpactOverview ? (
                this.state.simulationStep === "initial" ? (
                  <div className="flex-1 border rounded-md p-6">
                    <div className="flex flex-col items-start">
                      <p className="text-base mb-4">
                        Run simulations to see results
                      </p>
                      <Button
                        variant="secondary"
                        className="bg-slate-100 hover:bg-slate-200 text-sm"
                        onClick={this.handleSimulateExecutionClick}
                      >
                        Simulate execution
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-6">
                    <div className="max-w-4xl">
                      <h1 className="text-xl font-semibold mb-1">
                        Simulations
                      </h1>
                      <p className="text-gray-500 mb-4">
                        Detailed simulation results per proposal action provided
                        by Tenderly
                      </p>
                      <div className="border rounded-md overflow-hidden mb-6">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                Action #
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                Title
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                Simulation
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                Gas Used
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                Error
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {this.state.simulatedActions.map(
                              (action, index) => (
                                <tr className="border-b" key={action.id}>
                                  <td className="px-4 py-3 text-sm">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {action.title}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center">
                                      {action.simulationResult ===
                                      "Simulating..." ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" />
                                          <span className="text-gray-500">
                                            Simulating...
                                          </span>
                                        </>
                                      ) : action.simulationResult ===
                                        "Passed" ? (
                                        <>
                                          <div className="w-2 h-2 rounded-full mr-2 bg-emerald-400"></div>
                                          <span className="text-emerald-500">
                                            Passed
                                          </span>
                                        </>
                                      ) : action.simulationResult ===
                                        "Failed" ? (
                                        <>
                                          <div className="w-2 h-2 rounded-full mr-2 bg-red-400"></div>
                                          <span className="text-red-500">
                                            Failed
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-gray-500">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-mono">
                                    {action.gasUsed || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-red-500">
                                    {action.errorMessage || "-"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                      <h2 className="text-xl font-semibold mb-1">
                        Threat analysis
                      </h2>
                      <p className="text-gray-500 mb-4">
                        A full risk analysis model of the proposal actions +
                        risk severity
                      </p>
                      <div className="border rounded-md p-4">
                        <p className="text-gray-500">Unavailable</p>
                      </div>
                    </div>
                  </div>
                )
              ) : this.state.showEditAction && this.state.editingAction ? (
                <ProposalEditAction
                  actionToEdit={this.state.editingAction}
                  onSaveChanges={this.handleSaveChanges}
                  onCancel={this.handleCancelEdit}
                  onRemoveAction={this.handleRemoveAction}
                />
              ) : this.state.showSelectAction ? (
                <ProposalSelectAction onAddAction={this.handleAddAction} />
              ) : (
                <ProposalAddInfo
                  title={this.state.title}
                  setTitle={(title) => this.setState({ title })}
                  description={this.state.description}
                  setDescription={(description) =>
                    this.setState({ description })
                  }
                  snapshotUrl={this.state.snapshotUrl}
                  setSnapshotUrl={(snapshotUrl) =>
                    this.setState({ snapshotUrl })
                  }
                  discourseUrl={this.state.discourseUrl}
                  setDiscourseUrl={(discourseUrl) =>
                    this.setState({ discourseUrl })
                  }
                />
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
}
