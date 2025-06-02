import { ProposalFormState } from "@/types/proposal";

export const saveProposalToFile = (
  proposalData: Partial<ProposalFormState>
) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(proposalData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proposal-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const loadProposalFromFile = (
  file: File
): Promise<Partial<ProposalFormState>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const proposalData = JSON.parse(e.target?.result as string);
        resolve(proposalData);
      } catch (error) {
        reject(
          new Error(
            "Error loading proposal file. Please make sure it's a valid proposal JSON file."
          )
        );
      }
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
};
