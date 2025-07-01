

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
  }) => void;

  /**
   * Agenda 투표 이벤트 핸들러 타입
   */
  export type AgendaVoteCastedHandler = (data: {
    id: bigint;
    from: string;
    isSupport: number;
    stake: bigint;
  }) => void;

  /**
   * Agenda 실행 이벤트 핸들러 타입
   */
  export type AgendaExecutedHandler = (data: {
    id: bigint;
    from: string;
  }) => void;

  /**
   * Agenda 생성 이벤트 핸들러 생성 함수
   */
  export const createAgendaCreatedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => void
  ): AgendaCreatedHandler => {
    return (data) => {
      const agendaId = Number(data.id);
      console.log('🎉 [AGENDA CREATED] New agenda created:', {
        agendaId,
        from: data.from,
        noticePeriod: data.noticePeriod.toString(),
        votingPeriod: data.votingPeriod.toString(),
        timestamp: new Date().toISOString()
      });

      console.log(`📋 Processing new agenda ID: ${agendaId}`);
      updateAgendaData(agendaId, true); // shouldSort = true for new agendas
    };
  };

  /**
   * Agenda 투표 이벤트 핸들러 생성 함수
   */
  export const createAgendaVoteCastedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => void
  ): AgendaVoteCastedHandler => {
    return (data) => {
      const agendaId = Number(data.id);
      console.log('🗳️ [VOTE CASTED] New vote casted:', {
        agendaId,
        voter: data.from,
        isSupport: data.isSupport,
        stake: data.stake.toString(),
        timestamp: new Date().toISOString()
      });

      console.log(`🗳️ Processing vote for agenda ID: ${agendaId}`);
      updateAgendaData(agendaId, false); // shouldSort = false for vote updates
    };
  };

  /**
   * Agenda 실행 이벤트 핸들러 생성 함수
   */
  export const createAgendaExecutedHandler = (
    updateAgendaData: (agendaId: number, shouldSort: boolean) => void
  ): AgendaExecutedHandler => {
    return (data) => {
      const agendaId = Number(data.id);
      console.log('⚡ [AGENDA EXECUTED] Agenda executed:', {
        agendaId,
        executor: data.from,
        timestamp: new Date().toISOString()
      });

      console.log(`⚡ Processing executed agenda ID: ${agendaId}`);
      updateAgendaData(agendaId, false); // shouldSort = false for execution updates
    };
  };