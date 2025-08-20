// React example: Fetch agenda list from blockchain using wagmi v2
import React, { useMemo } from 'react'
import { useReadContract, useReadContracts, useChainId } from 'wagmi'
import { getContracts } from '../../lib/wagmi'
import { AGENDA_MANAGER_ABI } from '../../lib/abis'

const AgendaList: React.FC = () => {
  const chainId = useChainId()
  const contracts = getContracts(chainId)

  // 1. Get total number of agendas
  const { data: numAgendas, isLoading: loadingCount, error: errorCount } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'numAgendas',
  })

  // 2. Prepare agenda numbers (latest first)
  const agendaNumbers = useMemo(() => {
    if (!numAgendas) return [];
    const n = Number(numAgendas);
    return Array.from({ length: n }, (_, i) => n - 1 - i);
  }, [numAgendas]);

  // 3. Fetch agenda details in batch
  const { data: agendas, isLoading: loadingAgendas, error: errorAgendas } = useReadContracts({
    contracts: agendaNumbers.map((no) => ({
      address: contracts?.agendaManager as `0x${string}`,
      abi: AGENDA_MANAGER_ABI,
      functionName: 'agendas',
      args: [BigInt(no)],
    })),
    query: {
      enabled: agendaNumbers.length > 0 && !!contracts?.agendaManager,
    },
  })

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
        {agendas && agendas.map((agenda, idx) => {
          const agendaData = agenda.result as any
          return (
            <tr key={agendaNumbers[idx]}>
              <td>{agendaNumbers[idx]}</td>
              <td>{agendaData ? new Date(Number(agendaData.createdTimestamp) * 1000).toLocaleDateString() : 'N/A'}</td>
              <td>{agendaData ? agendaData.status?.toString() : 'N/A'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
};

export default AgendaList;