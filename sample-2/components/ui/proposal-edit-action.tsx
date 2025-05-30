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
import { cn } from "@/lib/utils";
import {
  ethers,
  isAddress,
  parseUnits,
  Interface,
  JsonRpcProvider,
} from "ethers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Abi } from "@/types/abi";

// Action 타입 정의 (ProposalFormState와 일치해야 함)
interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
}

interface ProposalEditActionProps extends React.HTMLAttributes<HTMLDivElement> {
  actionToEdit: Action;
  onSaveChanges: (updatedAction: Action) => void;
  onCancel: () => void;
  onRemoveAction: (actionId: string) => void;
  actionNumber: number;
}

interface CalldataComponentProps {
  abi: Abi;
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
    const func = abi.find((item: any) => {
      if (!item || !item.inputs) return false;
      const paramTypes = item.inputs.map((input: any) => input.type).join(",");
      return `${item.name}(${paramTypes})` === selectedFunction;
    });

    if (func) {
      const initialP: { [key: string]: string } = {};
      if (initialParams) {
        func.inputs.forEach((input: any) => {
          if (initialParams[input.name] !== undefined) {
            // Convert boolean values to string "true"/"false"
            if (input.type === "bool") {
              const value = initialParams[input.name];
              initialP[input.name] =
                String(value).toLowerCase() === "true" ? "true" : "false";
            } else {
              initialP[input.name] = String(initialParams[input.name]);
            }
          }
        });
      }
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

        if (input.type === "address") return val;
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

  const validateType = (value: string, type: string): boolean => {
    try {
      if (!value && type !== "bool") return false;
      if (type === "address") {
        return isAddress(value);
      } else if (type.startsWith("uint") || type.startsWith("int")) {
        const num = BigInt(value);
        if (type.startsWith("uint") && num < BigInt(0)) return false;
        return true;
      } else if (type === "bool") {
        return value === "true" || value === "false";
      } else if (type === "bytes" || type.startsWith("bytes")) {
        return /^0x[0-9a-fA-F]*$/.test(value);
      }
      return true;
    } catch {
      return false;
    }
  };
  const getTypeErrorMessage = (type: string): string => {
    if (type === "address") {
      return "Invalid Ethereum address";
    } else if (type.startsWith("uint")) {
      return "Must be a positive number";
    } else if (type.startsWith("int")) {
      return "Must be a valid number";
    } else if (type === "bool") {
      return "Must be true or false";
    } else if (type === "bytes" || type.startsWith("bytes")) {
      return "Must be a valid hex string starting with 0x";
    }
    return "Invalid input type";
  };

  const handleParamChange = (
    paramName: string,
    value: string,
    type: string
  ) => {
    console.log("handleParamChange called with:", { paramName, value, type });
    const newValues = { ...paramValues, [paramName]: value };
    setParamValues(newValues);

    const isValid = validateType(value, type);
    const newErrors = { ...paramErrors };
    if (!isValid && value.length > 0) {
      newErrors[paramName] = getTypeErrorMessage(type);
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
        const isValid = validateType(val, input.type);
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
          <span className="font-medium text-purple-600">
            {selectedFunc.name}
          </span>
          {selectedFunc.inputs.length > 0 && (
            <span className="text-gray-500 ml-1">
              (
              {selectedFunc.inputs
                .map((input: any) => (
                  <span key={input.name} className="text-gray-600">
                    <span className="text-gray-500">{input.name}</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-purple-600">{input.type}</span>
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
        <div className="space-y-2">
          {selectedFunc.inputs.map((input: any, index: number) => (
            <div key={index} className="grid grid-cols-4 gap-4">
              <div className="bg-purple-50 p-3 rounded-md text-center">
                <span className="text-sm text-purple-700">{input.name}</span>
              </div>
              <div className="col-span-3 space-y-1">
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
                    className={`w-full ${
                      paramErrors[input.name]
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                )}
                {paramErrors[input.name] && (
                  <p className="text-sm text-red-500">
                    {paramErrors[input.name]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
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

export function ProposalEditAction({
  className,
  actionToEdit,
  onSaveChanges,
  onCancel,
  onRemoveAction,
  actionNumber,
  ...props
}: ProposalEditActionProps) {
  const [title, setTitle] = useState(actionToEdit.title);
  const [contractAddress, setContractAddress] = useState(
    actionToEdit.contractAddress
  );
  const [method, setMethod] = useState(actionToEdit.method);
  const [currentCalldata, setCurrentCalldata] = useState(actionToEdit.calldata);
  const [sendEth, setSendEth] = useState(actionToEdit.sendEth);
  const [currentAbi, setCurrentAbi] = useState<any[]>(actionToEdit.abi || []);
  const [initialCallDataParams, setInitialCallDataParams] = useState<{
    [key: string]: string;
  }>({});
  const [showRemoveAlert, setShowRemoveAlert] = useState(false);

  useEffect(() => {
    // Check if actionId exists
    if (!actionToEdit.id) {
      console.log("No actionId found, redirecting to initial screen");
      onCancel();
      return;
    }

    setTitle(actionToEdit.title);
    setContractAddress(actionToEdit.contractAddress);
    setMethod(actionToEdit.method);
    setCurrentCalldata(actionToEdit.calldata);
    setSendEth(actionToEdit.sendEth);
    setCurrentAbi(actionToEdit.abi || []);

    if (actionToEdit.abi && actionToEdit.method && actionToEdit.calldata) {
      try {
        const funcAbi = actionToEdit.abi.find((item: any) => {
          if (!item || !item.inputs || item.type !== "function") return false;
          const paramTypes = item.inputs
            .map((input: any) => input.type)
            .join(",");
          return `${item.name}(${paramTypes})` === actionToEdit.method;
        });

        if (funcAbi && funcAbi.inputs.length > 0) {
          const iface = new Interface([funcAbi]);
          const decodedParams = iface.decodeFunctionData(
            funcAbi.name,
            actionToEdit.calldata
          );

          const params: { [key: string]: string } = {};
          funcAbi.inputs.forEach((input: any, index: number) => {
            if (decodedParams[index] !== undefined) {
              if (typeof decodedParams[index] === "bigint") {
                params[input.name] = decodedParams[index].toString();
              } else if (typeof decodedParams[index] === "boolean") {
                params[input.name] = decodedParams[index].toString();
              } else {
                params[input.name] = String(decodedParams[index]);
              }
            }
          });
          setInitialCallDataParams(params);
        } else {
          setInitialCallDataParams({});
        }
      } catch (error) {
        console.error("Error decoding calldata for initial params:", error);
        setInitialCallDataParams({});
      }
    }
  }, [actionToEdit, onCancel]);

  const handleSaveChanges = () => {
    if (contractAddress && method && currentCalldata) {
      onSaveChanges({
        ...actionToEdit,
        title,
        contractAddress,
        method,
        calldata: currentCalldata,
        abi: currentAbi,
        sendEth,
      });
    }
  };

  const handleRemoveConfirm = () => {
    onRemoveAction(actionToEdit.id);
    setShowRemoveAlert(false);
  };

  const isCalldataChanged = () => {
    return currentCalldata !== actionToEdit.calldata;
  };

  const hasChanges =
    title !== actionToEdit.title ||
    isCalldataChanged() ||
    sendEth !== actionToEdit.sendEth;

  return (
    <div
      className={cn("md:col-span-2 bg-white p-4 rounded-md", className)}
      {...props}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Edit Action #{actionNumber}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onRemoveAction(actionToEdit.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Action Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter action title"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Target contract address
          </label>
          <Input
            value={contractAddress}
            readOnly
            className="border-gray-300 bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Contract method
          </label>
          <div className="mt-4 p-3 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">Selected Method:</p>
            <p className="font-mono text-gray-800 break-all">{method}</p>
          </div>

          {currentAbi && method && (
            <CalldataComponent
              abi={currentAbi}
              selectedFunction={method}
              initialParams={initialCallDataParams}
              onCalldataChange={setCurrentCalldata}
              isEditMode={true}
            />
          )}
        </div>

        <Button
          onClick={handleSaveChanges}
          className="w-full mt-4"
          disabled={
            !contractAddress || !method || !currentCalldata || !hasChanges
          }
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
