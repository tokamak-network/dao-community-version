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

    console.log('🔄 [MEMBER CHANGED] Member changed event detected:', {
      slotIndex: Number(data.slotIndex),
      prevMember: data.prevMember,
      newMember: data.newMember,
      actionType: isRetire ? 'RETIRE' : isJoin ? 'JOIN' : 'REPLACE',
      timestamp: new Date().toISOString()
    });

    if (isRetire) {
      console.log(`👋 [RETIRE] Member retired from slot ${Number(data.slotIndex)}`);
    } else if (isJoin) {
      console.log(`👋 [JOIN] New member joined slot ${Number(data.slotIndex)}`);
    } else {
      console.log(`🔄 [REPLACE] Member replaced in slot ${Number(data.slotIndex)}`);
    }

    console.log(`🔄 Refreshing member slot ${Number(data.slotIndex)} due to member change`);
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
    console.log('🎉 [SUCCESS] Activity reward claimed, refreshing data...', {
      ...data,
      timestamp: new Date().toISOString(),
      candidateAddress: data.candidate,
      amount: data.amount.toString()
    });

        // 디버깅: 현재 위원회 멤버들의 주소 정보 출력
    if (committeeMembers && committeeMembers.length > 0) {
      console.log('🔍 [DEBUG] Current committee members for matching:',
        committeeMembers.map(member => ({
          name: member.name,
          slotIndex: member.indexMembers,
          creationAddress: member.creationAddress,
          candidateContract: member.candidateContract,
          manager: member.manager,
          hasManager: !!(member.manager && member.manager !== '0x0000000000000000000000000000000000000000'),
          expectedMatchAddress: (member.manager && member.manager !== '0x0000000000000000000000000000000000000000')
            ? member.manager : member.creationAddress
        }))
      );
      console.log('🎯 [DEBUG] Looking for candidate:', data.candidate);
    }

    // candidate 주소로 해당하는 슬롯 찾기
    // 이벤트의 candidate는 manager가 있으면 manager, 없으면 creationAddress와 매칭됨
    if (committeeMembers && committeeMembers.length > 0) {
      const targetMember = committeeMembers.find(member => {
        const candidateAddress = data.candidate.toLowerCase();
        // manager가 있으면 manager와 비교, 없으면 creationAddress와 비교
        if (member.manager && member.manager !== '0x0000000000000000000000000000000000000000') {
          return member.manager.toLowerCase() === candidateAddress;
        } else {
          return member.creationAddress.toLowerCase() === candidateAddress;
        }
      });

      if (targetMember) {
        console.log(`🎯 Found target member for activity reward claim:`, {
          memberName: targetMember.name,
          slotIndex: targetMember.indexMembers,
          candidateContract: targetMember.candidateContract
        });

        // 해당 슬롯만 새로고침 (짧은 지연 후 실행하여 블록체인 상태 동기화 대기)
        console.log(`🔄 Refreshing specific member slot ${targetMember.indexMembers} due to activity reward claim`);

        // 1초 후 업데이트 (블록체인 상태 동기화 대기)
        setTimeout(() => {
          console.log(`🔄 [DELAYED] Refreshing member slot ${targetMember.indexMembers} after 1 second delay`);
          refreshSpecificMember(targetMember.indexMembers);
        }, 1000);

        return;
      }
    }

    // 만약 해당 멤버를 찾지 못했다면 기존 방식으로 모든 슬롯 새로고침
    console.warn('⚠️ Could not find specific member for activity reward claim, refreshing all slots');
    for (let i = 0; i < maxMember; i++) {
      console.log(`🔄 Refreshing member slot ${i} due to activity reward claim (fallback)`);
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
    console.log('🏗️ Layer2 registered, refreshing cache...', data);
    resetLayer2Cache();
  };
};