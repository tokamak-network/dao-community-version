import { ethers } from 'ethers'
import { getContracts, AGENDA_CREATED_EVENT_ABI, TON_APPROVE_AND_CALL_ABI } from './contracts'

export interface ParsedTransaction {
  id: number
  creator: string
  targets: string[]
  calldatas: string[]
  noticePeriod: bigint
  votingPeriod: bigint
  atomicExecute: boolean
  memoUrl?: string
  network: 'mainnet' | 'sepolia'
  transactionHash: string
}

const RPC_URLS = {
  mainnet: {
    primary: 'https://eth.llamarpc.com',
    fallback: 'https://ethereum.publicnode.com'
  },
  sepolia: {
    primary: 'https://ethereum-sepolia-rpc.publicnode.com',
    fallback: 'https://rpc.sepolia.org'
  }
}

export async function parseAgendaTransaction(
  txHash: string,
  chainId: number
): Promise<ParsedTransaction> {
  const network = chainId === 1 ? 'mainnet' : 'sepolia'
  const contracts = getContracts(chainId)
  
  if (!contracts) {
    throw new Error(`Unsupported network: ${chainId}`)
  }

  let provider = new ethers.JsonRpcProvider(RPC_URLS[network].primary)
  let tx = null
  let receipt = null

  try {
    tx = await provider.getTransaction(txHash)
    receipt = await provider.getTransactionReceipt(txHash)
  } catch (error: any) {
    if (error?.message?.includes('CORS') || error?.message?.includes('Access-Control')) {
      provider = new ethers.JsonRpcProvider(RPC_URLS[network].fallback)
      tx = await provider.getTransaction(txHash)
      receipt = await provider.getTransactionReceipt(txHash)
    } else {
      throw error
    }
  }

  if (!tx || !receipt) {
    throw new Error('Transaction not found on selected network')
  }

  // Parse AgendaCreated event
  const eventInterface = new ethers.Interface(AGENDA_CREATED_EVENT_ABI)
  const agendaCreatedLog = receipt.logs.find(log => {
    try {
      const parsed = eventInterface.parseLog({
        topics: log.topics as string[],
        data: log.data
      })
      return parsed?.name === 'AgendaCreated'
    } catch {
      return false
    }
  })

  if (!agendaCreatedLog) {
    throw new Error('This transaction does not contain an agenda creation event')
  }

  const parsedEvent = eventInterface.parseLog({
    topics: agendaCreatedLog.topics as string[],
    data: agendaCreatedLog.data
  })

  if (!parsedEvent) {
    throw new Error('Failed to parse agenda event')
  }

  // Parse calldata to extract memo URL and action details
  const memoUrl = parseMemoFromCalldata(tx.data)
  const calldatas = parseCalldatasFromTransaction(tx.data)

  return {
    id: Number(parsedEvent.args[1]),
    creator: parsedEvent.args[0],
    targets: parsedEvent.args[2],
    calldatas,
    noticePeriod: parsedEvent.args[3],
    votingPeriod: parsedEvent.args[4],
    atomicExecute: parsedEvent.args[5],
    memoUrl,
    network,
    transactionHash: txHash
  }
}

function parseMemoFromCalldata(input: string): string | undefined {
  try {
    const approveAndCallInterface = new ethers.Interface(TON_APPROVE_AND_CALL_ABI)
    
    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: input })
    if (!decodedApproveAndCall) {
      return undefined
    }

    const { data: approveData } = decodedApproveAndCall.args
    const createAgendaData = approveData

    // Check if it's 6 parameter structure (with memo)
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
    } else {
      return undefined
    }
  } catch {
    return undefined
  }
}

function parseCalldatasFromTransaction(input: string): string[] {
  try {
    const approveAndCallInterface = new ethers.Interface(TON_APPROVE_AND_CALL_ABI)
    
    const decodedApproveAndCall = approveAndCallInterface.parseTransaction({ data: input })
    if (!decodedApproveAndCall) {
      return []
    }

    const { data: approveData } = decodedApproveAndCall.args
    const createAgendaData = approveData

    // Try to decode as 6 parameter structure first
    try {
      const decoded6 = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]', 'string'],
        createAgendaData
      )
      return decoded6[4]
    } catch {
      // Fall back to 5 parameter structure
      try {
        const decoded5 = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address[]', 'uint256', 'uint256', 'bool', 'bytes[]'],
          createAgendaData
        )
        return decoded5[4]
      } catch {
        return []
      }
    }
  } catch {
    return []
  }
}