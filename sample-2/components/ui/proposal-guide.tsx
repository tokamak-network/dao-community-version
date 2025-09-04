import React from "react";
import {
  Info,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
  tips: string[];
}

interface ProposalGuideProps {
  currentStep: number;
  steps: Step[];
  isVisible: boolean;
  onToggle: () => void;
}

export function ProposalGuide({
  currentStep,
  steps,
  isVisible,
  onToggle,
}: ProposalGuideProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className="fixed right-4 top-32 z-50 bg-white rounded-l-lg shadow-lg p-2 border border-r-0 border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
        title="Toggle Guide"
      >
        <div className={cn(isVisible && "hidden")}>
          <div className="bg-blue-400 rounded-full p-1">
            <BookOpen className="w-4 h-4 text-white" />
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
          "fixed right-0 top-48 w-72 bg-white rounded-l-lg shadow-lg p-4 max-h-[calc(100vh-12rem)] overflow-y-auto transition-transform duration-300 ease-in-out z-50",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-400 rounded-full p-1">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Proposal Writing Guide
          </h3>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                "p-4 rounded-lg border transition-colors duration-200",
                currentStep === step.number
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : currentStep === step.number ? (
                  <Circle className="w-5 h-5 text-blue-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
                <h4 className="font-medium text-gray-900">
                  Step {step.number}: {step.title}
                </h4>
              </div>

              <p className="text-sm text-gray-600 mb-3 ml-8">
                {step.description}
              </p>

              {currentStep === step.number && (
                <div className="ml-8 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
