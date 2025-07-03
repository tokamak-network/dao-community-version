/**
 * Agenda 이벤트 핸들러 함수들
 */

/**
 * Agenda 생성 이벤트 핸들러 타입
 */
export type AgendaCreatedHandler = (data: {
    id: bigint;
    from: string;
    noticePeriodSeconds: bigint;
    votingPeriodSeconds: bigint;
    atomicExecute: boolean;
  }) => Promise<void>;

  /**
   * Agenda 투표 이벤트 핸들러 타입
   */
  export type AgendaVoteCastedHandler = (data: {
    from: string;
    id: bigint;
    voting: bigint;
    comment: string;
  }) => Promise<void>;

  /**
   * Agenda 실행 이벤트 핸들러 타입
   */
  export type AgendaExecutedHandler = (data: {
    id: bigint;
    target: string[];
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
   * updateAgendaData와 옵션으로 upsertAgenda 콜백을 받아, 둘 다 호출하도록 확장
   */
  export const createAgendaCreatedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<any>,
    upsertAgenda?: (agenda: any) => void
  ): AgendaCreatedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);
      const newAgenda = await updateAgendaData(agendaId, true);
      if (upsertAgenda && newAgenda) {
        upsertAgenda(newAgenda);
      }
    };
  };

  /**
   * Agenda 투표 이벤트 핸들러 생성 함수
   */
  export const createAgendaVoteCastedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<any>,
    upsertAgenda?: (agenda: any) => void
  ): AgendaVoteCastedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);
      const newAgenda = await updateAgendaData(agendaId, false); // shouldSort = false for vote updates
      if (upsertAgenda && newAgenda) {
        upsertAgenda(newAgenda);
      }
    };
  };

  /**
   * Agenda 실행 이벤트 핸들러 생성 함수
   */
  export const createAgendaExecutedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => Promise<any>,
    upsertAgenda?: (agenda: any) => void
  ): AgendaExecutedHandler => {
    return async (data) => {
      const agendaId = Number(data.id);
      const newAgenda = await updateAgendaData(agendaId, false);
      if (upsertAgenda && newAgenda) {
        upsertAgenda(newAgenda);
      }
    };
  };