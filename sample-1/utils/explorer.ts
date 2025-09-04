/**
 * 블록체인 익스플로러 관련 유틸리티 함수들
 */

export type ExplorerType = 'address' | 'tx' | 'block';

/**
 * 체인 ID에 따른 익스플로러 베이스 URL을 반환합니다
 */
export function getExplorerBaseUrl(chainId: number): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return 'https://etherscan.io';
    case 11155111: // Sepolia Testnet
      return 'https://sepolia.etherscan.io';
    case 5: // Goerli Testnet (deprecated but still might be used)
      return 'https://goerli.etherscan.io';
    case 17000: // Holesky Testnet
      return 'https://holesky.etherscan.io';
    case 137: // Polygon Mainnet
      return 'https://polygonscan.com';
    case 80001: // Mumbai Testnet
      return 'https://mumbai.polygonscan.com';
    case 42161: // Arbitrum One
      return 'https://arbiscan.io';
    case 421613: // Arbitrum Goerli
      return 'https://goerli.arbiscan.io';
    case 10: // Optimism
      return 'https://optimistic.etherscan.io';
    case 420: // Optimism Goerli
      return 'https://goerli-optimism.etherscan.io';
    default:
      // 기본값으로 메인넷 사용
      return 'https://etherscan.io';
  }
}

/**
 * 주소에 대한 익스플로러 URL을 생성합니다
 */
export function getExplorerUrl(address: string, chainId: number): string {
  const baseUrl = getExplorerBaseUrl(chainId);
  return `${baseUrl}/address/${address}`;
}

/**
 * 트랜잭션 해시에 대한 익스플로러 URL을 생성합니다
 */
export function getTransactionUrl(txHash: string, chainId: number): string {
  const baseUrl = getExplorerBaseUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * 블록 번호에 대한 익스플로러 URL을 생성합니다
 */
export function getBlockUrl(blockNumber: number | string, chainId: number): string {
  const baseUrl = getExplorerBaseUrl(chainId);
  return `${baseUrl}/block/${blockNumber}`;
}

/**
 * 토큰 컨트랙트에 대한 익스플로러 URL을 생성합니다
 */
export function getTokenUrl(tokenAddress: string, chainId: number): string {
  const baseUrl = getExplorerBaseUrl(chainId);
  return `${baseUrl}/token/${tokenAddress}`;
}

/**
 * 체인 이름을 반환합니다
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 5:
      return 'Goerli Testnet';
    case 17000:
      return 'Holesky Testnet';
    case 137:
      return 'Polygon Mainnet';
    case 80001:
      return 'Mumbai Testnet';
    case 42161:
      return 'Arbitrum One';
    case 421613:
      return 'Arbitrum Goerli';
    case 10:
      return 'Optimism';
    case 420:
      return 'Optimism Goerli';
    default:
      return 'Unknown Network';
  }
}

/**
 * 주소를 현재 체인의 익스플로러에서 새창으로 엽니다 (환경 변수 기반)
 */
export function openEtherscan(userAddress: string): void {
  const explorerUrl =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://etherscan.io";
  window.open(`${explorerUrl}/address/${userAddress}`, "_blank");
}

/**
 * 주소를 체인 ID 기반 익스플로러에서 새창으로 엽니다
 */
export function openExplorerByChain(address: string, chainId: number): void {
  const url = getExplorerUrl(address, chainId);
  window.open(url, '_blank');
}