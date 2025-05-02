"use client"

import { Button } from "@/components/ui/button"
import { PlusSquare, FileText, BarChart2 } from "lucide-react"

export default function Sidebar() {
  return (
    <div className="w-[220px] border-r border-gray-200 p-4">
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <FileText className="mr-2 h-4 w-4" />
          Proposal text
        </Button>
        <Button variant="default" className="w-full justify-start text-left bg-gray-800 hover:bg-gray-700">
          <PlusSquare className="mr-2 h-4 w-4" />
          Add Action
        </Button>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <BarChart2 className="mr-2 h-4 w-4" />
          Impact overview
        </Button>
      </div>
    </div>
  )
}
