"use client"

import { useState } from "react"
import {
    ChevronDown, MoreHorizontal, Plus, ArrowRight, Trash2, AlertCircle,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ProposalEditActionProps extends React.HTMLAttributes<HTMLDivElement> {
    onEditAction: (action: {
        title: string;
        contractAddress: string;
        abi: JSON;
        method: string;
        calldata: string;
        sendEth: boolean;
    }) => void;
}

export function ProposalEditAction({
    className,
    onEditAction,
    ...props
}: ProposalEditActionProps) {
    const [title, setTitle] = useState("");
    const [contractAddress, setContractAddress] = useState("");
    const [method, setMethod] = useState("");
    const [calldata, setCalldata] = useState("");
    const [sendEth, setSendEth] = useState(false);

    const handleAddAction = () => {
        if (title && contractAddress && method) {
          onEditAction({
                title,
                contractAddress,
                abi: {} as JSON, // 임시로 빈 JSON 객체 사용
                method,
                calldata,
                sendEth
            });
            setTitle("");
            setContractAddress("");
            setMethod("");
            setCalldata("");
            setSendEth(false);
        }
    };

    return (
        <div className="md:col-span-2 bg-white p-4 rounded-md" {...props}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-purple-600">Action #2</h2>
              <Button variant="ghost" className="text-gray-700 flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Remove action
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target contract address</label>
                <Input
                  type="text"
                  className="w-full border-gray-300"
                  defaultValue="0x2320542ae933FbAdf8f5B97cA348c7eDA90fAd7"
                />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Use the imported ABI or upload yours
                </label>
                <div className="relative">
                  <select className="w-full p-2 pr-10 border border-gray-300 rounded-md appearance-none">
                    <option>ERC-20</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract method</label>
                <div className="relative">
                  <select className="w-full p-2 pr-10 border border-gray-300 rounded-md appearance-none">
                    <option>approve</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
                </div>
                <div className="flex items-center mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-md">
                  <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                  This ABI is a standard. Please, be sure the smart contract implements the method you selected.
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Calldata</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The data for the function arguments you wish to send when the action executes
                </p>

                <div className="grid grid-cols-4 gap-4 mb-2">
                  <div className="bg-purple-50 p-3 rounded-md text-center">
                    <span className="text-sm text-purple-700">spender</span>
                  </div>
                  <div className="col-span-3 p-3 border border-gray-300 rounded-md">
                    <span className="text-sm text-gray-700">address</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-3 rounded-md text-center">
                    <span className="text-sm text-purple-700">amount</span>
                  </div>
                  <div className="col-span-3 p-3 border border-gray-300 rounded-md">
                    <span className="text-sm text-gray-700">uint256</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Also send Sepolia Ether to the target address? (this is not common)
                </span>
                <Switch />
              </div>
            </div>


        {/* <div className="md:col-span-2 bg-white p-4 rounded-md" {...props}>
            <div className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Action Title
                    </label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter action title"
                        className="w-full border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Address</label>
                    <Input
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        placeholder="Enter contract address"
                        className="w-full border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <Input
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        placeholder="Enter method name"
                        className="w-full border-gray-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calldata</label>
                    <Input
                        value={calldata}
                        onChange={(e) => setCalldata(e.target.value)}
                        placeholder="Enter calldata"
                        className="w-full border-gray-300"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="sendEth"
                        checked={sendEth}
                        onChange={(e) => setSendEth(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="sendEth" className="text-sm font-medium text-gray-700">
                        Send ETH with this action
                    </label>
                </div>

                <Button onClick={handleAddAction} className="w-full">
                    Add Action
                </Button>
            </div>
       */}
       </div>
    )
}