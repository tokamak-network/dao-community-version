import { ethers } from 'ethers'
import { ParsedTransaction } from '@/types/agenda'
import { getContracts, AGENDA_CREATED_EVENT_ABI, TON_APPROVE_AND_CALL_ABI } from '@/constants/contracts'

const RPC_URLS: Record<number, { primary: string; fallback: string }> = {
  1: {
    primary: 'https://eth.llamarpc.com',
    fallback: 'https://ethereum.publicnode.com'
  },
  11155111: {
    primary: 'https://ethereum-sepolia-rpc.publicnode.com',
    fallback: 'https://rpc.sepolia.org'
  }
}

export const parseAgendaTransaction = async (
  txHash: string,
  chainId: number
): Promise<ParsedTransaction> => {
  const contracts = getContracts(chainId)
  if (!contracts) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  const rpcUrls = RPC_URLS[chainId]
  if (!rpcUrls) {
    throw new Error(`No RPC URL configured for chain ID: ${chainId}`)
  }

  let provider = new ethers.JsonRpcProvider(rpcUrls.primary)
  let tx
  let receipt

  try {
    tx = await provider.getTransaction(txHash)
    receipt = await provider.getTransactionReceipt(txHash)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control') || errorMessage.includes('ERR_FAILED')) {
      provider = new ethers.JsonRpcProvider(rpcUrls.fallback)
      tx = await provider.getTransaction(txHash)
      receipt = await provider.getTransactionReceipt(txHash)
    } else {
      throw error
    }
  }

  if (!tx || !receipt) {
    throw new Error('Transaction not found on selected network')
  }

  const agendaManagerInterface = new ethers.Interface(AGENDA_CREATED_EVENT_ABI)
  let agendaCreatedEvent = null

  for (const log of receipt.logs) {
    try {
      const parsed = agendaManagerInterface.parseLog({
        topics: log.topics as string[],
        data: log.data
      })
      
      if (parsed && parsed.name === 'AgendaCreated') {
        agendaCreatedEvent = {
          from: parsed.args[0],
          id: parsed.args[1],
          targets: parsed.args[2],
          noticePeriodSeconds: parsed.args[3],
          votingPeriodSeconds: parsed.args[4],
          atomicExecute: parsed.args[5]
        }
        break
      }
    } catch {
      continue
    }
  }

  if (!agendaCreatedEvent) {
    throw new Error('This transaction does not contain an agenda creation event')
  }

  let memoUrl: string | undefined
  let calldatas: string[] = []

  try {
    const approveAndCallInterface = new ethers.Interface(TON_APPROVE_AND_CALL_ABI)
    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: tx.data })
    
    if (decodedApproveAndCall && decodedApproveAndCall.name === 'approveAndCall') {
      const createAgendaData = decodedApproveAndCall.args[2]
      
      try {
        const decoded6 = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]', 'string'],
          createAgendaData
        )
        memoUrl = decoded6[5] || undefined
        calldatas = decoded6[4] || []
      } catch {
        try {
          const decoded5 = ethers.AbiCoder.defaultAbiCoder().decode(
            ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]'],
            createAgendaData
          )
          calldatas = decoded5[4] || []
        } catch (error) {
          console.error('Failed to decode createAgenda data:', error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse memo URL:', error)
  }

  return {
    agendaId: Number(agendaCreatedEvent.id),
    txHash,
    from: agendaCreatedEvent.from,
    network: chainId === 1 ? 'mainnet' : 'sepolia',
    targets: agendaCreatedEvent.targets,
    noticePeriodSeconds: agendaCreatedEvent.noticePeriodSeconds,
    votingPeriodSeconds: agendaCreatedEvent.votingPeriodSeconds,
    atomicExecute: agendaCreatedEvent.atomicExecute,
    memoUrl,
    calldatas
  }
}

export const parseMemoFromCalldata = (input: string): string | undefined => {
  try {
    const approveAndCallInterface = new ethers.Interface([
      'function approveAndCall(address spender, uint256 amount, bytes calldata data)'
    ])

    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: input })
    if (!decodedApproveAndCall) {
      return undefined
    }

    const createAgendaData = decodedApproveAndCall.args[2]

    const targetsOffset = parseInt(createAgendaData.slice(0, 64), 16)
    const targetsLength = parseInt(createAgendaData.slice(targetsOffset * 2, targetsOffset * 2 + 64), 16)

    const fixedParamsSize = 6 * 32
    const targetsArraySize = 32 + (targetsLength * 32)
    const calldataArraySize = 32 + (targetsLength * 32)
    const stringSize = 32 + 32

    const expectedTotalSize6 = fixedParamsSize + targetsArraySize + calldataArraySize + stringSize
    const expectedTotalSize5 = fixedParamsSize + targetsArraySize + calldataArraySize - 32

    const actualSize = createAgendaData.length / 2
    const is6Params = Math.abs(actualSize - expectedTotalSize6) < Math.abs(actualSize - expectedTotalSize5)

    if (is6Params) {
      const decoded6 = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]', 'string'],
        createAgendaData
      )
      return decoded6[5]
    }

    return undefined
  } catch {
    return undefined
  }
}