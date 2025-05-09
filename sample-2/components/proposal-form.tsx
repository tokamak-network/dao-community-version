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

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
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
    };
    this.handleValidBaseInput = this.handleValidBaseInput.bind(this);
    this.handleAddAction = this.handleAddAction.bind(this);
    this.handleEditActionClick = this.handleEditActionClick.bind(this);
    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
    this.handleRemoveAction = this.handleRemoveAction.bind(this);
    this.handleImpactOverviewClick = this.handleImpactOverviewClick.bind(this);
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
    };

    console.log("handleAddAction", newAction);
    this.setState((prevState) => ({
      actions: [...prevState.actions, newAction],
      showSelectAction: false,
      showEditAction: false,
      editingAction: null,
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
    if (this.state.actions.length === 0) {
      alert("No actions to create an overview for.");
      return;
    }
    console.log("Impact overview button clicked. Actions:", this.state.actions);
    // TODO: Set state to show ImpactOverviewDisplay component
    // 예: this.setState({ showImpactOverview: true, showSelectAction: false, showEditAction: false, editingAction: null });
    alert("Impact overview MOCKUP (actual simulation to be implemented)");
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
                onClick={() =>
                  this.setState({
                    showSelectAction: false,
                    showEditAction: false,
                    editingAction: null,
                  })
                }
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
                    onClick={() => this.handleEditActionClick(action)}
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
              {this.state.showEditAction && this.state.editingAction ? (
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
