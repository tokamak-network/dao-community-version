import React from "react";
import { formatTransactionError, TransactionState } from "@/utils/transaction-utils";
import { ExternalLink } from "lucide-react";
import { useChainId } from 'wagmi';
import { getTransactionUrl } from '@/utils/explorer';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TransactionState;
  title: string;
  txHash?: string | null;
  stepLabels?: [string, string, string];
  successMessage?: string;
  errorMessage?: string;
  explorerUrl?: string;
}

const defaultStepLabels = ["Approve wallet", "Check blockchain", "Done"];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  state,
  title,
  txHash,
  stepLabels = defaultStepLabels,
  successMessage = "Transaction completed successfully",
  errorMessage = "Transaction failed",
  explorerUrl,
}) => {
  if (!isOpen) return null;

  const chainId = useChainId();

  // Determine current step
  let step = 0;
  if (state.isSuccess) step = 2;
  else if (txHash) step = 1;
  else step = 0;

  // 상태별 아이콘/메시지
  const renderStatus = () => {
    if (state.isSuccess) {
      return (
        <>
          <div className="flex flex-col items-center justify-center my-6">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#D1FAE5"/><path d="M16 24l6 6 10-10" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-xl font-semibold text-green-700 mb-2">{successMessage}</div>
            <div className="text-gray-500">Member retirement executed successfully</div>
          </div>
        </>
      );
    }
    if (state.error) {
      return (
        <>
          <div className="flex flex-col items-center justify-center my-6">
            <div className="rounded-full bg-red-100 p-4 mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#FEE2E2"/><path d="M16 32l16-16M16 16l16 16" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/></svg>
            </div>
            <div className="text-xl font-semibold text-red-700 mb-2">{errorMessage}</div>
            <div className="text-gray-500">{formatTransactionError({ message: state.error })}</div>
          </div>
        </>
      );
    }
    // 진행중
    return (
      <>
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative mb-4">
            <svg className="animate-spin" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="6" fill="none"/><circle cx="24" cy="24" r="20" stroke="#3B82F6" strokeWidth="6" fill="none" strokeDasharray="125.6" strokeDashoffset="100"/></svg>
          </div>
          <div className="text-lg font-medium text-gray-800 mb-1">Processing Transaction...</div>
          <div className="text-gray-500 text-sm">
            {step === 0 && "Please approve the transaction from your wallet."}
            {step === 1 && "Waiting for blockchain confirmation..."}
          </div>
        </div>
      </>
    );
  };

  // 해시 표시
  const renderTxHash = () => {
    if (!txHash) return null;
    const shortHash = txHash.slice(0, 6) + "..." + txHash.slice(-4);
    return (
      <div className="flex items-center justify-between bg-gray-100 rounded px-3 py-2 mt-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-blue-700 select-all">{shortHash}</span>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => navigator.clipboard.writeText(txHash)}
            title="Copy hash"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
          </button>
        </div>
        {txHash && (
          <a
            href={getTransactionUrl(txHash, chainId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 ml-2"
            title="View on Explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  };

  // 단계별 진행 바
  const renderStepBar = () => (
    <div className="flex flex-col mt-6">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        {stepLabels.map((label, idx) => (
          <span key={label} className={step === idx ? "text-blue-600 font-semibold" : step > idx ? "text-gray-400" : ""}>{`${idx + 1}. ${label}`}</span>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-blue-600 h-1 rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        {/* 상태별 내용 */}
        {renderStatus()}
        {/* 해시 */}
        {renderTxHash()}
        {/* 진행 바 */}
        {renderStepBar()}
        {/* 완료 버튼 */}
        {state.isSuccess && (
          <button
            className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            onClick={onClose}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};