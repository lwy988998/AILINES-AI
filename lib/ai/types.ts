export type PlanMode = 'lite' | 'deep';

export type GeneratedPlanPhase = {
  name: string;
  durationWeeks: number;
  objective: string;
  description: string;
  topics: string[];
};

export type GeneratedPlanResource = {
  name: string;
  type: string;
  difficulty: string;
  free: boolean;
  description: string;
  url: string;
};

export type GeneratedPlanProject = {
  name: string;
  difficulty: string;
  estimatedHours: number;
  output: string;
  acceptanceCriteria: string[];
};

export type GeneratedPlan = {
  title: string;
  goal: string;
  durationWeeks: number;
  summary: string;
  phases: GeneratedPlanPhase[];
  resources: GeneratedPlanResource[];
  projects: GeneratedPlanProject[];
};
