import { ethers } from 'ethers'

export interface SignatureData {
  message: string
  signature: string
  timestamp: string
}

export const createSignatureMessage = (
  agendaId: number,
  txHash: string,
  timestamp: string,
  isUpdate: boolean = false
): string => {
  const action = isUpdate ? "updating" : "creating"
  
  return `I am the one who submitted agenda #${agendaId} via transaction ${txHash}. I am ${action} this metadata at ${timestamp}. This signature proves that I am the one who submitted this agenda.`
}

export const generateSignature = async (
  signer: ethers.Signer,
  message: string
): Promise<string> => {
  try {
    const signature = await signer.signMessage(message)
    return signature
  } catch (error) {
    throw new Error(`Failed to generate signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
  } catch {
    return false
  }
}

export const validateTimestamp = (timestamp: string): boolean => {
  try {
    const createdTime = new Date(timestamp).getTime()
    const currentTime = Date.now()
    const oneHour = 60 * 60 * 1000
    
    return currentTime - createdTime <= oneHour
  } catch {
    return false
  }
}