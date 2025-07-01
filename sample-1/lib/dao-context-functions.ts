/**
 * DAO Context에서 사용하는 함수들을 모듈화
 */

import { CommitteeMember, Candidate } from "@/types/dao";
import { DAO_ABI } from "@/abis/dao";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { CONTRACTS } from "@/config/contracts";
import { getSharedPublicClient, queueRPCRequest } from "@/lib/shared-rpc-client";
import { readContractWithRetry } from "@/lib/rpc-utils";
import {
  loadMaxMembers as loadMaxMembersFromHandler,
  loadCommitteeMembers as loadCommitteeMembersFromHandler,
  refreshSpecificMember as refreshSpecificMemberFromHandler
} from "./dao-member-handlers";
import {
  loadLayer2Candidates as loadLayer2CandidatesFromHandler,
  resetLayer2Cache as resetLayer2CacheFromHandler
} from "./dao-layer2-handlers";

// 🎯 전역 변수로 중복 로딩 방지 (페이지 이동 시에도 유지)
let loadedMaxMembers: boolean = false;
let loadedCommitteeMembers: boolean = false;

/**
 * DAO Context 함수들을 생성하는 팩토리 함수
 */
export function createDAOContextFunctions(
  // 상태 업데이트 함수들
  setMaxMember: (value: number) => void,
  setCommitteeMembers: (members: CommitteeMember[]) => void,
  setIsLoadingMembers: (loading: boolean) => void,
  setMembersError: (error: string | null) => void,
  setStatusMessage: (message: string) => void,
  setLayer2Candidates: (candidates: Candidate[]) => void,
  setLayer2Total: (total: number) => void,
  setIsLoadingLayer2: (loading: boolean) => void,
  setLayer2Error: (error: string | null) => void,
  setHasLoadedLayer2Once: (loaded: boolean) => void,
  // 현재 상태값들
  maxMember: number,
  committeeMembers: CommitteeMember[] | undefined,
  lastFetchTimestamp: number,
  hasLoadedLayer2Once: boolean,
  layer2Candidates: Candidate[]
) {

  /**
   * 최대 멤버 수 로드
   */
  const loadMaxMembers = async () => {
    console.log("🚀 loadMaxMembers maxMember ", maxMember);
    console.log("🚀 loadMaxMembers loadedMaxMembers ", loadedMaxMembers);

    try {
      if (maxMember === 0) {
        const _maxMember = await loadMaxMembersFromHandler();
       loadedMaxMembers = true;
        setMaxMember(Number(_maxMember));

        if (!loadedCommitteeMembers) {
          await loadCommitteeMembers(Number(_maxMember));
        }
      }
    } catch (err) {
      console.error("Failed to load maxMember:", err);
    }
  };

  /**
   * 위원회 멤버들 로드 (DAOContext.tsx와 동일하게)
   */
  const loadCommitteeMembers = async (maxMemberCount?: number) => {
    console.log("🔄 loadCommitteeMembers 시작 (분리된 핸들러 사용)");
    loadedCommitteeMembers = true;

    try {
      setIsLoadingMembers(true);
      setMembersError(null);
      setStatusMessage("Loading committee members from blockchain...");

      const actualMaxMember = maxMemberCount || maxMember;

      // 분리된 핸들러 함수 사용 (DAOContext.tsx와 동일)
      const memberDetails = await loadCommitteeMembersFromHandler(
        actualMaxMember,
        committeeMembers,
        lastFetchTimestamp,
        // 상태 메시지만 업데이트
        (message) => {
          setStatusMessage(message);
        }
      );

      setCommitteeMembers(memberDetails);
      setStatusMessage(`✅ Loaded ${memberDetails.length} committee members`);
      console.log(`✅ Committee members loaded: ${memberDetails.length}`);

    } catch (error) {
      console.error("❌ 위원회 멤버 로드 실패:", error);
      setMembersError("Failed to load committee members");
      setStatusMessage("❌ Error loading committee members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  /**
   * 특정 멤버 새로고침 (slotIndex 기반)
   */
  const refreshSpecificMember = async (slotIndex: number) => {
    console.log("🔄 refreshSpecificMember 시작:", slotIndex);

    try {
      // 분리된 핸들러 함수 사용 (slotIndex 전달)
      const updatedMember = await refreshSpecificMemberFromHandler(slotIndex);

      if (updatedMember && committeeMembers) {
        // 기존 멤버 리스트에서 해당 슬롯의 멤버 업데이트
        const updatedMembers = committeeMembers.map((member, index) =>
          index === slotIndex ? updatedMember : member
        );
        setCommitteeMembers(updatedMembers);
        console.log(`✅ Slot ${slotIndex} member updated successfully`);
      } else if (!updatedMember && committeeMembers) {
        // 멤버가 제거된 경우 빈 슬롯으로 설정
        const emptySlot = {
          name: `Empty Slot ${slotIndex}`,
          description: "This committee slot is currently empty",
          creationAddress: "0x0000000000000000000000000000000000000000",
          candidateContract: "0x0000000000000000000000000000000000000000",
          claimedTimestamp: 0,
          rewardPeriod: 0,
          indexMembers: slotIndex,
          totalStaked: "0",
          lastCommitBlock: 0,
          lastUpdateSeigniorageTime: 0,
          claimableActivityReward: "0",
          operatorManager: "0x0000000000000000000000000000000000000000",
          manager: null
        };

        const updatedMembers = committeeMembers.map((member, index) =>
          index === slotIndex ? emptySlot : member
        );
        setCommitteeMembers(updatedMembers);
        console.log(`✅ Slot ${slotIndex} set to empty`);
      }
    } catch (err) {
      console.error("Failed to refresh specific member:", err);
    }
  };

  /**
   * Layer2 후보자들 로드 (DAOContext.tsx와 동일하게)
   */
  const loadLayer2Candidates = async (force = false, onProgress?: (current: number, total: number, message: string) => void) => {
    setIsLoadingLayer2(true);
    setLayer2Error(null);

    try {
      // 분리된 핸들러 함수 사용 (DAOContext.tsx와 동일)
      const result = await loadLayer2CandidatesFromHandler(
        force,
        hasLoadedLayer2Once,
        layer2Candidates,
        onProgress
      );

      // 상태 업데이트
      setLayer2Candidates(result.candidates);
      setLayer2Total(result.total);
      setHasLoadedLayer2Once(true);

      console.log(`✅ Layer2 후보 로드 완료: ${result.candidates.length}개`);
    } catch (error) {
      console.error("❌ Layer2 후보 로드 실패:", error);
      setLayer2Error("Failed to load Layer2 candidates");
    } finally {
      setIsLoadingLayer2(false);
    }
  };

  /**
   * Layer2 캐시 초기화
   */
  const resetLayer2Cache = () => {
    console.log("🔄 Layer2 캐시 초기화");
    resetLayer2CacheFromHandler();
    setLayer2Candidates([]);
    setLayer2Total(0);
    setHasLoadedLayer2Once(false);
  };

  /**
   * 위원회 멤버들 새로고침
   */
  const refreshCommitteeMembers = async () => {
    console.log("🔄 Committee members 새로고침");
    if (maxMember > 0) {
      await loadCommitteeMembers(maxMember);
    } else {
      await loadMaxMembers();
    }
  };

  /**
   * 위원회 멤버 여부 확인
   */
  const isCommitteeMember = (address?: string): boolean => {
    if (!address || !committeeMembers) return false;
    return committeeMembers.some(member =>
      member.creationAddress.toLowerCase() === address.toLowerCase()
    );
  };

  return {
    loadMaxMembers,
    loadCommitteeMembers,
    refreshSpecificMember,
    loadLayer2Candidates,
    resetLayer2Cache,
    refreshCommitteeMembers,
    isCommitteeMember,
    // 유틸리티 함수들
    getLoadedStates: () => ({ loadedMaxMembers, loadedCommitteeMembers }),
    resetLoadedStates: () => {
      loadedMaxMembers = false;
      loadedCommitteeMembers = false;
    }
  };
}

/**
 * DAO Context 함수들의 타입 정의
 */
export type DAOContextFunctions = ReturnType<typeof createDAOContextFunctions>;