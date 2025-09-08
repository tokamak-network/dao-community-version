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
  signer: any,
  message: string
): Promise<string> => {
  try {
    const signature = await signer.signMessage(message)
    return signature
  } catch (error) {
    throw new Error('Failed to generate signature')
  }
}

export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    const { ethers } = require('ethers')
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
  } catch {
    return false
  }
}