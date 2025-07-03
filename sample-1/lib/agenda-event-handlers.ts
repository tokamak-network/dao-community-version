/**
 * Agenda 이벤트 핸들러 함수들
 */

/**
 * Agenda 생성 이벤트 핸들러 타입
 */
export type AgendaCreatedHandler = (data: {
    id: bigint;
    from: string;
    noticePeriod: bigint;
    votingPeriod: bigint;
  }) => Promise<void>;

  /**
   * Agenda 투표 이벤트 핸들러 타입
   */
  export type AgendaVoteCastedHandler = (data: {
    id: bigint;
    from: string;
    isSupport: number;
    stake: bigint;
  }) => Promise<void>;

  /**
   * Agenda 실행 이벤트 핸들러 타입
   */
  export type AgendaExecutedHandler = (data: {
    id: bigint;
    from: string;
  }) => Promise<void>;

  /**
   * 커스텀 이벤트 디스패치 함수
   */
  const dispatchCustomEvent = (eventName: string, detail: any) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);

    }
  };

  /**
   * Agenda 생성 이벤트 핸들러 생성 함수
   */
  export const createAgendaCreatedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<void>
  ): AgendaCreatedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);

      await updateAgendaData(agendaId, true); // shouldSort = true for new agendas
    };
  };

  /**
   * Agenda 투표 이벤트 핸들러 생성 함수
   */
  export const createAgendaVoteCastedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<void>
  ): AgendaVoteCastedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);

      await updateAgendaData(agendaId, false); // shouldSort = false for vote updates

      // 커스텀 이벤트 디스패치
      dispatchCustomEvent('agendaVoteUpdated', { agendaId });
    };
  };

  /**
   * Agenda 실행 이벤트 핸들러 생성 함수
   */
  export const createAgendaExecutedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<void>
  ): AgendaExecutedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);

      await updateAgendaData(agendaId, false); // shouldSort = false for execution updates

      // 커스텀 이벤트 디스패치
      dispatchCustomEvent('agendaExecuted', { agendaId });
    };
  };