export type PlanMode = 'lite' | 'deep';

export type GeneratedPlanStep = {
  title: string;
  explanation: string;
  example?: string;
  action: string;
  check: string;
};

export type GeneratedPlanPhase = {
  name: string;
  durationWeeks: number;
  duration?: string;
  objective: string;
  why?: string;
  description: string;
  overview?: string;
  topics: string[];
  steps?: GeneratedPlanStep[];
  tasks?: string[];
  practice?: string;
  checkpoint?: string;
  output?: string;
  commonMistakes?: string[];
  resources?: GeneratedPlanResource[];
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
  overview?: string;
  audience?: string;
  prerequisites?: string[];
  outcome?: string;
  phases: GeneratedPlanPhase[];
  resources: GeneratedPlanResource[];
  projects: GeneratedPlanProject[];
};
