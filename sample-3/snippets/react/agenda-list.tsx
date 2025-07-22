// React example: Fetch agenda list from blockchain using ethers.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../common/contract-addresses';
import agendaAbi from '../../common/abi/agenda.json';
import { NETWORKS } from '../../common/network';

interface Agenda {
  id: number;
  createdTimestamp: number;
  status: string;
  // 필요한 필드 추가
}

const AgendaList: React.FC = () => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgendas = async () => {
      setLoading(true);
      setError(null);
      try {
        // 네트워크와 주소 정보 사용
        const provider = new ethers.JsonRpcProvider(NETWORKS.mainnet.rpcUrl);
        const agendaManager = new ethers.Contract(
          CONTRACT_ADDRESSES.mainnet.DAO_AGENDA_MANAGER,
          agendaAbi,
          provider
        );
        const numAgendas: number = Number(await agendaManager.numAgendas());
        const agendaList: Agenda[] = [];
        for (let i = numAgendas - 1; i >= 0; i--) {
          const agenda = await agendaManager.agendas(i);
          agendaList.push({
            id: i,
            createdTimestamp: Number(agenda.createdTimestamp),
            status: agenda.status?.toString() ?? '',
            // 필요한 필드 추가
          });
        }
        setAgendas(agendaList);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendas();
  }, []);

  if (loading) return <div>Loading agendas...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Created</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {agendas.map(agenda => (
          <tr key={agenda.id}>
            <td>{agenda.id}</td>
            <td>{new Date(agenda.createdTimestamp * 1000).toLocaleString()}</td>
            <td>{agenda.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AgendaList;