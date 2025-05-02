"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronRight, Copy, ExternalLink, Bell, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function GovernanceDashboard() {
  const [activeTab, setActiveTab] = useState("onchain")

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with background image */}
      <div className="relative w-full h-60 bg-gray-100">
         <Image
          src="/welcome2.jpeg"
          alt="Background pattern"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/5">
          {/* Top navigation */}
          {/* <div className="flex items-center gap-2 p-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Sepolia</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full">
              <span>ERC20</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full">
              <span>1,300 Supply</span>
            </div>
          </div> */}

          {/* Title */}
          <div className="absolute bottom-0 left-0 p-5 text-white">
            <h1 className="text-3xl font-bold">Welcome to Tokamak DAO</h1>
            <p className="text-sm opacity-90">Welcome to Tokamak DAO</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        <div className="flex-1 p-4">
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-r">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Delegates</h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-gray-500">2 token holders</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-r">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Proposals</h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-gray-500">No active proposals</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-r">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Treasury</h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-xs text-gray-500">1 treasury source</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium">My voting power</h3>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="w-8 h-8 border">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User avatar" />
                    <AvatarFallback>OX</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">0xc1eb...94E6</p>
                    <p className="text-xs text-gray-500">0xc1eb...94E6</p>
                  </div>
                  <Copy className="w-4 h-4 ml-1 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <Tabs defaultValue="onchain" className="w-full">
              <div className="flex justify-between">
                <TabsList className="border-b w-auto bg-transparent">
                  <TabsTrigger
                    value="drafts"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-4 py-2 text-gray-600 data-[state=active]:text-gray-900"
                  >
                    My Drafts
                  </TabsTrigger>
                  <TabsTrigger
                    value="onchain"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-4 py-2 text-gray-600 data-[state=active]:text-indigo-600"
                  >
                    Onchain
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="drafts" className="mt-4">
                <p>No drafts available</p>
              </TabsContent>

              <TabsContent value="onchain" className="mt-4">
                <div className="space-y-4">
                  {/* Proposal 1 */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-medium">4. DAOVault.claimERC20</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-600 rounded">
                              EXECUTED
                            </span>
                            <span className="text-xs text-gray-500">Nov 26th, 2024</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs">You voted: </span>
                            <span className="px-2 py-0.5 text-xs bg-emerald-500 text-white rounded">FOR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-xs text-emerald-500 mt-1">1.05K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }}></div>
                            </div>
                            <span className="text-xs text-red-500 mt-1">0</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">1.05K</span>
                            <span className="text-xs text-gray-500">1 addresses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal 2 */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-medium">2.SeigManagerProxy.setMinimumAmount ( 99 TON )</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-600 rounded">
                              EXECUTED
                            </span>
                            <span className="text-xs text-gray-500">Nov 25th, 2024</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs">You voted: </span>
                            <span className="px-2 py-0.5 text-xs bg-emerald-500 text-white rounded">FOR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-xs text-emerald-500 mt-1">1.3K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }}></div>
                            </div>
                            <span className="text-xs text-red-500 mt-1">0</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">1.3K</span>
                            <span className="text-xs text-gray-500">2 addresses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal 3 */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-medium">Change DepositManagerProxy.setGlobalWithdrawalDelay</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-600 rounded">
                              EXECUTED
                            </span>
                            <span className="text-xs text-gray-500">Nov 25th, 2024</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs">You voted: </span>
                            <span className="px-2 py-0.5 text-xs bg-emerald-500 text-white rounded">FOR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-xs text-emerald-500 mt-1">1.05K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }}></div>
                            </div>
                            <span className="text-xs text-red-500 mt-1">0</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">1.05K</span>
                            <span className="text-xs text-gray-500">1 addresses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal 4 */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-medium flex items-center">
                            change the seigniorage distribution ratio 2
                            <Info className="w-4 h-4 ml-1 text-gray-400" />
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded">
                              PENDING QUEUE
                            </span>
                            <span className="text-xs text-gray-500">Nov 18th, 2024</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs">You voted: </span>
                            <span className="px-2 py-0.5 text-xs bg-emerald-500 text-white rounded">FOR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-xs text-emerald-500 mt-1">1000</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }}></div>
                            </div>
                            <span className="text-xs text-red-500 mt-1">0</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">1000</span>
                            <span className="text-xs text-gray-500">1 addresses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="text-sm">
                      View all
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 border-l p-4 hidden md:block">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total voting power:</span>
                <span className="text-sm font-medium">1.05K TVT</span>
                <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">1</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">Delegating 1.05K TVT to self</span>
              </div>
              <Button className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white">Update delegation</Button>
              <Button variant="outline" className="w-full mt-2">
                View details
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 p-1 rounded">&lt;/&gt;</code>
                  <span className="text-sm">Contracts and parameters</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        fill="currentColor"
                      />
                      <path
                        d="M20 15C21.1046 15 22 14.1046 22 13C22 11.8954 21.1046 11 20 11C18.8954 11 18 11.8954 18 13C18 14.1046 18.8954 15 20 15Z"
                        fill="currentColor"
                      />
                      <path
                        d="M4 15C5.10457 15 6 14.1046 6 13C6 11.8954 5.10457 11 4 11C2.89543 11 2 11.8954 2 13C2 14.1046 2.89543 15 4 15Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Page owner and editors</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">Notifications</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
