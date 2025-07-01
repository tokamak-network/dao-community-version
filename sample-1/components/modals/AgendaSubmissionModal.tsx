"use client";

import React, { useState } from "react";
import { X, ExternalLink, CheckCircle, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AgendaSubmissionStatus = "preparing" | "approving" | "pending" | "confirmed" | "error" | "cancelled";

export enum PrSubmissionStatus {
  IDLE = "idle",
  SUBMITTING = "submitting",
  SUCCESS = "success",
  ERROR = "error"
}

interface AgendaSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AgendaSubmissionStatus;
  txHash?: string;
  agendaNumber?: string;
  error?: string;
  explorerUrl?: string;
  onSaveLocally?: () => void;
  onSubmitPR?: () => Promise<{ success: boolean; url?: string; error?: string }>;
}

export function AgendaSubmissionModal({
  isOpen,
  onClose,
  status,
  txHash,
  agendaNumber,
  error,
  explorerUrl = "https://sepolia.etherscan.io",
  onSaveLocally,
  onSubmitPR,
}: AgendaSubmissionModalProps) {
  const [shouldSubmitPR, setShouldSubmitPR] = useState(true);
  const [shouldSaveLocally, setShouldSaveLocally] = useState(true);
  const [prStatus, setPrStatus] = useState(PrSubmissionStatus.IDLE);
  const [prError, setPrError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAndSubmit = async () => {
    try {
      // 1단계: 로컬 저장 먼저 (메타데이터 생성 + 파일 다운로드)
      if (shouldSaveLocally && onSaveLocally) {
        console.log("🔄 Step 1: Starting local save (metadata generation + file download)...");
        await onSaveLocally();
        console.log("✅ Step 1 completed: File downloaded to your computer");
      }

      // 2단계: PR 제출 (다운로드된 메타데이터 재사용)
      if (shouldSubmitPR && onSubmitPR) {
        console.log("🔄 Step 2: Starting PR submission with downloaded metadata...");
        setPrStatus(PrSubmissionStatus.SUBMITTING);
        setPrError(null);

        const result = await onSubmitPR();

        if (result.success) {
          setPrStatus(PrSubmissionStatus.SUCCESS);
          setPrUrl(result.url || null);
          console.log("✅ Step 2 completed: PR successfully submitted to repository");
        } else {
          setPrStatus(PrSubmissionStatus.ERROR);
          setPrError(result.error || "Unknown error occurred");
          console.log("❌ Step 2 failed: PR submission error");
        }
      }
    } catch (error) {
      setPrStatus(PrSubmissionStatus.ERROR);
      setPrError(error instanceof Error ? error.message : "Unknown error occurred");
      console.log("❌ Process failed:", error);
    }
  };

  const handleCloseModal = () => {
    setPrStatus(PrSubmissionStatus.IDLE);
    setPrError(null);
    setPrUrl(null);
    onClose();
  };

  const getStatusTitle = () => {
    switch (status) {
      case "preparing":
        return "Preparing Transaction";
      case "approving":
        return "Waiting for Wallet Approval";
      case "pending":
        return "Transaction Pending";
      case "confirmed":
        return "Agenda Submitted Successfully";
      case "error":
        return "Agenda Submission Failed";
      case "cancelled":
        return "Transaction Cancelled";
      default:
        return "";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "preparing":
        return "Checking network, balance, and preparing transaction data...";
      case "approving":
        return "Please approve the transaction in your wallet to proceed...";
      case "pending":
        return "Transaction submitted. Waiting for blockchain confirmation...";
      case "confirmed":
        return "Your agenda has been successfully submitted to the DAO!";
      case "error":
        return "There was an error submitting your agenda. Please try again.";
      case "cancelled":
        return "Transaction cancelled by user.";
      default:
        return "";
    }
  };

  const formatTxHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Loading dots animation component
  const LoadingDots = () => (
    <div className="flex justify-center items-center space-x-1 mb-6">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 모달 헤더 - 고정 */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {status === "confirmed"
                ? "Transaction Confirmed"
                : status === "preparing"
                ? "Preparing Transaction"
                : status === "approving"
                ? "Wallet Approval Required"
                : status === "pending"
                ? "Transaction in Progress"
                : status === "error"
                ? "Transaction Failed"
                : status === "cancelled"
                ? "Transaction Cancelled"
                : "Transaction Status"}
            </h3>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모달 내용 - 스크롤 가능 */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Transaction Hash */}
            {txHash && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Transaction Hash
                </h4>
                <div className="flex items-center space-x-2">
                  <a
                    href={`${explorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  >
                    <code className="text-blue-600 break-all">{txHash}</code>
                    <ExternalLink className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {/* Loading states */}
            {status === "preparing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Preparing transaction...
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">{getStatusMessage()}</p>
                </div>
              </div>
            )}

            {status === "approving" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-pulse rounded-full h-6 w-6 bg-blue-500"></div>
                  <span className="text-sm text-gray-600">
                    Waiting for wallet approval...
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">{getStatusMessage()}</p>
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-sm text-gray-600">
                  Waiting for blockchain confirmation...
                </span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <span className="text-sm text-red-600">
                  {getStatusMessage()}
                </span>
              </div>
            )}

            {status === "cancelled" && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <X className="h-6 w-6 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {getStatusMessage()}
                </span>
              </div>
            )}

            {status === "confirmed" && !agendaNumber && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-gray-600">
                    Retrieving agenda number...
                  </span>
                </div>
              </div>
            )}

            {/* Agenda Number */}
            {agendaNumber && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Agenda Number
                </h4>
                <div className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  #{agendaNumber}
                </div>
              </div>
            )}

            {/* Success Options */}
            {status === "confirmed" && agendaNumber && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">✅</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-800">
                        Agenda Published Successfully!
                      </h4>
                      <p className="text-sm text-gray-600">
                        Your agenda is now on-chain. Choose how to save the metadata
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1: Submit PR (Recommended) */}
                    <label className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-transparent hover:border-green-300 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md">
                      <input
                        type="radio"
                        name="save-option"
                        checked={shouldSubmitPR}
                        onChange={() => {
                          setShouldSubmitPR(true);
                          setShouldSaveLocally(true);
                          setPrError(null);
                          setPrStatus(PrSubmissionStatus.IDLE);
                        }}
                        className="mt-1.5 w-4 h-4 text-green-600 focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">🚀</span>
                          <span className="text-base font-semibold text-gray-900 group-hover:text-green-700">
                            Submit to Repository & Save Locally
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            ⭐ Recommended
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Registers your agenda in the public metadata repository for community access.
                          <strong className="text-green-700">
                            {" "}Also saves a backup copy to your computer automatically.
                          </strong>
                        </p>
                        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700">
                            ✅ <strong>Includes:</strong> Public registration + Local backup file
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Save Locally Only */}
                    <label className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-transparent hover:border-blue-300 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md">
                      <input
                        type="radio"
                        name="save-option"
                        checked={!shouldSubmitPR && shouldSaveLocally}
                        onChange={() => {
                          setShouldSubmitPR(false);
                          setShouldSaveLocally(true);
                          setPrError(null);
                          setPrStatus(PrSubmissionStatus.IDLE);
                        }}
                        className="mt-1.5 w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">💾</span>
                          <span className="text-base font-semibold text-gray-900 group-hover:text-blue-700">
                            Save Locally Only
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Downloads metadata file to your computer only. You can submit to repository later using the saved file.
                        </p>
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            💡 <strong>Tip:</strong> Submit to repository later to preserve your original creation time.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* PR Status Messages */}
                {prStatus === PrSubmissionStatus.SUBMITTING && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span>Submitting PR to repository...</span>
                  </div>
                )}

                {prStatus === PrSubmissionStatus.ERROR && shouldSubmitPR && (
                  <div className="text-sm text-red-600">
                    Error submitting PR: {prError}
                  </div>
                )}

                {prStatus === PrSubmissionStatus.SUCCESS && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">
                      🎉 Repository submission successful! Your agenda metadata has been submitted to the public repository and saved locally.
                    </div>
                    {prUrl && (
                      <div className="text-sm">
                        <a
                          href={prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Pull Request
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === "error" && error && (
              <div className="mb-4">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Loading for preparing/approving status */}
            {(status === "preparing" || status === "approving") && <LoadingDots />}
          </div>
        </div>

        {/* 모달 하단 버튼 - 고정 */}
        <div className="p-6 pt-0 flex-shrink-0 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            {status === "confirmed" && agendaNumber && (
              <Button
                onClick={handleSaveAndSubmit}
                className={`${
                  shouldSubmitPR && shouldSaveLocally
                    ? "bg-green-600 hover:bg-green-700"
                    : shouldSaveLocally && !shouldSubmitPR
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-purple-600 hover:bg-purple-700"
                } text-white font-medium px-6 py-2.5 transition-all duration-200`}
                disabled={
                  prStatus === PrSubmissionStatus.SUBMITTING ||
                  (!shouldSubmitPR && !shouldSaveLocally)
                }
              >
                {prStatus === PrSubmissionStatus.SUBMITTING ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting to Repository...
                  </>
                ) : shouldSubmitPR ? (
                  <>
                    <span className="mr-2">🚀</span>
                    Submit to Repository & Save Locally
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Locally
                  </>
                )}
              </Button>
            )}

            <Button onClick={handleCloseModal} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}