/**
 * DAO 이벤트 핸들러 함수들
 */

/**
 * Member 변경 이벤트 핸들러 타입
 */
export type MemberChangedHandler = (data: {
  slotIndex: bigint;
  prevMember: string;
  newMember: string
}) => void;

/**
 * Activity Reward 청구 이벤트 핸들러 타입
 */
export type ActivityRewardClaimedHandler = (data: {
  candidate: string;
  receiver: string;
  amount: bigint
}) => void;

/**
 * Layer2 등록 이벤트 핸들러 타입
 */
export type Layer2RegisteredHandler = (data: {
  candidate: string;
  candidateContract: string;
  memo: string
}) => void;

/**
 * Member 변경 이벤트 핸들러 생성 함수
 */
export const createMemberChangedHandler = (
  refreshSpecificMember: (slotIndex: number) => void
): MemberChangedHandler => {
  return (data) => {
    const isRetire = data.newMember === '0x0000000000000000000000000000000000000000';
    const isJoin = data.prevMember === '0x0000000000000000000000000000000000000000';


    refreshSpecificMember(Number(data.slotIndex));
  };
};

/**
 * Activity Reward 청구 이벤트 핸들러 생성 함수 (개선된 버전)
 */
export const createActivityRewardClaimedHandler = (
  refreshSpecificMember: (slotIndex: number) => void,
  maxMember: number,
  committeeMembers?: any[] // 현재 위원회 멤버 목록
): ActivityRewardClaimedHandler => {
  return (data) => {

    if (committeeMembers && committeeMembers.length > 0) {
      const targetMember = committeeMembers.find(member => {
        const operator = data.candidate.toLowerCase();
        if (member.creationAddress.toLowerCase() === operator) {
            return true;
        } else {
          return false;
        }
      });

      if (targetMember) {
        setTimeout(() => {
          refreshSpecificMember(targetMember.indexMembers);
        }, 500);

        return;
      }
    }

    console.warn('⚠️ Could not find specific member for activity reward claim, refreshing all slots');
    for (let i = 0; i < maxMember; i++) {

      refreshSpecificMember(i);
    }
  };
};

/**
 * Layer2 등록 이벤트 핸들러 생성 함수
 */
export const createLayer2RegisteredHandler = (
  resetLayer2Cache: () => void
): Layer2RegisteredHandler => {
  return (data) => {

    resetLayer2Cache();
  };
};