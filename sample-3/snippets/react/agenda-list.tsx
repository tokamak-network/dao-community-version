// React example: Fetch agenda list from blockchain using wagmi
import React, { useMemo } from 'react';
import { useContractRead, useContractReads } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../../common/contract-addresses';
import agendaAbi from '../../common/abi/DAOAgendaManager.json';

const AGENDA_MANAGER = CONTRACT_ADDRESSES.mainnet.DAO_AGENDA_MANAGER;

const AgendaList: React.FC = () => {
  // 1. Get total number of agendas
  const { data: numAgendas, isLoading: loadingCount, error: errorCount } = useContractRead({
    address: AGENDA_MANAGER,
    abi: agendaAbi,
    functionName: 'numAgendas',
    watch: true,
  });

  // 2. Prepare agenda numbers (latest first)
  const agendaNumbers = useMemo(() => {
    if (!numAgendas) return [];
    const n = Number(numAgendas);
    return Array.from({ length: n }, (_, i) => n - 1 - i);
  }, [numAgendas]);

  // 3. Fetch agenda details in batch
  const { data: agendas, isLoading: loadingAgendas, error: errorAgendas } = useContractReads({
    contracts: agendaNumbers.map((no) => ({
      address: AGENDA_MANAGER,
      abi: agendaAbi,
      functionName: 'agendas',
      args: [no],
    })),
    enabled: agendaNumbers.length > 0,
  });

  if (loadingCount || loadingAgendas) return <div>Loading agendas...</div>;
  if (errorCount) return <div>Error: {errorCount.message}</div>;
  if (errorAgendas) return <div>Error: {errorAgendas.message}</div>;

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
        {agendas && agendas.map((agenda, idx) => (
          <tr key={agendaNumbers[idx]}>
            <td>{agendaNumbers[idx]}</td>
            <td>{agenda?.result?.createdTimestamp?.toString?.()}</td>
            <td>{agenda?.result?.status?.toString?.()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AgendaList;