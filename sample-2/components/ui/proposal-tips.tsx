import React from "react";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalTipsProps {
  currentStep: number;
  isVisible: boolean;
  onToggle: () => void;
}

export function ProposalTips({
  currentStep,
  isVisible,
  onToggle,
}: ProposalTipsProps) {
  const tips = [
    "You can quickly load a previously saved proposal using the 'Load from File' button",
    "Use the Impact overview to simulate and verify your proposal's function execution before submission",
    "Save your proposal using the 'Save Locally' button for future reference",
    "If your proposal details don't appear after PR merge, use the refresh button in the detail view to update the data",
  ];

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed right-4 top-20 z-50 bg-white rounded-l-lg shadow-lg p-2 border border-r-0 border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
        title="Toggle Tips"
      >
        <div className={cn(isVisible && "hidden")}>
          <div className="bg-yellow-400 rounded-full p-1">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
        </div>
        {isVisible ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      <div
        className={cn(
          "fixed right-0 top-36 w-72 bg-white rounded-l-lg shadow-lg p-4 max-h-[calc(100vh-6rem)] overflow-y-auto transition-transform duration-300 ease-in-out z-50",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-yellow-400 rounded-full p-1">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Tips</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-200">
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-yellow-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
