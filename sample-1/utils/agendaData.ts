import { ethers, isAddress, AbiCoder, BrowserProvider } from "ethers";

export interface PrepareAgendaParams {
  actions: Array<{
    id: string;
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi?: any[];
  }>;
  snapshotUrl: string;
  discourseUrl: string;
  minimumNoticePeriodSeconds: bigint;
  minimumVotingPeriodSeconds: bigint;
  daoCommitteeProxyAddress: string;
}

export interface PrepareAgendaResult {
  param: `0x${string}`;
  contractVersion: string;
  supportsMemoField: boolean;
  memoField: string;
}

export async function prepareAgenda(params: PrepareAgendaParams): Promise<PrepareAgendaResult> {
  const {
    actions,
    snapshotUrl,
    discourseUrl,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    daoCommitteeProxyAddress
  } = params;

  const targets = actions.map((action) => action.contractAddress);
  const calldata = actions.map((action) => action.calldata);

  // Validate all contract addresses
  for (const addr of targets) {
    if (!isAddress(addr)) {
      throw new Error(`Invalid contract address: ${addr}`);
    }
  }

  // Check contract version to determine if memo field is supported
  let supportsMemoField = false;
  let contractVersion = "unknown";

  try {
    const provider = new BrowserProvider(window.ethereum as any);
    const daoContract = new ethers.Contract(
      daoCommitteeProxyAddress,
      ["function version() view returns (string)"],
      provider
    );

    const version = await daoContract.version();
    contractVersion = version;

    // Version 2.0.0 and above support memo field
    if (version === "2.0.0") {
      supportsMemoField = true;
    } else {
    }
  } catch (error) {
    contractVersion = "legacy (pre-2.0.0)";
    supportsMemoField = false;
  }

  // Determine memo field - prioritize snapshot URL, then discourse URL
  const memoField = snapshotUrl?.trim() || discourseUrl?.trim() || "";

  let param: `0x${string}`;

  if (supportsMemoField) {
    // New version with memo field support
    param = AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint128", "uint128", "bool", "bytes[]", "string"],
      [
        targets,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
        true,
        calldata,
        memoField,
      ]
    ) as `0x${string}`;
  } else {
    // Legacy version without memo field
    param = AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint128", "uint128", "bool", "bytes[]"],
      [
        targets,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
        true,
        calldata,
      ]
    ) as `0x${string}`;
  }

  return {
    param,
    contractVersion,
    supportsMemoField,
    memoField,
  };
}