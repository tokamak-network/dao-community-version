import React from "react";
import { Info, CheckCircle2, Circle } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
  tips: string[];
}

interface ProposalGuideProps {
  currentStep: number;
  steps: Step[];
}

export function ProposalGuide({ currentStep, steps }: ProposalGuideProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Proposal Writing Guide
        </h3>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`p-4 rounded-lg border ${
              currentStep === step.number
                ? "border-purple-600 bg-purple-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {currentStep > step.number ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : currentStep === step.number ? (
                <Circle className="w-5 h-5 text-purple-600" />
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
  );
}
