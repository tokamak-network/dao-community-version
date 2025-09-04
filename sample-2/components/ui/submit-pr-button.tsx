import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { AgendaWithMetadata } from "@/types/agenda";
import {
  createAgendaSignatureMessage,
  signMessage,
  validateAgendaMetadata,
} from "@/lib/signature";

interface SubmitPRButtonProps {
  agendaData: AgendaWithMetadata;
  onSuccess?: (prUrl: string) => void;
  onError?: (error: Error) => void;
}

export function SubmitPRButton({
  agendaData,
  onSuccess,
  onError,
}: SubmitPRButtonProps) {
  const [isSubmittingPR, setIsSubmittingPR] = useState(false);
  const [needsSignature, setNeedsSignature] = useState(false);
  const { address } = useAccount();

  const handleSign = async () => {
    if (!address || !agendaData) return;

    try {
      console.log(
        "[SubmitPRButton] Before signing - Metadata:",
        JSON.stringify(agendaData, null, 2)
      );

      if (!agendaData.id || !agendaData.transaction) {
        throw new Error("Invalid agenda data. Missing ID or transaction hash.");
      }

      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ".00Z");
      const message = createAgendaSignatureMessage(
        agendaData.id,
        agendaData.transaction,
        timestamp,
        false // creating new metadata
      );
      const signature = await signMessage(message, address);
      console.log("[SubmitPRButton] Signature generated:", signature);

      // 서명 후 메타데이터 업데이트
      if (agendaData.creator) {
        agendaData.creator.signature = signature;
      } else {
        agendaData.creator = {
          address,
          signature,
        };
      }

      // 생성 시간 설정
      if (!agendaData.createdAt) {
        agendaData.createdAt = timestamp;
      }
      console.log(
        "[SubmitPRButton] After signing - Updated metadata:",
        JSON.stringify(agendaData, null, 2)
      );

      setNeedsSignature(false);
    } catch (error) {
      console.error("[SubmitPRButton] Error signing:", error);
      onError?.(error as Error);
    }
  };

  const handleSubmitPR = async () => {
    try {
      if (!address) {
        throw new Error("Please connect your wallet first");
      }

      // 메타데이터에 서명이 있는지 체크 및 검증
      if (!agendaData.creator?.signature) {
        throw new Error("Agenda metadata needs to be signed before submission");
      }

      if (!agendaData.transaction) {
        throw new Error(
          "Transaction hash is required for signature validation"
        );
      }

      // 서명 유효성 검증
      const validationResult = validateAgendaMetadata({
        id: agendaData.id,
        transaction: agendaData.transaction,
        creator: {
          address: agendaData.creator.address,
          signature: agendaData.creator.signature!, // 이미 위에서 체크했으므로 안전
        },
        createdAt: agendaData.createdAt,
        updatedAt: agendaData.updatedAt,
      });
      if (!validationResult.isValid) {
        throw new Error(`Invalid signature: ${validationResult.error}`);
      }

      setIsSubmittingPR(true);
      console.log(
        "[SubmitPRButton] Submitting PR with metadata:",
        JSON.stringify(agendaData, null, 2)
      );

      const response = await fetch("/api/submit-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agendaData,
          message: agendaData.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit PR");
      }

      const data = await response.json();
      onSuccess?.(data.prUrl);
      window.open(data.prUrl, "_blank");
    } catch (error) {
      console.error("[SubmitPRButton] Error submitting PR:", error);
      onError?.(error as Error);
    } finally {
      setIsSubmittingPR(false);
    }
  };

  // 서명 필요 여부 체크
  useEffect(() => {
    console.log(
      "[SubmitPRButton] Checking signature status - Metadata:",
      JSON.stringify(agendaData, null, 2)
    );

    // 메타데이터에 creator 정보가 있는지 체크
    if (!agendaData.creator?.address) {
      console.log("[SubmitPRButton] No creator address in metadata");
      setNeedsSignature(false);
      return;
    }

    // 메타데이터에 서명이 있는지 체크
    const hasSignature = agendaData.creator?.signature;

    // 현재 연결된 지갑 주소가 메타데이터의 creator 주소와 일치하는지 체크
    const isCreator =
      address?.toLowerCase() === agendaData.creator.address.toLowerCase();

    console.log("[SubmitPRButton] Signature check:", {
      hasSignature,
      isCreator,
      address,
      creatorAddress: agendaData.creator.address,
    });

    // 서명이 없고, 현재 연결된 지갑 주소가 메타데이터의 creator 주소와 일치하는 경우에만 서명 필요
    setNeedsSignature(!hasSignature && isCreator);
  }, [agendaData.creator?.signature, agendaData.creator?.address, address]);

  return (
    <div className="space-y-4">
      {needsSignature ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            This agenda needs to be signed by the creator before submitting PR.
          </div>
          <Button
            onClick={handleSign}
            variant="outline"
            className="text-blue-600 hover:text-blue-700 w-full"
          >
            Sign Agenda
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSubmitPR}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          disabled={isSubmittingPR}
        >
          {isSubmittingPR ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting PR...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Submit PR
            </>
          )}
        </Button>
      )}
    </div>
  );
}
