import { AgendaWithMetadata, AgendaMetadata } from "@/types/agenda";

export function createAgendaSignatureMessage(
  id: string | number,
  transaction: string,
  timestamp?: string,
  isLocalSave?: boolean
): string {
  const currentTimestamp =
    timestamp || new Date().toISOString().replace(/\.\d{3}Z$/, ".00Z");

  // 로컬 저장용 특별한 메시지
  if (isLocalSave) {
    return `I am creating an agenda metadata draft locally at ${currentTimestamp}. This signature proves that I am the creator of this agenda proposal. Draft ID: ${id}`;
  }

  // 기본 메시지 (업데이트 또는 생성)
  const action = typeof isLocalSave === 'undefined' ? "creating" : "updating";
  return `I am the one who submitted agenda #${id} via transaction ${transaction}. I am ${action} this metadata at ${currentTimestamp}. This signature proves that I am the one who submitted this agenda.`;
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

// 서명 유효성 검증 함수 (createdAt 또는 updatedAt 기준)
export function validateSignatureTimestamp(timestamp: string): boolean {
  const signatureTime = new Date(timestamp);
  const currentTime = new Date();
  const oneHourInMs = 60 * 60 * 1000; // 1시간 = 3600000ms

  return currentTime.getTime() - signatureTime.getTime() <= oneHourInMs;
}

// 서명 형식 검증 함수
export function validateSignatureFormat(signature: string): boolean {
  return signature.startsWith("0x") && signature.length === 132; // 0x + 130 hex characters
}

// 시간 형식 검증 함수 (ISO 8601 Extended Format)
export function validateTimeFormat(timestamp: string): boolean {
  // YYYY-MM-DDTHH:mm:ss.ssZ 형식 검증
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2}Z$/;
  return isoRegex.test(timestamp);
}

// Schema-based signature validation function
export function validateAgendaMetadata(agendaData: Partial<AgendaMetadata>): {
  isValid: boolean;
  error?: string;
} {
  // Required field validation
  if (!agendaData.id) {
    return { isValid: false, error: "Agenda ID is missing." };
  }

  if (!agendaData.transaction) {
    return { isValid: false, error: "Transaction hash is missing." };
  }

  if (!agendaData.creator?.signature) {
    return { isValid: false, error: "Signature is missing." };
  }

  if (!agendaData.createdAt && !agendaData.updatedAt) {
    return {
      isValid: false,
      error: "Either creation time or update time is required.",
    };
  }

  // Signature format validation
  if (!validateSignatureFormat(agendaData.creator.signature)) {
    return { isValid: false, error: "Invalid signature format." };
  }

  // Time format validation
  const timeToCheck = agendaData.updatedAt || agendaData.createdAt!;
  if (!validateTimeFormat(timeToCheck)) {
    return {
      isValid: false,
      error: "Invalid time format. Expected format: YYYY-MM-DDTHH:mm:ss.ssZ",
    };
  }

  // Timestamp validity validation (within 1 hour)
  if (!validateSignatureTimestamp(timeToCheck)) {
    return { isValid: false, error: "Signature has expired (exceeds 1 hour)." };
  }

  // Update time order validation
  if (agendaData.updatedAt && agendaData.createdAt) {
    const updatedTime = new Date(agendaData.updatedAt);
    const createdTime = new Date(agendaData.createdAt);
    if (updatedTime <= createdTime) {
      return {
        isValid: false,
        error: "Update time cannot be earlier than creation time.",
      };
    }
  }

  return { isValid: true };
}

// 이전 버전 호환용 함수 (deprecated)
export function validateAgendaSignature(agendaData: {
  id: number;
  transaction: string;
  creator?: {
    signature?: string;
    address: string;
  };
  createdAt?: string;
  updatedAt?: string;
}): { isValid: boolean; error?: string } {
  return validateAgendaMetadata(agendaData as Partial<AgendaMetadata>);
}