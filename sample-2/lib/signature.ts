import { AgendaWithMetadata, AgendaMetadata } from "@/types/agenda";

export function createAgendaSignatureMessage(
  id: string | number,
  transaction: string,
  timestamp?: string,
  isUpdate?: boolean
): string {
  const currentTimestamp =
    timestamp || new Date().toISOString().replace(/\.\d{3}Z$/, ".00Z");
  const action = isUpdate ? "updating" : "creating";

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

// 스키마 기반 서명 검증 함수
export function validateAgendaMetadata(agendaData: Partial<AgendaMetadata>): {
  isValid: boolean;
  error?: string;
} {
  // 필수 필드 체크
  if (!agendaData.id) {
    return { isValid: false, error: "Agenda ID가 없습니다." };
  }

  if (!agendaData.transaction) {
    return { isValid: false, error: "트랜잭션 해시가 없습니다." };
  }

  if (!agendaData.creator?.signature) {
    return { isValid: false, error: "서명이 없습니다." };
  }

  if (!agendaData.createdAt && !agendaData.updatedAt) {
    return {
      isValid: false,
      error: "생성 시간 또는 업데이트 시간이 없습니다.",
    };
  }

  // 서명 형식 검증
  if (!validateSignatureFormat(agendaData.creator.signature)) {
    return { isValid: false, error: "서명 형식이 올바르지 않습니다." };
  }

  // 시간 형식 검증
  const timeToCheck = agendaData.updatedAt || agendaData.createdAt!;
  if (!validateTimeFormat(timeToCheck)) {
    return {
      isValid: false,
      error: "시간 형식이 올바르지 않습니다. (YYYY-MM-DDTHH:mm:ss.ssZ)",
    };
  }

  // 타임스탬프 유효성 검증 (1시간 이내)
  if (!validateSignatureTimestamp(timeToCheck)) {
    return { isValid: false, error: "서명이 만료되었습니다. (1시간 초과)" };
  }

  // 업데이트 시간 순서 검증
  if (agendaData.updatedAt && agendaData.createdAt) {
    const updatedTime = new Date(agendaData.updatedAt);
    const createdTime = new Date(agendaData.createdAt);
    if (updatedTime <= createdTime) {
      return {
        isValid: false,
        error: "업데이트 시간이 생성 시간보다 이전입니다.",
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
