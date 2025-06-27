"use client";

import React, { Component } from "react";
import {
  FileEdit,
  Eye,
  Save,
  FileUp,
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
  pendingText: string;
  expandedActionLogs: { [actionId: string]: boolean };
  showSimulation: boolean;
  isEditMode: boolean;
  activeEditSection: string;
  selectedActionId: string | null;
  currentSection: string;

  transactionSuccess: boolean;
}

export default class ProposalForm extends Component<{}, ProposalFormState> {
  private fileInputRef = React.createRef<HTMLInputElement>();

  constructor(props: {}) {
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
      pendingText: "Pending...",
      expandedActionLogs: {},
      showSimulation: false,
      isEditMode: false,
      activeEditSection: "",
      selectedActionId: null,
      currentSection: "actions",
      transactionSuccess: false,
    };
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
    this.setState({
      simulationStep: "results",
      generalSimulationLogs: ["Starting simulation...", "Analyzing actions..."],
      simulatedActions: this.state.actions.map(action => ({
        ...action,
        simulationResult: "Simulating..." as const,
      })),
    });

    // Simulate some delay
    setTimeout(() => {
      this.setState((prevState) => ({
        simulatedActions: prevState.simulatedActions.map(action => ({
          ...action,
          simulationResult: "Passed" as const,
          gasUsed: Math.floor(Math.random() * 100000 + 50000).toString(),
        })),
        generalSimulationLogs: [
          ...prevState.generalSimulationLogs,
          "Simulation completed successfully",
        ],
      }));
    }, 2000);
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

    const exportFileDefaultName = `proposal-${Date.now()}.json`;

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
            <div className="w-full max-w-7xl px-4 py-8 transition-all duration-300 mx-auto">
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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


      </div>
    );
  }
}