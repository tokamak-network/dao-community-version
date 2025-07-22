// React example: Fetch agenda detail and status from blockchain using ethers.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../common/contract-addresses';
import agendaAbi from '../../common/abi/agenda.json';
import daoCommitteeAbi from '../../common/abi/daoCommittee.json';
import { NETWORKS } from '../../common/network';

interface AgendaDetailProps {
  agendaNo: number;
}

const AgendaDetail: React.FC<AgendaDetailProps> = ({ agendaNo }) => {
  const [agenda, setAgenda] = useState<any>(null);
  const [statusInfo, setStatusInfo] = useState<{ result: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgenda = async () => {
      setLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(NETWORKS.mainnet.rpcUrl);

        // 1. 아젠다 기본 정보
        const agendaManager = new ethers.Contract(
          CONTRACT_ADDRESSES.mainnet.DAO_AGENDA_MANAGER,
          agendaAbi,
          provider
        );
        const agendaData = await agendaManager.agendas(agendaNo);
        setAgenda(agendaData);

        // 2. 상태 정보
        const daoCommittee = new ethers.Contract(
          CONTRACT_ADDRESSES.mainnet.DAO_COMMITTEE,
          daoCommitteeAbi,
          provider
        );
        const [agendaResult, agendaStatus] = await daoCommittee.currentAgendaStatus(agendaNo);
        setStatusInfo({
          result: agendaResult.toString(),
          status: agendaStatus.toString(),
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
  }, [agendaNo]);

  if (loading) return <div>Loading agenda detail...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!agenda) return <div>No data</div>;

  return (
    <div>
      <h2>Agenda #{agendaNo}</h2>
      <p><b>Created:</b> {agenda.createdTimestamp?.toString()}</p>
      <p><b>Status:</b> {agenda.status?.toString()}</p>
      {statusInfo && (
        <>
          <p><b>Agenda Result:</b> {statusInfo.result}</p>
          <p><b>Agenda Status:</b> {statusInfo.status}</p>
        </>
      )}
      {/* 필요한 필드 추가 */}
    </div>
  );
};

export default AgendaDetail;