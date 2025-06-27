"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart2, Send, ExternalLink, Code, ChevronDown, ChevronRight } from "lucide-react";

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  method: string;
  calldata: string;
  abi?: any[];
  sendEth: boolean;
}

interface ProposalPreviewProps {
  title: string;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  actions: Action[];
  onModeChange?: (mode: "preview" | "edit", section?: string) => void;
  onActionSelect?: (actionId: string | null) => void;
  selectedActionId?: string | null;
  onEditButtonActivate?: (section: string) => void;
  isEditMode?: boolean;
  onImpactOverviewClick?: () => void;
  showSimulation?: boolean;
  onTransactionSuccess?: () => void;
}

export function ProposalPreview({
  title,
  description,
  snapshotUrl,
  discourseUrl,
  actions,
  onModeChange,
  onActionSelect,
  selectedActionId,
  onEditButtonActivate,
  isEditMode = false,
  onImpactOverviewClick,
  showSimulation = false,
  onTransactionSuccess,
}: ProposalPreviewProps) {
  const [expandedActions, setExpandedActions] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleActionExpanded = (actionId: string) => {
    setExpandedActions(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    if (!description.trim()) {
      alert("Description is required");
      return;
    }
    if (!snapshotUrl.trim()) {
      alert("Snapshot URL is required");
      return;
    }
    if (actions.length === 0) {
      alert("At least one action is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate proposal submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success
      alert("Proposal submitted successfully! (This is a demo)");
      onTransactionSuccess?.();
    } catch (error) {
      console.error("Error submitting proposal:", error);
      alert("Failed to submit proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isFormValid = title.trim() && description.trim() && snapshotUrl.trim() && actions.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Proposal Preview</h2>
        <div className="flex gap-2">
          {onImpactOverviewClick && (
            <Button
              variant="outline"
              onClick={onImpactOverviewClick}
              disabled={actions.length === 0}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Impact Overview
            </Button>
          )}
          <Button
            onClick={() => onModeChange?.("edit")}
            variant="outline"
          >
            Edit Proposal
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {title || <span className="text-gray-400">No title provided</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="p-3 bg-gray-50 rounded-md border min-h-[100px]">
                {description ? (
                  <div className="whitespace-pre-wrap">{description}</div>
                ) : (
                  <span className="text-gray-400">No description provided</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Snapshot URL</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  {snapshotUrl ? (
                    <a
                      href={snapshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {snapshotUrl.length > 40 ? `${snapshotUrl.slice(0, 40)}...` : snapshotUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400">No snapshot URL provided</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discourse URL (Optional)</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  {discourseUrl ? (
                    <a
                      href={discourseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {discourseUrl.length > 40 ? `${discourseUrl.slice(0, 40)}...` : discourseUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400">No discourse URL provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actions ({actions.length})
          </h3>

          {actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              No actions added yet
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Action #{index + 1}: {action.title}
                    </h4>
                    <button
                      onClick={() => toggleActionExpanded(action.id)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {expandedActions[action.id] ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          Show Details
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Contract:</span> {formatAddress(action.contractAddress)}
                    <span className="ml-4 font-medium">Method:</span> {action.method}
                    {action.sendEth && (
                      <span className="ml-4 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                        Sends ETH
                      </span>
                    )}
                  </div>

                  {expandedActions[action.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Contract Address
                        </label>
                        <div className="p-2 bg-gray-50 rounded font-mono text-sm">
                          {action.contractAddress}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Calldata
                        </label>
                        <div className="p-2 bg-gray-50 rounded font-mono text-sm break-all">
                          {action.calldata}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </div>

          {!isFormValid && (
            <p className="text-sm text-red-600 text-right mt-2">
              Please fill in all required fields and add at least one action
            </p>
          )}
        </div>
      </div>
    </div>
  );
}