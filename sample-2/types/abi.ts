export interface AbiInput {
  name: string;
  type: string;
  internalType: string;
}

export interface AbiOutput {
  name: string;
  type: string;
  internalType: string;
}

export interface AbiItem {
  name: string;
  type: string;
  inputs: AbiInput[];
  outputs: AbiOutput[];
  stateMutability: string;
  constant?: boolean;
  payable?: boolean;
}

export type Abi = AbiItem[];
