import { Action } from "./action";

export interface ProposalFormState {
  title: string;
  isValidIBaseInput: boolean;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  activeTab: string;
  showSelectAction: boolean;
  actions: Action[];
  editingAction: Action | null;
  showEditAction: boolean;
  showImpactOverview: boolean;
  simulationStep: "initial" | "results";
  simulatedActions: Action[];
  generalSimulationLogs: string[];
  eventSourceInstance: EventSource | null;
  pendingText: string;
  expandedActionLogs: { [actionId: string]: boolean };
  showSimulation: boolean;
  isEditMode: boolean;
  activeEditSection: string;
  selectedActionId: string | null;
  currentSection: string;
  activeSidebar: "guide" | "tips" | null;
}

export interface Step {
  number: number;
  title: string;
  description: string;
  tips: string[];
}
