"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Trash2 } from "lucide-react";
import { Interface } from "ethers";
import { isAddress } from "ethers";
import { validateParameterType, getParameterTypeErrorMessage, normalizeParameterValue } from "@/lib/utils";

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
}

interface ProposalEditActionProps {
  actionToEdit: Action;
  onSaveChanges: (action: Action) => void;
  onCancel: () => void;
  onRemoveAction: (actionId: string) => void;
  actionNumber: number;
}

function ValidationError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-red-500 mt-1">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function ProposalEditAction({
  actionToEdit,
  onSaveChanges,
  onCancel,
  onRemoveAction,
  actionNumber,
}: ProposalEditActionProps) {
  const [title, setTitle] = useState(actionToEdit.title);
  const [contractAddress, setContractAddress] = useState(actionToEdit.contractAddress);
  const [method, setMethod] = useState(actionToEdit.method);
  const [calldata, setCalldata] = useState(actionToEdit.calldata);
  const [sendEth, setSendEth] = useState(actionToEdit.sendEth);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [paramValues, setParamValues] = useState<{[key: string]: string}>({});
  const [paramErrors, setParamErrors] = useState<{[key: string]: string}>({});


  useEffect(() => {
    setTitle(actionToEdit.title);
    setContractAddress(actionToEdit.contractAddress);
    setMethod(actionToEdit.method);
    setCalldata(actionToEdit.calldata);
    setSendEth(actionToEdit.sendEth);



    // Initialize parameter values from existing calldata
    try {
      const match = actionToEdit.method.match(/(.+)\(/);
      if (match) {
        const funcName = match[1];
        const functionAbi = actionToEdit.abi.find(
          (item: any) => item.type === 'function' && item.name === funcName
        );

        if (functionAbi && functionAbi.inputs) {
          const iface = new Interface(actionToEdit.abi);
          const decoded = iface.parseTransaction({ data: actionToEdit.calldata });

          if (decoded) {
            const initialValues: {[key: string]: string} = {};
            decoded.args.forEach((arg: any, index: number) => {
              const input = functionAbi.inputs[index];
              const paramName = input.name || `param${index}`;
              initialValues[paramName] = arg.toString();
            });
            setParamValues(initialValues);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing parameter values:", error);
    }
  }, [actionToEdit]);



  const handleParamChange = (paramName: string, value: string, paramType: string) => {
    setParamValues(prev => ({
      ...prev,
      [paramName]: value
    }));

    // Validate the parameter
    const isValid = validateParameterType(value, paramType);
    setParamErrors(prev => ({
      ...prev,
      [paramName]: isValid ? "" : getParameterTypeErrorMessage(paramType)
    }));

    // Try to regenerate calldata regardless of validation
    try {
      const match = method.match(/(.+)\(/);
      if (!match) return;

      const funcName = match[1];
      const functionAbi = actionToEdit.abi.find(
        (item: any) => item.type === 'function' && item.name === funcName
      );

      if (!functionAbi || !functionAbi.inputs) return;

      const iface = new Interface(actionToEdit.abi);
      const values = functionAbi.inputs.map((input: any) => {
        const inputParamName = input.name || `param${functionAbi.inputs.indexOf(input)}`;
        const inputValue = paramName === inputParamName ? value : (paramValues[inputParamName] || '');

        // Convert value based on type, with fallbacks for encoding
        if (input.type === 'bool') {
          return inputValue === 'true';
        } else if (input.type.startsWith('uint') || input.type.startsWith('int')) {
          // Use 0 as fallback for invalid numbers
          const num = parseInt(inputValue);
          return !isNaN(num) ? inputValue : '0';
        } else if (input.type === 'address') {
          // 유효한 주소인지 확인하고, 소문자로 변환해서 체크섬 오류 방지
          if (validateParameterType(inputValue, input.type)) {
            // 체크섬 오류를 피하기 위해 소문자 주소 사용
            return normalizeParameterValue(inputValue, input.type);
          } else {
            // 유효하지 않은 주소면 원본 calldata에서 해당 파라미터 값 추출해서 사용
            try {
              const originalIface = new Interface(actionToEdit.abi);
              const originalDecoded = originalIface.parseTransaction({ data: actionToEdit.calldata });
              if (originalDecoded && originalDecoded.args[functionAbi.inputs.indexOf(input)]) {
                return normalizeParameterValue(originalDecoded.args[functionAbi.inputs.indexOf(input)].toString(), input.type);
              }
            } catch {}
            return '0x0000000000000000000000000000000000000000';
          }
        } else {
          return inputValue || '';
        }
      });

      const newCalldata = iface.encodeFunctionData(funcName, values);
      setCalldata(newCalldata);
    } catch (error) {
      console.error("Error regenerating calldata:", error);
      // Keep the previous calldata if encoding fails
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!contractAddress.trim()) {
      newErrors.contractAddress = "Contract address is required";
    } else {
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethAddressRegex.test(contractAddress)) {
        newErrors.contractAddress = "Invalid Ethereum address format";
      }
    }

    if (!method.trim()) {
      newErrors.method = "Method name is required";
    }

    if (!calldata.trim()) {
      newErrors.calldata = "Calldata is required";
    } else {
      if (!calldata.startsWith("0x")) {
        newErrors.calldata = "Calldata must start with 0x";
      } else if (!/^0x[a-fA-F0-9]*$/.test(calldata)) {
        newErrors.calldata = "Calldata must be valid hex";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const updatedAction: Action = {
        ...actionToEdit,
        title,
        contractAddress,
        method,
        calldata,
        sendEth,
      };
      onSaveChanges(updatedAction);
    }
  };

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this action?")) {
      onRemoveAction(actionToEdit.id);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Action #{actionNumber}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </Button>
      </div>

      <div className="space-y-6">
        {/* Action Title */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Action Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter action title (e.g., Transfer Tokens)"
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.title && <ValidationError message={errors.title} />}
        </div>

        {/* Contract Address */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Target Contract Address
          </label>
          <Input
            value={contractAddress}
            readOnly
            className="bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Method Name */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-2">
            Method Name
          </label>
          <Input
            value={method}
            readOnly
            className="bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Calldata */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Calldata
          </label>

          {/* Function Display */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">Function:</span>{" "}
              {(() => {
                try {
                  // Extract function name from method string
                  const match = method.match(/(.+)\(/);
                  if (!match) return <span className="font-medium text-blue-600">{method}</span>;

                  const funcName = match[1];

                  // Find the function in the ABI
                  const functionAbi = actionToEdit.abi.find(
                    (item: any) => item.type === 'function' && item.name === funcName
                  );

                  if (!functionAbi || !functionAbi.inputs) {
                    return <span className="font-medium text-blue-600">{method}</span>;
                  }

                  return (
                    <>
                      <span className="font-medium text-blue-600">
                        {funcName}
                      </span>
                      {functionAbi.inputs.length > 0 && (
                        <span className="text-gray-500 ml-1">
                          (
                          {functionAbi.inputs
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
                    </>
                  );
                } catch (error) {
                  return <span className="font-medium text-blue-600">{method}</span>;
                }
              })()}
            </p>
          </div>

                    {/* Parameters Table */}
          {(() => {
            try {
              // Extract function name from method string
              const match = method.match(/(.+)\(/);
              if (!match) return null;

              const funcName = match[1];

              // Find the function in the ABI
              const functionAbi = actionToEdit.abi.find(
                (item: any) => item.type === 'function' && item.name === funcName
              );

              if (!functionAbi || !functionAbi.inputs || functionAbi.inputs.length === 0) return null;

              const iface = new Interface(actionToEdit.abi);
              const decoded = iface.parseTransaction({ data: calldata });

              if (!decoded) return null;

              return (
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden border-separate border-spacing-y-1">
                  <tbody>
                    {decoded.args.map((arg: any, index: number) => {
                      const input = functionAbi.inputs[index];
                      const paramName = input.name || `param${index}`;
                      const paramType = input.type;

                      return (
                        <tr key={index}>
                          <td className="bg-blue-50 p-2 text-sm font-medium text-gray-900 border-r border-gray-200 text-center w-1/4">
                            {paramName} ({paramType})
                          </td>
                          <td className="p-2 w-3/4">
                            {input.type === "bool" ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={paramValues[paramName] === "true"}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked ? "true" : "false";
                                    handleParamChange(paramName, newValue, paramType);
                                  }}
                                />
                                <span className="text-sm text-gray-600">
                                  {paramValues[paramName] === "true" ? "True" : "False"}
                                </span>
                              </div>
                            ) : (
                              <Input
                                type="text"
                                value={paramValues[paramName] || ""}
                                onChange={(e) => handleParamChange(paramName, e.target.value, paramType)}
                                className={`w-full border-gray-300 ${
                                  paramErrors[paramName]
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                                placeholder={`Enter ${paramType}`}
                              />
                            )}
                            {paramErrors[paramName] && (
                              <p className="text-sm text-red-500 mt-1">
                                {paramErrors[paramName]}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            } catch (error) {
              // Fallback to original textarea if decoding fails
              return (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    The encoded function call data in hexadecimal format
                  </p>
                  <Textarea
                    value={calldata}
                    readOnly
                    className="min-h-[100px] font-mono text-sm bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                  />
                </div>
              );
            }
          })()}

          {errors.calldata && <ValidationError message={errors.calldata} />}

          {/* Generated Calldata */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated Calldata
            </label>
            <div className="bg-gray-50 p-3 rounded-md">
              <code className="text-sm break-all">{calldata}</code>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={
              // 에러가 있거나 변경사항이 없거나 파라미터가 비어있으면 비활성화
              Object.values(paramErrors).some(error => error !== "") ||
              Object.values(errors).some(error => error !== "") ||
              (calldata === actionToEdit.calldata && title === actionToEdit.title) ||
              (() => {
                // 파라미터가 있는지 확인
                try {
                  const match = method.match(/(.+)\(/);
                  if (!match) return false;

                  const funcName = match[1];
                  const functionAbi = actionToEdit.abi.find(
                    (item: any) => item.type === 'function' && item.name === funcName
                  );

                  if (!functionAbi || !functionAbi.inputs || functionAbi.inputs.length === 0) {
                    return false; // 파라미터가 없으면 체크하지 않음
                  }

                  // 모든 파라미터에 값이 있는지 확인
                  return functionAbi.inputs.some((input: any) => {
                    const paramName = input.name || `param${functionAbi.inputs.indexOf(input)}`;
                    const value = paramValues[paramName] || "";
                    return !value.trim(); // 하나라도 비어있으면 true 반환 (비활성화)
                  });
                } catch {
                  return false;
                }
              })()
            }
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}