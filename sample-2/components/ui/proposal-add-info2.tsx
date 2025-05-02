"use client"

import { useState } from "react"
import {
  Bold,
  ChevronDown,
  Code,
  ImageIcon,
  Link,
  List,
  ListOrdered,
  Redo,
  Table,
  Undo,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ProposalAddInfo2Props extends React.HTMLAttributes<HTMLDivElement> {}

export function ProposalAddInfo2({ className, ...props }: ProposalAddInfo2Props) {

  return (
    <div  className="md:col-span-2 bg-white p-4 rounded-md" {...props} >
        <div className="flex justify-end mb-4">
            <Button variant="outline" className="text-gray-700">
            <Upload className="w-4 h-4 mr-2" />
            Import
            </Button>
        </div>

        <div className="space-y-6">
            <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
            </label>
            <Input id="title" placeholder="Enter the title of your proposal" className="w-full border-gray-300" />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="border border-gray-300 rounded-md">
                <div className="flex items-center border-b border-gray-300 p-2 space-x-2">
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Undo className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Redo className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Bold className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M19 4H5C3.89543 4 3 4.89543 3 6V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V6C21 4.89543 20.1046 4 19 4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 9H15M9 13H15M9 17H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    </svg>
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M4 7V4H20V7M9 20H15M12 4V20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    </svg>
                </button>

                <div className="h-4 border-r border-gray-300 mx-1"></div>

                <div className="relative">
                    <button className="flex items-center p-1 text-gray-500 hover:text-gray-900 rounded">
                    <span className="text-xs mr-1">Block type</span>
                    <ChevronDown className="w-3 h-3" />
                    </button>
                </div>

                <div className="h-4 border-r border-gray-300 mx-1"></div>

                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <List className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    </svg>
                </button>

                <div className="h-4 border-r border-gray-300 mx-1"></div>

                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Link className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Code className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <ImageIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-900 rounded">
                    <Table className="w-4 h-4" />
                </button>
                <button className="p-1 bg-blue-100 text-blue-600 rounded">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                </div>
                <div className="p-4 min-h-[200px]"></div>
            </div>
            </div>

            <div>
            <label htmlFor="snapshot-url" className="block text-sm font-medium text-gray-700 mb-1">
                Snapshot URL
            </label>
            <Input
                id="snapshot-url"
                defaultValue="https://snapshot.org/#/mydao.eth/"
                className="w-full border-gray-300"
            />
            </div>

            <div>
            <label htmlFor="discourse-url" className="block text-sm font-medium text-gray-700 mb-1">
                Discourse URL
            </label>
            <Input
                id="discourse-url"
                defaultValue="https://forum.mydao.com/t/"
                className="w-full border-gray-300"
            />
            </div>
        </div>
    </div>

    // <div className="md:col-span-2" {...props}>
    //     <div className="flex justify-end mb-4">
    //     <Button variant="outline" className="text-gray-700">
    //         <Upload className="w-4 h-4 mr-2" />
    //         Import
    //     </Button>
    //     </div>

    //     <div className="space-y-6">
    //     <div>
    //         <label className="text-lg font-medium mb-2 block">Title</label>
    //         <Input
    //         placeholder="Enter the title of your proposal"
    //         className="text-sm rounded-md border-red-300 focus-visible:ring-red-300"
    //         value={this.state.title}
    //         onChange={(e) => this.setState({ title: e.target.value })}
    //         />
    //         <div className="flex items-center gap-1 text-red-500 mt-1">
    //         <MoreHorizontal className="w-4 h-4" />
    //         <span className="text-sm">Title is required</span>
    //         </div>
    //     </div>

    //     <div>
    //         <label className="text-lg font-medium mb-2 block">Description</label>
    //         <div className="border rounded-md">
    //         {/* Rich Text Editor Toolbar */}
    //         <div className="flex items-center gap-1 p-2 border-b border-gray-200">
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Undo className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Redo className="h-4 w-4" />
    //             </Button>
    //             <div className="w-px h-6 bg-gray-200 mx-1"></div>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Bold className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Italic className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Underline className="h-4 w-4" />
    //             </Button>
    //             <div className="w-px h-6 bg-gray-200 mx-1"></div>
    //             <Button variant="ghost" className="h-8 rounded flex items-center gap-1 px-2">
    //             <span className="text-sm">Block type</span>
    //             <ChevronDown className="h-3 w-3" />
    //             </Button>
    //             <div className="w-px h-6 bg-gray-200 mx-1"></div>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <List className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <ListOrdered className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Link className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Code className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <ImageIcon className="h-4 w-4" />
    //             </Button>
    //             <Button variant="ghost" size="icon" className="h-8 w-8 rounded">
    //             <Table className="h-4 w-4" />
    //             </Button>
    //         </div>

    //         {/* Editor Content Area */}
    //         <div className="min-h-[300px] p-4"></div>
    //         </div>
    //         <div className="flex items-center gap-1 text-red-500 mt-1">
    //         <MoreHorizontal className="w-4 h-4" />
    //         <span className="text-sm">Description is required</span>
    //         </div>
    //     </div>

    //     <div>
    //         <label className="text-lg font-medium mb-2 block">Snapshot URL</label>
    //         <Input
    //         placeholder="https://snapshot.org/#/mydao.eth/"
    //         className="text-sm rounded-md border-gray-300"
    //         value={this.state.snapshotUrl}
    //         onChange={(e) => this.setState({ snapshotUrl: e.target.value })}
    //         />
    //     </div>

    //     <div>
    //         <label className="text-lg font-medium mb-2 block">Discourse URL</label>
    //         <Input
    //         placeholder="https://forum.mydao.com/t/"
    //         className="text-sm rounded-md border-gray-300"
    //         value={this.state.discourseUrl}
    //         onChange={(e) => this.setState({ discourseUrl: e.target.value })}
    //         />
    //     </div>
    //     </div>
    // </div>
  )
}