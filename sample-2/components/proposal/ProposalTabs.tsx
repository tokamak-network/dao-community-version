import React from "react";
import { FileEdit, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProposalTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  currentStep: number;
}

export function ProposalTabs({
  activeTab,
  onTabChange,
  currentStep,
}: ProposalTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
      <TabsList className="bg-transparent p-0 h-auto">
        <TabsTrigger
          value="edit"
          className={cn(
            "px-4 py-2 border-b-2",
            activeTab === "edit"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500"
          )}
        >
          <FileEdit className="w-4 h-4 mr-2" />
          Edit
        </TabsTrigger>
        <TabsTrigger
          value="preview"
          className={cn(
            "px-4 py-2 border-b-2 relative",
            activeTab === "preview"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500",
            currentStep === 3 && activeTab !== "preview" && "animate-pulse"
          )}
        >
          {currentStep === 3 && activeTab !== "preview" ? (
            <div className="relative w-4 h-4 mr-2">
              <Eye className="w-4 h-4 absolute" />
            </div>
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          Proposal Preview
          {currentStep === 3 && activeTab !== "preview" && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
