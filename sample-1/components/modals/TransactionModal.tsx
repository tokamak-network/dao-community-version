"use client";

import React from "react";
import { X, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export type TransactionStatus = "submitting" | "pending" | "confirmed" | "error";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  agendaNumber?: string;
  error?: string;
  explorerUrl?: string;
  onSaveLocally?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  txHash,
  agendaNumber,
  error,
  explorerUrl = "https://sepolia.etherscan.io",
  onSaveLocally,
}: TransactionModalProps) {
  if (!isOpen) return null;

  const getStatusTitle = () => {
    switch (status) {
      case "submitting":
        return "Submitting Transaction";
      case "pending":
        return "Transaction in Progress";
      case "confirmed":
        return "Transaction Confirmed";
      case "error":
        return "Transaction Failed";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {getStatusTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading animation for pending status */}
          {(status === "submitting" || status === "pending") && <LoadingDots />}

          {/* Error icon for error status */}
          {status === "error" && (
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Transaction Hash
              </p>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                <span className="text-blue-600 font-mono text-sm">
                  {formatTxHash(txHash)}
                </span>
                <a
                  href={`${explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Agenda Number */}
          {agendaNumber && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Agenda Number
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="text-gray-800 font-semibold">
                  #{agendaNumber}
                </span>
              </div>
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
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {status === "confirmed" && onSaveLocally ? (
            <button
              onClick={onSaveLocally}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Save Agenda Locally with Signature
            </button>
          ) : status === "pending" ? (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}