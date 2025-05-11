import { ethers } from "ethers";

export interface IDAOAgendaManager {
  minimumNoticePeriodSeconds(): Promise<bigint>;
  minimumVotingPeriodSeconds(): Promise<bigint>;
  createAgendaFees(): Promise<bigint>;
  numAgendas(): Promise<bigint>;
  getExecutionInfo(
    agendaId: bigint
  ): Promise<[string[], string[], bigint, bigint, boolean]>;
}
