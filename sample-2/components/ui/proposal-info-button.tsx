import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalInfoButtonProps {
  title: string;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  onClick: () => void;
  buttonText?: string;
}

export function ProposalInfoButton({
  title,
  description,
  snapshotUrl,
  discourseUrl,
  onClick,
  buttonText = "Basic Information",
}: ProposalInfoButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-left font-normal"
      onClick={onClick}
    >
      <FileText className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
}
