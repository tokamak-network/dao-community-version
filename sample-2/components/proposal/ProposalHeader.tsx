import React from "react";
import { Save, FileUp } from "lucide-react";
import { saveProposalToFile } from "@/utils/file-handlers";
import { ProposalFormState } from "@/types/proposal";

interface ProposalHeaderProps {
  proposalData: Partial<ProposalFormState>;
  onLoadFile: (file: File) => void;
}

export function ProposalHeader({
  proposalData,
  onLoadFile,
}: ProposalHeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveLocally = () => {
    saveProposalToFile(proposalData);
  };

  const handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadFile(file);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Create New Proposal</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveLocally}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Locally
        </button>
        <input
          type="file"
          accept=".json"
          onChange={handleLoadFromFile}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FileUp className="w-4 h-4 mr-2" />
          Load from File
        </button>
      </div>
    </div>
  );
}
