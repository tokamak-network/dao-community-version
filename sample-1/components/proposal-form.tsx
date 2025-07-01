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
import { AgendaSubmissionModal, AgendaSubmissionStatus } from "@/components/modals/AgendaSubmissionModal";
import { prepareAgenda } from "@/utils/agendaData";
import { TON_ABI } from "@/utils/tonContract";
import { createAgendaSignatureMessage, signMessage } from "@/lib/signature";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

interface ProposalFormProps {
  address?: `0x${string}`;
  isConnected?: boolean;
  writeContract?: any;
  writeData?: `0x${string}`;
  writeError?: any;
  isPending?: boolean;
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
  showSimulation: boolean;
  isEditMode: boolean;
  activeEditSection: string;
  selectedActionId: string | null;
  currentSection: string;

  transactionSuccess: boolean;
  canSubmit: boolean;

  // Transaction status management
  txState: "idle" | "preparing" | "approving" | "pending" | "confirmed" | "error" | "cancelled";
  showSuccessModal: boolean;
  isTransactionPending: boolean;
  agendaNumber: string;
}

export default class ProposalForm extends Component<ProposalFormProps, ProposalFormState> {
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
    // No simulation-related code needed anymore
  }

  componentWillUnmount() {
    // No simulation-related cleanup needed anymore
  }

  componentDidUpdate(prevProps: ProposalFormProps) {
    // wagmi writeError 감지
    if (this.props.writeError && this.props.writeError !== prevProps.writeError) {
      console.log("=== Wagmi Write Error Detected ===");
      console.log("Error:", this.props.writeError);

      // 사용자 취소 에러 확인
      const errorMessage = this.props.writeError.message || "";
      const errorCode = this.props.writeError.code;

      if (
        errorCode === 4001 ||
        errorMessage.includes("User denied transaction signature") ||
        errorMessage.includes("User rejected the request") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("user rejected transaction") ||
        errorMessage.includes("User denied")
      ) {
        console.log("User cancelled transaction via wagmi");
        // 사용자가 취소했다는 것을 잠깐 보여주고 모달 닫기
        this.setState({
          txState: "cancelled",
          showSuccessModal: true,
          isTransactionPending: false
        });

        // 2초 후 모달 자동 닫기
        setTimeout(() => {
          this.setState({
            txState: "idle",
            showSuccessModal: false,
            isTransactionPending: false
          });
        }, 2000);
      } else {
        // 다른 에러
        this.setState({
          txState: "error",
          showSuccessModal: true,
          isTransactionPending: false
        });
      }
    }

            // 트랜잭션 성공 감지
    if (this.props.writeData && this.props.writeData !== prevProps.writeData) {
      console.log("Transaction successful:", this.props.writeData);
      this.setState({
        txState: "confirmed",
        showSuccessModal: true,
        isTransactionPending: false
      });
    }
  }

  handleAddActionClick = () => {
    this.setState({
      showSelectAction: true,
      showEditAction: false,
      showImpactOverview: false,
      // simulationStep: "initial", // Moved to ProposalImpactOverview
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

  resetToDefaultView = () => {
    this.setState({
      showSelectAction: false,
      showEditAction: false,
      showImpactOverview: false,
      activeTab: "edit",
      isEditMode: false,
      activeEditSection: "",
      showSimulation: false,
    });
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

  // Network switching utility
  switchNetwork = async (chainId: number) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const hexChainId = `0x${chainId.toString(16)}`;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network to MetaMask
          const networkConfig = this.getNetworkConfig(chainId);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  // Get network configuration for adding to wallet
  getNetworkConfig = (chainId: number) => {
    switch (chainId) {
      case 1:
        return {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://ethereum.publicnode.com'],
          blockExplorerUrls: ['https://etherscan.io'],
        };
      case 11155111:
        return {
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        };
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  };

  handleSubmitPR = async (): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      console.log("🚀 Submitting PR to repository...");

      // Generate complete agenda metadata for PR submission
      const { address } = this.props;
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Generate signature and metadata (reuse from onSaveLocally logic)
      const signatureTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ".00Z");
      const signatureMessage = createAgendaSignatureMessage(
        this.state.agendaNumber,
        this.props.writeData || "",
        signatureTimestamp
      );

      const signature = await signMessage(signatureMessage, address);

      const agendaData = {
        id: Number(this.state.agendaNumber),
        title: this.state.title,
        description: this.state.description,
        network: process.env.NEXT_PUBLIC_CHAIN_ID === "1" ? "mainnet" : "sepolia",
        transaction: this.props.writeData || "",
        creator: {
          address: address,
          signature: signature
        },
        actions: this.state.actions.map(action => ({
          title: action.title,
          contractAddress: action.contractAddress,
          method: action.method,
          calldata: action.calldata,
          abi: action.abi,
          sendEth: action.sendEth
        })),
        createdAt: signatureTimestamp,
        snapshotUrl: this.state.snapshotUrl,
        discourseUrl: this.state.discourseUrl
      };

      // 먼저 로컬에 다운로드
      console.log("💾 Downloading metadata locally before PR submission...");
      const downloadTimestamp = new Date().toISOString().replace(/:/g, '-');
      const blob = new Blob([JSON.stringify(agendaData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda-${agendaData.id}-${downloadTimestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("✅ Metadata downloaded locally");

      // 잠시 대기 (다운로드 완료 보장)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 그 다음 PR 제출
      console.log("🚀 Now submitting PR to GitHub...");

      // Submit PR to API
      const response = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agendaData,
          message: `Agenda submission for ${agendaData.network} network - ${agendaData.title}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit PR');
      }

      const result = await response.json();
      console.log("✅ PR submission successful:", result.prUrl);

      return {
        success: true,
        url: result.prUrl
      };
    } catch (error) {
      console.error("❌ PR submission failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
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
      // Step 1: Network validation first (before showing modal)
      console.log("🌐 Step 1: Checking network connection...");
      console.log("🔍 TON_CONTRACT_ADDRESS:", TON_CONTRACT_ADDRESS);
      console.log("🔍 User Address:", address);
      console.log("🔍 Network Chain ID:", process.env.NEXT_PUBLIC_CHAIN_ID);

      const provider = new BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();
      console.log("🔍 Connected Network:", network.chainId, network.name);

      // Check network mismatch and switch if needed
      const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
      if (Number(network.chainId) !== expectedChainId) {
        console.log("🔄 Network mismatch detected. Switching network...");
        try {
          await this.switchNetwork(expectedChainId);
          // After switching, get the updated network info
          const updatedNetwork = await provider.getNetwork();
          console.log("✅ Network switched to:", updatedNetwork.chainId, updatedNetwork.name);
        } catch (switchError) {
          console.error("❌ Failed to switch network:", switchError);
          const networkName = expectedChainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet";
          alert(`Please switch your wallet to ${networkName} (Chain ID: ${expectedChainId}) and try again.`);
          return;
        }
      }

      // Step 2: Show modal after network is confirmed
      console.log("✅ Network validation complete. Showing modal...");
      this.setState({
        txState: "preparing",
        showSuccessModal: true,
        isTransactionPending: true
      });

      // Step 3: Prepare agenda data
      const { param } = await prepareAgenda({
        actions: this.state.actions,
        snapshotUrl: this.state.snapshotUrl,
        discourseUrl: this.state.discourseUrl,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
        daoCommitteeProxyAddress: DAO_COMMITTEE_PROXY_ADDRESS,
      });

      // Step 4: Check TON balance
      console.log("💰 Step 4: Checking TON balance...");

      // Verify TON contract exists
      console.log("🔍 Checking if TON contract exists...");
      const code = await provider.getCode(TON_CONTRACT_ADDRESS);
      console.log("🔍 Contract code length:", code.length, "Code:", code.slice(0, 20) + "...");

      if (code === "0x") {
        const errorMsg = `TON contract not found at address: ${TON_CONTRACT_ADDRESS} on network ${network.chainId}`;
        console.error("❌", errorMsg);
        alert(errorMsg);
        this.setState({
          txState: "error",
          showSuccessModal: true,
          isTransactionPending: false
        });
        return;
      }

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
      console.error("=== Transaction Error Details ===");
      console.error("Full error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);

      if (error && typeof error === "object") {
        console.error("Error code:", (error as any).code);
        console.error("Error message:", (error as any).message);
        console.error("Error data:", (error as any).data);
        console.error("Error cause:", (error as any).cause);
        console.error("Error details:", (error as any).details);

        // Log all properties of the error object
        console.error("All error properties:", Object.keys(error));
        console.error("Error JSON:", JSON.stringify(error, null, 2));

        // Check for user cancellation/rejection
        const errorMessage = (error as any).message || "";
        const errorCode = (error as any).code;

        if (
          errorCode === 4001 || // MetaMask user rejection code
          errorMessage.includes("User denied transaction signature") ||
          errorMessage.includes("User rejected the request") ||
          errorMessage.includes("User cancelled") ||
          errorMessage.includes("user rejected transaction") ||
          errorMessage.includes("User denied")
        ) {
          console.log("User cancelled transaction");
          // 사용자가 취소했다는 것을 잠깐 보여주고 모달 닫기
          this.setState({
            txState: "cancelled",
            showSuccessModal: true,
            isTransactionPending: false
          });

          // 2초 후 모달 자동 닫기
          setTimeout(() => {
            this.setState({
              txState: "idle",
              showSuccessModal: false,
              isTransactionPending: false
            });
          }, 2000);
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
      showSimulation,
      isEditMode,
      activeEditSection,
      selectedActionId,
      currentSection,
      transactionSuccess,
      canSubmit,
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
                        actions={this.state.actions}
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

        {/* Agenda Submission Modal */}
        <AgendaSubmissionModal
          isOpen={this.state.showSuccessModal}
          onClose={() => this.setState({
            showSuccessModal: false,
            txState: "idle",
            isTransactionPending: false
          })}
          status={this.state.txState === "pending" ? "pending" :
                 this.state.txState === "preparing" ? "preparing" :
                 this.state.txState === "approving" ? "approving" :
                 this.state.txState === "confirmed" ? "confirmed" :
                 this.state.txState === "error" ? "error" :
                 this.state.txState === "cancelled" ? "cancelled" : "preparing"}
          txHash={this.props.writeData}
          agendaNumber={this.state.agendaNumber}
          onSaveLocally={async () => {
            try {
              console.log("🔄 Generating signed metadata for local save...");

              // Generate complete metadata with signature
              const { address } = this.props;
              if (!address) {
                alert("Wallet not connected");
                return;
              }

              // Generate signature message
              const signatureTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ".00Z");
              const signatureMessage = createAgendaSignatureMessage(
                this.state.agendaNumber,
                this.props.writeData || "",
                signatureTimestamp
              );

              // Request signature from user
              const signature = await signMessage(signatureMessage, address);

              // Create complete metadata with signature
              const metadata = {
                id: Number(this.state.agendaNumber),
                title: this.state.title,
                description: this.state.description,
                network: process.env.NEXT_PUBLIC_CHAIN_ID === "1" ? "mainnet" : "sepolia",
                transaction: this.props.writeData || "",
                creator: {
                  address: address,
                  signature: signature
                },
                actions: this.state.actions.map(action => ({
                  title: action.title,
                  contractAddress: action.contractAddress,
                  method: action.method,
                  calldata: action.calldata,
                  abi: action.abi,
                  sendEth: action.sendEth
                })),
                createdAt: signatureTimestamp,
                snapshotUrl: this.state.snapshotUrl,
                discourseUrl: this.state.discourseUrl
              };

              // Download the signed metadata
              const downloadTimestamp = new Date().toISOString().replace(/:/g, '-');
              const blob = new Blob([JSON.stringify(metadata, null, 2)], {
                type: 'application/json'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `agenda-${this.state.agendaNumber}-${downloadTimestamp}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              console.log("✅ Signed agenda metadata saved locally");
            } catch (error) {
              console.error("❌ Failed to generate signed metadata:", error);
              alert("Failed to generate signed metadata. Please try again.");
              throw error; // Re-throw error to prevent PR submission
            }
          }}
          onSubmitPR={this.handleSubmitPR}
        />

      </div>
    );
  }
}