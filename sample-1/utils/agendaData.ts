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

  console.log("prepareAgenda", actions);

  const targets = actions.map((action) => action.contractAddress);
  const calldata = actions.map((action) => action.calldata);

  console.log("targets", targets);
  console.log("calldata", calldata);

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
    console.log("✅ Contract version() function found, version:", version);

    // Version 2.0.0 and above support memo field
    if (version === "2.0.0") {
      supportsMemoField = true;
      console.log("✅ Version 2.0.0 detected - memo field supported");
    } else {
      console.log(
        "⚠️ Version",
        version,
        "detected - memo field not supported"
      );
    }
  } catch (error) {
    contractVersion = "legacy (pre-2.0.0)";
    console.log(
      "❌ version() function not found or error occurred - assuming legacy version"
    );
    console.log("Error details:", error);
    supportsMemoField = false;
  }

  console.log("📋 Contract Version Summary:");
  console.log("  - Contract Address:", daoCommitteeProxyAddress);
  console.log("  - Detected Version:", contractVersion);
  console.log("  - Memo Field Support:", supportsMemoField ? "YES" : "NO");
  console.log(
    "  - Interface Type:",
    supportsMemoField ? "New (with memo)" : "Legacy (without memo)"
  );

  // Determine memo field - prioritize snapshot URL, then discourse URL
  const memoField = snapshotUrl?.trim() || discourseUrl?.trim() || "";

  let param: `0x${string}`;

  if (supportsMemoField) {
    // New version with memo field support
    console.log("Using new interface with memo field");
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
    console.log("Using legacy interface without memo field");
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