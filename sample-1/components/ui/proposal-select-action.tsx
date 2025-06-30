"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, validateParameterType, getParameterTypeErrorMessage, normalizeParameterValue } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ethers,
  isAddress,
  parseUnits,
  Interface,
  JsonRpcProvider,
} from "ethers";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItem1,
} from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  predefinedMethods,
  PredefinedMethod,
} from "@/config/predefined-methods";
import { findMethodAbi } from "@/lib/utils";

// Action 타입 정의 (ProposalForm.tsx와 일치해야 함)
interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
}

interface ProposalSelectActionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onAddAction: (action: Omit<Action, "id">) => void;
}

function RequiredContractAddress({
  value,
  setAbiProxy,
  setAbiLogic,
  onErrorChange,
}: {
  value: string;
  setAbiProxy: React.Dispatch<React.SetStateAction<any[]>>;
  setAbiLogic: React.Dispatch<React.SetStateAction<any[]>>;
  onErrorChange?: (hasError: boolean) => void;
}) {
  const [isContractFound, setIsContractFound] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);

  useEffect(() => {
    const checkContract = async () => {
      if (!value || value.length === 0) {
        setIsContractFound(null);
        setAbiProxy([]);
        setAbiLogic([]);
        setError(null);
        setIsValidAddress(true);
        onErrorChange?.(false);
        return;
      }

      // Check if address format is valid
      if (!isAddress(value)) {
        setIsValidAddress(false);
        setError("Enter the target contract address");
        setIsContractFound(false);
        setAbiProxy([]);
        setAbiLogic([]);
        onErrorChange?.(true);
        return;
      }

      setIsValidAddress(true);

      try {
        const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
        if (!apiKey) {
          console.error("Etherscan API key is not configured");
          setError(
            "Etherscan API key is not configured. Please check your environment variables."
          );
          setIsContractFound(false);
          setAbiProxy([]);
          setAbiLogic([]);
          return;
        }

        // Use environment variable for Etherscan API URL, fallback to mainnet
        const apiUrl =
          process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ||
          "https://api.etherscan.io/api";

        // Get proxy ABI
        const proxyUrl = `${apiUrl}?module=contract&action=getabi&address=${value}&apikey=${apiKey}`;
        console.log("Fetching ABI from:", proxyUrl);

        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`HTTP error! status: ${proxyResponse.status}`);
        }

        const proxyData = await proxyResponse.json();
        console.log("Proxy ABI response:", proxyData);

        if (proxyData.status === "1") {
          setIsContractFound(true);
          setError(null);
          onErrorChange?.(false);
          const proxyAbi = JSON.parse(proxyData.result);
          // Filter only function and view types
          const filteredProxyAbi = proxyAbi.filter(
            (item: any) =>
              item.type === "function" && item.stateMutability != "view"
          );
          setAbiProxy(filteredProxyAbi);

          // Check for different proxy patterns
          const implementationFunction = proxyAbi.find(
            (item: any) =>
              item.type === "function" &&
              item.name === "implementation" &&
              item.inputs.length === 0
          );

          const getImplementationFunction = proxyAbi.find(
            (item: any) =>
              item.type === "function" &&
              item.name === "getImplementation" &&
              item.inputs.length === 0
          );

          const logicFunction = proxyAbi.find(
            (item: any) =>
              item.type === "function" &&
              item.name === "logic" &&
              item.inputs.length === 0
          );

          let implementationAddress = null;
          // Use the same RPC URL as the main app
          const { getCurrentChain } = await import("../../config/contracts");
          const currentChain = getCurrentChain();
          const rpcUrl = currentChain.rpcUrls.default.http[0];
          const provider = new JsonRpcProvider(rpcUrl);
          const contract = new ethers.Contract(value, proxyAbi, provider);

          try {
            if (implementationFunction) {
              console.log("Trying implementation() function...");
              implementationAddress = await contract.implementation();
            } else if (getImplementationFunction) {
              console.log("Trying getImplementation() function...");
              implementationAddress = await contract.getImplementation();
            } else if (logicFunction) {
              console.log("Trying logic() function...");
              implementationAddress = await contract.logic();
            } else {
              // Try to get implementation address from storage slot (EIP-1967)
              console.log("Trying EIP-1967 storage slot...");
              const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
              const storageValue = await provider.getStorage(value, implementationSlot);
              if (storageValue && storageValue !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
                implementationAddress = "0x" + storageValue.slice(-40);
              }
            }

            if (implementationAddress && implementationAddress !== "0x0000000000000000000000000000000000000000") {
              console.log("Implementation address:", implementationAddress);

              // Get implementation ABI
              const logicUrl = `${apiUrl}?module=contract&action=getabi&address=${implementationAddress}&apikey=${apiKey}`;
              console.log("Fetching implementation ABI from:", logicUrl);

              const logicResponse = await fetch(logicUrl);
              if (!logicResponse.ok) {
                throw new Error(`HTTP error! status: ${logicResponse.status}`);
              }

              const logicData = await logicResponse.json();
              console.log("Logic ABI response:", logicData);

              if (logicData.status === "1") {
                const logicAbi = JSON.parse(logicData.result);
                // Filter only function and view types
                const filteredLogicAbi = logicAbi.filter(
                  (item: any) =>
                    item.type === "function" && item.stateMutability != "view"
                );
                setAbiLogic(filteredLogicAbi);
              } else {
                console.log("No logic ABI found");
                setAbiLogic([]);
              }
            } else {
              console.log("No implementation address found");
              setAbiLogic([]);
            }
          } catch (error) {
            console.error("Error getting implementation:", error);
            setAbiLogic([]);
          }
        } else {
          console.log("No proxy ABI found");
          const errorMessage =
            proxyData.message || "Failed to fetch contract ABI";
          const errorResult = proxyData.result ? ` - ${proxyData.result}` : "";
          setError(`${errorMessage}, ${errorResult}`);
          setIsContractFound(false);
          setAbiProxy([]);
          setAbiLogic([]);
          onErrorChange?.(true);
        }
      } catch (error) {
        console.error("Error checking contract:", error);
        setError("Failed to check contract. Please try again.");
        setIsContractFound(false);
        setAbiProxy([]);
        setAbiLogic([]);
        onErrorChange?.(true);
      }
    };

    checkContract();
  }, [value, setAbiProxy, setAbiLogic]);

  if (error) {
    return (
      <div className="flex items-start mt-2 text-sm text-red-500">
        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (isContractFound === null || !isContractFound) {
    return (
      <div className="flex items-start mt-2 text-sm text-red-500">
        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <p>
          Contract not found on Etherscan. Select an ABI or import a JSON file
          containing your ABI.
        </p>
      </div>
    );
  } else {
    return (
      <div className="flex items-center mt-2 text-sm text-gray-600">
        <svg
          className="w-4 h-4 text-green-500 mr-2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 4L12 14.01L9 11.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Verified Contract found on Etherscan. ABI automatically imported.
      </div>
    );
  }
}

interface CalldataComponentProps {
  abi: any[];
  selectedFunction: string;
  initialParams?: { [key: string]: string };
  onCalldataChange: (calldata: string) => void;
  isEditMode?: boolean;
}

function CalldataComponent({
  abi,
  selectedFunction,
  initialParams,
  onCalldataChange,
  isEditMode,
}: CalldataComponentProps) {
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>({});
  const [paramErrors, setParamErrors] = useState<{ [key: string]: string }>({});
  const [internalCalldata, setInternalCalldata] = useState<string>("");

  useEffect(() => {
    console.log("CalldataComponent mounted/updated:", {
      selectedFunction,
      initialParams,
      isEditMode,
    });

    const func = abi.find((item: any) => {
      if (!item || !item.inputs) return false;
      const paramTypes = item.inputs.map((input: any) => input.type).join(",");
      return `${item.name}(${paramTypes})` === selectedFunction;
    });

    if (func) {
      console.log("Found function:", func);
      const initialP: { [key: string]: string } = {};
      if (initialParams) {
        func.inputs.forEach((input: any) => {
          if (initialParams[input.name] !== undefined) {
            initialP[input.name] = String(initialParams[input.name]);
          }
        });
      }
      console.log("Initial parameters:", initialP);
      setParamValues(initialP);
      setParamErrors({});

      if (
        isEditMode &&
        initialParams &&
        Object.keys(initialParams).length > 0 &&
        func.inputs.every((input: any) => initialP[input.name] !== undefined)
      ) {
        generateCalldata(initialP, func);
      } else if (func.inputs.length === 0) {
        generateCalldata({}, func);
      } else {
        setInternalCalldata("");
        onCalldataChange("");
      }
    } else {
      console.log("Function not found");
      setParamValues({});
      setParamErrors({});
      setInternalCalldata("");
      onCalldataChange("");
    }
  }, [
    selectedFunction,
    abi,
    JSON.stringify(initialParams),
    isEditMode,
    onCalldataChange,
  ]);

  const generateCalldata = (
    currentParamValues: { [key: string]: string },
    func: any
  ) => {
    try {
      console.log("Generating calldata with values:", currentParamValues);
      const paramValuesArray = func.inputs.map((input: any) => {
        const val = currentParamValues[input.name];
        console.log(`Processing parameter ${input.name}:`, {
          type: input.type,
          value: val,
        });

        if (input.type === "address") return val ? normalizeParameterValue(val, input.type) : val;
        if (input.type.startsWith("uint")) return parseUnits(val || "0", 0);
        if (input.type === "bool") {
          console.log(`Boolean parameter ${input.name}:`, {
            value: val,
            converted: val === "true",
          });
          return val === "true";
        }
        return val;
      });
      console.log("Final parameter array:", paramValuesArray);

      const iface = new Interface([func]);
      const newCalldata = iface.encodeFunctionData(func.name, paramValuesArray);
      console.log("Generated calldata:", newCalldata);

      setInternalCalldata(newCalldata);
      onCalldataChange(newCalldata);
    } catch (error) {
      console.error("Error creating calldata:", error);
      setInternalCalldata("");
      onCalldataChange("");
    }
  };

  const handleParamChange = (
    paramName: string,
    value: string,
    type: string
  ) => {
    console.log("handleParamChange called with:", { paramName, value, type });
    const newValues = { ...paramValues, [paramName]: value };
    setParamValues(newValues);

    const isValid = validateParameterType(value, type);
    const newErrors = { ...paramErrors };
    if (!isValid && value.length > 0) {
      newErrors[paramName] = getParameterTypeErrorMessage(type);
    } else {
      delete newErrors[paramName];
    }
    setParamErrors(newErrors);

    const func = abi.find((item: any) => {
      if (!item || !item.inputs) return false;
      const paramTypes = item.inputs.map((input: any) => input.type).join(",");
      return `${item.name}(${paramTypes})` === selectedFunction;
    });

    if (func && func.inputs.length > 0) {
      const allParamsFilledAndValid = func.inputs.every((input: any) => {
        const val = newValues[input.name];
        const isValid = validateParameterType(val, input.type);
        console.log(`Validating parameter ${input.name}:`, {
          value: val,
          type: input.type,
          isValid,
        });
        return val !== undefined && isValid;
      });

      console.log("All parameters filled and valid:", allParamsFilledAndValid);
      if (allParamsFilledAndValid) {
        generateCalldata(newValues, func);
      } else {
        setInternalCalldata("");
        onCalldataChange("");
      }
    }
  };



  const selectedFunc = abi.find((item: any) => {
    if (!item || !item.inputs) return false;
    const paramTypes = item.inputs.map((input: any) => input.type).join(",");
    return `${item.name}(${paramTypes})` === selectedFunction;
  });

  if (!selectedFunc) return null;

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Calldata</h3>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-900">Function:</span>{" "}
          <span className="font-medium text-blue-600">
            {selectedFunc.name}
          </span>
          {selectedFunc.inputs.length > 0 && (
            <span className="text-gray-500 ml-1">
              (
              {selectedFunc.inputs
                .map((input: any) => (
                  <span key={input.name} className="text-gray-600">
                    <span className="text-blue-600">{input.name}</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-gray-600">{input.type}</span>
                  </span>
                ))
                .reduce(
                  (
                    prev: React.ReactNode,
                    curr: React.ReactNode,
                    index: number
                  ) => (index === 0 ? [curr] : [prev, ", ", curr]),
                  []
                )}
              )
            </span>
          )}
        </p>
      </div>
      {selectedFunc.inputs.length > 0 && (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden border-separate border-spacing-y-1">
          <tbody>
            {selectedFunc.inputs.map((input: any, index: number) => (
              <tr key={index}>
                <td className="bg-blue-50 p-2 text-sm font-medium text-gray-900 border-r border-gray-200 text-center w-1/4">
                  {input.name} ({input.type})
                </td>
                <td className="p-2 w-3/4">
                  {input.type === "bool" ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={paramValues[input.name] === "true"}
                        onCheckedChange={(checked) => {
                          console.log("Switch changed:", {
                            name: input.name,
                            checked,
                          });
                          const newValue = checked ? "true" : "false";
                          console.log("Setting new value:", newValue);
                          handleParamChange(input.name, newValue, input.type);
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {paramValues[input.name] === "true" ? "True" : "False"}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Input
                        type="text"
                        placeholder={`Enter ${input.type}`}
                        value={paramValues[input.name] || ""}
                        onChange={(e) => {
                          console.log("Input changed:", {
                            name: input.name,
                            value: e.target.value,
                          });
                          handleParamChange(input.name, e.target.value, input.type);
                        }}
                        className={`w-full border-gray-300 ${
                          paramErrors[input.name]
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />
                      {paramErrors[input.name] && (
                        <p className="text-sm text-red-500">
                          {paramErrors[input.name]}
                        </p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {internalCalldata && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Generated Calldata
          </label>
          <div className="bg-gray-50 p-3 rounded-md">
            <code className="text-sm break-all">{internalCalldata}</code>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionCardProps {
  title: string;
  contractAddress: string;
  method: string;
  calldata: string;
  onRemove: () => void;
}

function ActionCard({
  title,
  contractAddress,
  method,
  calldata,
  onRemove,
}: ActionCardProps) {
  const [decodedParams, setDecodedParams] = useState<string>("");

  useEffect(() => {
    try {
      console.log("Decoding calldata:", { method, calldata });

      // Extract function name and parameter types from method string
      const match = method.match(/(.+)\((.*)\)/);
      if (!match) {
        console.error("Invalid method format:", method);
        setDecodedParams("Invalid method format");
        return;
      }

      const [_, funcName, paramTypes] = match;
      console.log("Parsed method:", { funcName, paramTypes });

      const types = paramTypes.split(",").map((t) => t.trim());
      console.log("Parameter types:", types);

      // Create a minimal ABI for decoding
      const minimalAbi = [
        {
          name: funcName,
          type: "function",
          inputs: types.map((type, index) => ({
            name: `param${index}`,
            type: type,
          })),
        },
      ];
      console.log("Created minimal ABI:", minimalAbi);

      const iface = new Interface(minimalAbi);
      const decoded = iface.parseTransaction({ data: calldata });
      console.log("Decoded transaction:", decoded);

      if (decoded) {
        const formattedParams = decoded.args
          .map((arg: any, index: number) => {
            const type = types[index];
            let value = arg.toString();

            // Format based on type
            if (type === "bool") {
              value = arg ? "true" : "false";
            } else if (type.startsWith("uint") || type.startsWith("int")) {
              value = arg.toString();
            } else if (type === "address") {
              value = arg;
            } else if (type.startsWith("bytes")) {
              value = arg;
            }

            console.log(`Formatted parameter ${index}:`, { type, value });
            return `${type}: ${value}`;
          })
          .join(", ");

        console.log("Final formatted parameters:", formattedParams);
        setDecodedParams(formattedParams);
      } else {
        console.error("Failed to decode transaction");
        setDecodedParams("Failed to decode parameters");
      }
    } catch (error) {
      console.error("Error decoding calldata:", error);
      setDecodedParams("Error decoding parameters");
    }
  }, [method, calldata]);

  return (
    <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-500 hover:text-gray-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex">
          <span className="w-24 text-gray-500">Contract:</span>
          <span className="text-gray-900 font-mono">{contractAddress}</span>
        </div>
        <div className="flex">
          <span className="w-24 text-gray-500">Method:</span>
          <span className="text-gray-900 font-mono">{method}</span>
        </div>
        <div className="flex flex-col">
          <span className="w-24 text-gray-500 mb-1">Parameters:</span>
          <span className="text-gray-900 font-mono break-all pl-6">
            {decodedParams}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="w-24 text-gray-500 mb-1">Calldata:</span>
          <span className="text-gray-900 font-mono break-all pl-6">
            {calldata}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProposalSelectAction({
  className,
  onAddAction,
  ...props
}: ProposalSelectActionProps) {
  const [contractAddress, setContractAddress] = useState("");
  const [method, setMethod] = useState("");
  const [selectedProxyMethod, setSelectedProxyMethod] = useState("");
  const [selectedLogicMethod, setSelectedLogicMethod] = useState("");
  const [selectedMethodType, setSelectedMethodType] = useState("proxy");
  const [calldata, setCalldata] = useState("");
  const [sendEth, setSendEth] = useState(false);
  const [abiProxy, setAbiProxy] = useState<any[]>([]);
  const [abiLogic, setAbiLogic] = useState<any[]>([]);
  const [selectedPredefinedMethod, setSelectedPredefinedMethod] =
    useState<PredefinedMethod | null>(null);
  const [customAbi, setCustomAbi] = useState<any[]>([]);
  const [selectedCustomMethod, setSelectedCustomMethod] = useState("");
  const [hasAddressError, setHasAddressError] = useState(false);

  const handleAddAction = () => {
    // Determine the current ABI based on selectedMethodType
    let currentAbi: any[] = [];
    if (selectedMethodType === "proxy") {
      currentAbi = abiProxy;
    } else if (selectedMethodType === "logic") {
      currentAbi = abiLogic;
    } else if (
      selectedMethodType === "predefined" &&
      selectedPredefinedMethod
    ) {
      currentAbi = selectedPredefinedMethod.abi;
    } else if (selectedMethodType === "custom") {
      currentAbi = customAbi;
    }

    if (contractAddress && method && calldata) {
      const newActionData = {
        title: method, // Use method name as title
        contractAddress,
        method,
        calldata,
        abi: [findMethodAbi(currentAbi, method)],
        sendEth,
      };
      onAddAction(newActionData);

      // Reset form
      setContractAddress("");
      setMethod("");
      setCalldata(""); // CalldataComponent 내부에서 이미 onCalldataChange("")로 초기화될 수 있음
      setSendEth(false);
      setAbiProxy([]);
      setAbiLogic([]);
      setSelectedPredefinedMethod(null);
      setCustomAbi([]);
      setSelectedProxyMethod(""); // Select 값들도 초기화
      setSelectedLogicMethod("");
      setSelectedCustomMethod("");
      setSelectedMethodType("proxy");
    }
  };

  return (
    <div
      className={cn("md:col-span-2 bg-white p-4 rounded-md", className)}
      {...props}
    >

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Target contract address
          </label>
          <Input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter the target contract address"
            className={`${hasAddressError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          <RequiredContractAddress
            value={contractAddress}
            setAbiProxy={setAbiProxy}
            setAbiLogic={setAbiLogic}
            onErrorChange={setHasAddressError}
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Contract method
          </label>
          <RadioGroup
            defaultValue={selectedMethodType}
            value={selectedMethodType}
            onValueChange={(value) => {
              setSelectedMethodType(value);
              if (value === "proxy") {
                setSelectedProxyMethod("");
              }
            }}
            className="space-y-2"
          >
            {abiProxy.length > 0 && (
              <div className="relative">
                <RadioGroupItem1
                  value="proxy"
                  id="proxy"
                  className="peer sr-only"
                  selectedMethodType={selectedMethodType}
                  text={
                    abiLogic.length === 0
                      ? "Select from contract"
                      : "Select from Proxy contract"
                  }
                />
              </div>
            )}
            {abiLogic.length > 0 && (
              <div className="relative">
                <RadioGroupItem1
                  value="logic"
                  id="logic"
                  className="peer sr-only"
                  selectedMethodType={selectedMethodType}
                  text="Select from Logic contract"
                />
              </div>
            )}
            <div className="relative">
              <RadioGroupItem
                value="predefined"
                id="predefined"
                className="peer sr-only"
              />
              <label
                htmlFor="predefined"
                className={`flex flex-col p-2 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethodType === "predefined"
                    ? "border-gray-400"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-4 h-4 border-2 rounded-full mr-2 flex items-center justify-center ${
                      selectedMethodType === "predefined"
                        ? "border-gray-400"
                        : "border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full bg-gray-600 transition-transform duration-200 ${
                        selectedMethodType === "predefined"
                          ? "scale-100"
                          : "scale-0"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-900">
                    Select from predefined methods
                  </span>
                </div>
                {selectedMethodType === "predefined" && (
                  <div className="mt-2 ml-6">
                    <Select
                      onValueChange={(value: string) => {
                        const selectedMethod = predefinedMethods.find(
                          (method) => method.id === value
                        );
                        if (selectedMethod) {
                          setSelectedPredefinedMethod(selectedMethod);
                          setSelectedProxyMethod("");
                          setMethod("");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm">
                        <SelectValue placeholder="Select from predefined methods..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {predefinedMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{method.name}</span>
                              {method.description && (
                                <span className="text-gray-500">
                                  - {method.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </label>
            </div>
            <div className="relative">
              <RadioGroupItem
                value="custom"
                id="custom"
                className="peer sr-only"
              />
              <label
                htmlFor="custom"
                className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethodType === "custom"
                    ? "border-gray-600"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 border-2 rounded-full mr-2 flex items-center justify-center ${
                    selectedMethodType === "custom" ? "border-gray-600" : "border-gray-300"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full bg-gray-600 transition-transform duration-200 ${
                      selectedMethodType === "custom" ? "scale-100" : "scale-0"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-900">Upload custom ABI</span>
              </label>
            </div>
          </RadioGroup>

          {selectedMethodType === "proxy" && abiProxy.length > 0 && (
            <div className="mt-4">
              <p className="block text-lg font-semibold text-gray-900 mb-4">
                Select a function to execute
              </p>
              <Select
                value={selectedProxyMethod}
                onValueChange={(value: string) => {
                  setSelectedProxyMethod(value);
                  setMethod(value);
                }}
                defaultValue=""
              >
                <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm">
                  <SelectValue placeholder="Select the contract method..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {abiProxy.map((func: any) => {
                    const paramTypes = func.inputs
                      .map((input: any) => input.type)
                      .join(",");
                    const selector = `${func.name}(${paramTypes})`;
                    return (
                      <SelectItem key={selector} value={selector}>
                        {selector}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedProxyMethod && (
                <CalldataComponent
                  abi={abiProxy}
                  selectedFunction={selectedProxyMethod}
                  onCalldataChange={setCalldata}
                />
              )}
            </div>
          )}

          {selectedMethodType === "logic" && abiLogic.length > 0 && (
            <div className="mt-4">
              <p className="block text-lg font-semibold text-gray-900 mb-4">
                Select a function to execute
              </p>
              <Select
                value={selectedLogicMethod}
                onValueChange={(value: string) => {
                  setSelectedLogicMethod(value);
                  setMethod(value);
                }}
                defaultValue=""
              >
                <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm">
                  <SelectValue placeholder="Select the contract method..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {abiLogic.map((func: any) => {
                    const paramTypes = func.inputs
                      .map((input: any) => input.type)
                      .join(",");
                    const selector = `${func.name}(${paramTypes})`;
                    return (
                      <SelectItem key={selector} value={selector}>
                        {selector}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedLogicMethod && (
                <CalldataComponent
                  abi={abiLogic}
                  selectedFunction={selectedLogicMethod}
                  onCalldataChange={setCalldata}
                />
              )}
            </div>
          )}

          {selectedMethodType === "predefined" && selectedPredefinedMethod && (
            <div className="mt-4">
              <p className="block text-lg font-semibold text-gray-900 mb-4">
                Select a function to execute
              </p>
              <Select
                value={selectedProxyMethod}
                onValueChange={(value: string) => {
                  setSelectedProxyMethod(value);
                  setMethod(value);
                }}
                defaultValue=""
              >
                <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm">
                  <SelectValue placeholder="Select the contract method..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {selectedPredefinedMethod.abi.map((func: any) => {
                    const paramTypes = func.inputs
                      .map((input: any) => input.type)
                      .join(",");
                    const selector = `${func.name}(${paramTypes})`;
                    return (
                      <SelectItem key={selector} value={selector}>
                        {selector}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="flex items-center mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-md">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                This ABI is a standard. Please, be sure the smart contract
                implements the method you selected.
              </div>
              {selectedProxyMethod && (
                <CalldataComponent
                  abi={selectedPredefinedMethod.abi}
                  selectedFunction={selectedProxyMethod}
                  onCalldataChange={setCalldata}
                />
              )}
            </div>
          )}

          {selectedMethodType === "custom" && (
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Enter your ABI JSON here..."
                className="min-h-[200px] font-mono text-sm border-2 border-gray-600 focus:border-gray-700 focus:ring-gray-700"
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  try {
                    const abi = JSON.parse(e.target.value);
                    const filteredAbi = abi.filter(
                      (item: any) =>
                        item.type === "function" &&
                        item.stateMutability != "view"
                    );
                    setCustomAbi(filteredAbi);
                  } catch (error) {
                    console.error("Invalid JSON:", error);
                    setCustomAbi([]);
                  }
                }}
              />
              <p className="text-sm text-gray-500">
                Enter your ABI in JSON format. Example: [&#123;"type":
                "function", "name": "transfer", "inputs": [...]&#125;]
              </p>
              {customAbi.length > 0 && (
                <div className="mt-4">
                  <p className="block text-lg font-semibold text-gray-900 mb-4">
                    Select a function to execute
                  </p>
                  <Select
                    value={selectedCustomMethod}
                    onValueChange={(value: string) => {
                      setSelectedCustomMethod(value);
                      setMethod(value);
                    }}
                  >
                    <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 shadow-sm">
                      <SelectValue placeholder="Select a function from your custom ABI..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {customAbi.map((func: any) => {
                        const paramTypes = func.inputs
                          .map((input: any) => input.type)
                          .join(",");
                        const selector = `${func.name}(${paramTypes})`;
                        return (
                          <SelectItem key={selector} value={selector}>
                            {selector}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedCustomMethod && (
                    <CalldataComponent
                      abi={customAbi}
                      selectedFunction={selectedCustomMethod}
                      onCalldataChange={setCalldata}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleAddAction}
          className={`w-full mt-4 ${
            !contractAddress || !method || !calldata
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          disabled={!contractAddress || !method || !calldata}
        >
          Add Action
        </Button>
      </div>
    </div>
  );
}
