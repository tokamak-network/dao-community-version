import { multicall3Abi, Call3, Result } from '@/abis/multicall3';
import { MULTICALL3_ADDRESS } from '@/config/contracts';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { queueRPCRequest } from './shared-rpc-client';

/**
 * Multicall3 Utility Functions
 * Helps batch multiple contract calls into a single transaction
 */

// Contract call interface for viem's native multicall
export interface ContractCall {
  address: `0x${string}`;
  abi: readonly any[] | any[];
  functionName: string;
  args?: any[];
}

/**
 * Execute multiple contract calls using viem's native multicall (더 효율적)
 * @param publicClient - Viem public client
 * @param contracts - Array of contract call objects
 * @param allowFailure - Whether to allow individual calls to fail (default: true)
 * @param description - Description for worker queue
 * @param priority - Priority level for worker queue
 * @returns Array of results
 */
export async function executeViemMulticall<T = any>(
  publicClient: any,
  contracts: ContractCall[],
  allowFailure: boolean = true,
  description: string = 'Viem multicall batch',
  priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
): Promise<T[]> {
  try {

    const results = await queueRPCRequest(
      () => publicClient.multicall({
        contracts,
        allowFailure,
        multicallAddress: MULTICALL3_ADDRESS as `0x${string}`, // 직접 multicall3 주소 지정
      }) as Promise<T[]>,
      `${description} (${contracts.length} calls)`,
      priority
    );

    return results;
  } catch (error) {
    console.error('❌ Viem Multicall execution failed:', error);
    throw error;
  }
}

/**
 * Create a Call3 struct for Multicall3 (기존 방식 - 호환성을 위해 유지)
 * @param target - Target contract address
 * @param functionName - Function name to call
 * @param args - Function arguments
 * @param abi - Contract ABI
 * @param allowFailure - Whether to allow this call to fail
 */
export function createCall3(
  target: string,
  functionName: string,
  args: any[],
  abi: any[],
  allowFailure: boolean = true
): Call3 {
  const callData = encodeFunctionData({
    abi,
    functionName,
    args,
  });

  return {
    target,
    allowFailure,
    callData,
  };
}

/**
 * Execute multiple contract calls using Multicall3 with worker management (기존 방식)
 * @param publicClient - Viem public client
 * @param calls - Array of Call3 structs
 * @param description - Description for worker queue (default: 'Multicall3 batch')
 * @param priority - Priority level for worker queue (default: 'HIGH')
 * @returns Array of results
 */
export async function executeMulticall3(
  publicClient: any,
  calls: Call3[],
  description: string = 'Multicall3 batch',
  priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
): Promise<Result[]> {
  try {
    // console.log(`🔄 [Multicall3] Queuing batch with ${calls.length} calls (${priority} priority)`);

    const results = await queueRPCRequest(
      () => publicClient.readContract({
        address: MULTICALL3_ADDRESS as `0x${string}`,
        abi: multicall3Abi,
        functionName: 'aggregate3',
        args: [calls],
      }) as Promise<Result[]>,
      `${description} (${calls.length} calls)`,
      priority
    );

    // console.log(`✅ [Multicall3] Batch completed successfully`);
    return results;
  } catch (error) {
    console.error('❌ Multicall3 execution failed:', error);
    throw error;
  }
}

/**
 * Decode function result from multicall return data
 * @param returnData - Raw return data from multicall
 * @param abi - Contract ABI
 * @param functionName - Function name that was called
 * @returns Decoded result
 */
export function decodeMulticallResult(
  returnData: string,
  abi: any[],
  functionName: string
): any {
  try {
    return decodeFunctionResult({
      abi,
      functionName,
      data: returnData as `0x${string}`,
    });
  } catch (error) {
    console.error(`❌ Failed to decode result for ${functionName}:`, error);
    return null;
  }
}
