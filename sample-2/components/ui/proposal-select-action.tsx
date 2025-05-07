"use client"

import { useState, useEffect } from "react"
import {
    ChevronDown, MoreHorizontal, Plus, ArrowRight, Trash2, AlertCircle,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ethers } from "ethers"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface ProposalSelectActionProps extends React.HTMLAttributes<HTMLDivElement> {
    onAddAction: (action: {
        title: string;
        contractAddress: string;
        abi: any[];
        method: string;
        calldata: string;
        sendEth: boolean;
    }) => void;
}

function RequiredContractAddress({value, setAbiProxy, setAbiLogic}: {value: string, setAbiProxy: React.Dispatch<React.SetStateAction<any[]>>, setAbiLogic: React.Dispatch<React.SetStateAction<any[]>>}) {
    const [isContractFound, setIsContractFound] = useState<boolean | null>(null);

    useEffect(() => {
        const checkContract = async () => {
            if (!value || value.length === 0) {
                setIsContractFound(null);
                setAbiProxy([]);
                setAbiLogic([]);
                return;
            }

            try {
                const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
                if (!apiKey) {
                    console.error('Etherscan API key is not configured');
                    setIsContractFound(false);
                    setAbiProxy([]);
                    setAbiLogic([]);
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_ETHERSCAN_API_URL || 'https://api-sepolia.etherscan.io/api';

                // Get proxy ABI
                const proxyUrl = `${apiUrl}?module=contract&action=getabi&address=${value}&apikey=${apiKey}`;
                const proxyResponse = await fetch(proxyUrl);
                const proxyData = await proxyResponse.json();

                if (proxyData.status === '1') {
                    setIsContractFound(true);
                    const proxyAbi = JSON.parse(proxyData.result);
                    // Filter only function and view types
                    const filteredProxyAbi = proxyAbi.filter((item: any) =>
                        item.type === 'function' || item.type === 'view'
                    );
                    setAbiProxy(filteredProxyAbi);

                    // Check for implementation() function
                    const implementationFunction = proxyAbi.find((item: any) =>
                        item.type === 'function' &&
                        item.name === 'implementation' &&
                        item.inputs.length === 0
                    );

                    if (implementationFunction) {
                        try {
                            // Call implementation() function
                            const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
                            const contract = new ethers.Contract(value, proxyAbi, provider);
                            const implementationAddress = await contract.implementation();

                            // Get implementation ABI
                            const logicUrl = `${apiUrl}?module=contract&action=getabi&address=${implementationAddress}&apikey=${apiKey}`;
                            const logicResponse = await fetch(logicUrl);
                            const logicData = await logicResponse.json();

                            if (logicData.status === '1') {
                                const logicAbi = JSON.parse(logicData.result);
                                // Filter only function and view types
                                const filteredLogicAbi = logicAbi.filter((item: any) =>
                                    item.type === 'function' || item.type === 'view'
                                );
                                setAbiLogic(filteredLogicAbi);
                            }
                        } catch (error) {
                            console.error('Error getting implementation:', error);
                        }
                    }
                } else {
                    setIsContractFound(false);
                    setAbiProxy([]);
                    setAbiLogic([]);
                }
            } catch (error) {
                console.error('Error checking contract:', error);
                setIsContractFound(false);
                setAbiProxy([]);
                setAbiLogic([]);
            }
        };

        checkContract();
    }, [value, setAbiProxy, setAbiLogic]);

    if (isContractFound === null || !isContractFound) {
        return (
            <div className="flex items-start mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>Contract not found on Etherscan. Select an ABI or import a JSON file containing your ABI.</p>
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

export function ProposalSelectAction({
    className,
    onAddAction,
    ...props
}: ProposalSelectActionProps) {
    const [title, setTitle] = useState("");
    const [contractAddress, setContractAddress] = useState("");
    const [method, setMethod] = useState("");
    const [selectedProxyMethod, setSelectedProxyMethod] = useState("");
    const [selectedLogicMethod, setSelectedLogicMethod] = useState("");
    const [selectedMethodType, setSelectedMethodType] = useState("proxy");
    const [calldata, setCalldata] = useState("");
    const [sendEth, setSendEth] = useState(false);
    const [abiProxy, setAbiProxy] = useState<any[]>([]);
    const [abiLogic, setAbiLogic] = useState<any[]>([]);

    const handleAddAction = () => {
        if (title && contractAddress && method) {
            onAddAction({
                title,
                contractAddress,
                abi: abiProxy,
                method,
                calldata,
                sendEth
            });
            setTitle("");
            setContractAddress("");
            setMethod("");
            setCalldata("");
            setSendEth(false);
            setAbiProxy([]);
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
                    <label className="block text-lg font-semibold text-gray-900 mb-2">Target contract address</label>
                    <Input
                        id="contractAddress"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        placeholder="Enter the target contract address"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <RequiredContractAddress
                        value={contractAddress}
                        setAbiProxy={setAbiProxy}
                        setAbiLogic={setAbiLogic}
                    />
                </div>

                <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-4">Contract method</label>
                    <RadioGroup value={selectedMethodType} onValueChange={setSelectedMethodType} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="proxy" id="proxy" />
                            <label htmlFor="proxy" className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Select from Proxy contract
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="logic" id="logic" />
                            <label htmlFor="logic" className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Select from Logic contract
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="predefined" id="predefined" />
                            <label htmlFor="predefined" className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Select from predefined ABI
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <label htmlFor="custom" className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Upload custom ABI
                            </label>
                        </div>
                    </RadioGroup>

                    {selectedMethodType === "proxy" && abiProxy.length > 0 && (
                        <div className="mt-4">
                            <Select value={selectedProxyMethod} onValueChange={setSelectedProxyMethod}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select the contract method..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    {abiProxy.map((item, index) => (
                                        <SelectItem key={index} value={item.name || `Function ${index + 1}`}>
                                            {item.name || `Function ${index + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedMethodType === "logic" && abiLogic.length > 0 && (
                        <div className="mt-4">
                            <Select value={selectedLogicMethod} onValueChange={setSelectedLogicMethod}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select the contract method..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    {abiLogic.map((item, index) => (
                                        <SelectItem key={index} value={item.name || `Function ${index + 1}`}>
                                            {item.name || `Function ${index + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedMethodType === "predefined" && (
                        <div className="mt-4">
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select the contract method..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                    <SelectItem value="erc20">ERC-20</SelectItem>
                                    <SelectItem value="erc721">ERC-721</SelectItem>
                                    <SelectItem value="erc1155">ERC-1155</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedMethodType === "custom" && (
                        <div className="mt-4">
                            <Textarea
                                placeholder="Enter your ABI JSON here..."
                                className="min-h-[200px] font-mono text-sm"
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    try {
                                        const abi = JSON.parse(e.target.value);
                                        // Handle the parsed ABI
                                        console.log('Parsed ABI:', abi);
                                    } catch (error) {
                                        // Invalid JSON - don't update state
                                        console.error('Invalid JSON:', error);
                                    }
                                }}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Enter your ABI in JSON format. Example: [&#123;"type": "function", "name": "transfer", "inputs": [...]&#125;]
                            </p>
                        </div>
                    )}
                </div>

                {/*ABI*/}
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Use the imported ABI or upload yours
                    </label>
                    <div className="relative">
                        <Select>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select ABI" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="erc20">ERC-20</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div> */}

                {/* <div>
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
                </div> */}

                {/* <div>
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
                </div> */}

                {/* <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        Also send Sepolia Ether to the target address? (this is not common)
                    </span>
                    <Switch />
                </div> */}
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