import { AgendaWithMetadata } from "@/types/agenda";

export function createAgendaSignatureMessage(
  id: string | number,
  transaction: string
): string {
  return `I am the one who submitted agenda #${id} via transaction ${transaction}. This signature proves that I am the one who submitted this agenda.`;
}

export async function signMessage(
  message: string,
  account: string
): Promise<string> {
  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, account],
    });
    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw new Error("Failed to sign message");
  }
}
