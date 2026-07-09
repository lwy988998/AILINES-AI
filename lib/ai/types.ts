export type PlanMode = 'lite' | 'deep';

export type GeneratedPlanStep = {
  title: string;
  explanation: string;
  example?: string;
  action: string;
  check: string;
};

export type GeneratedCourseSlide = {
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  speakerNote?: string;
  relatedPhase?: string;
};

export type GeneratedMindMapNode = {
  id: string;
  label: string;
  children?: GeneratedMindMapNode[];
};

export type GeneratedMindMap = {
  title: string;
  nodes: GeneratedMindMapNode[];
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
  courseIntro?: string;
  overview?: string;
  audience?: string;
  prerequisites?: string[];
  outcome?: string;
  learningOutcomes?: string[];
  phases: GeneratedPlanPhase[];
  slides?: GeneratedCourseSlide[];
  mindMap?: GeneratedMindMap;
  resources: GeneratedPlanResource[];
  projects: GeneratedPlanProject[];
};
