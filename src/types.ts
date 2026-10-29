export type Skill = { name: string; evidence: string[] };

export type Analysis = {
  summary: string;
  strengths: string[];
  skills: Record<string, Skill[]>;
  skillsNote: string;
  roles: {
    title: string;
    reason: string;
    matchScore: number;
    demonstratedSkills: string[];
    skillGaps: string[];
  }[];
  gaps: { skill: string; priority: "high" | "medium" | "low"; suggestion: string }[];
  roadmap: {
    timeframe: "Short-term" | "Medium-term" | "Long-term";
    skill: string;
    why: string;
    exercise: string;
    estimatedTime: string;
    resources: { title: string; url?: string }[];
  }[];
  improvements: {
    area: string;
    original: string;
    suggested: string;
    advice: string;
  }[];
  readinessScore: {
    score: number;
    label: string;
    explanation: string;
    breakdown: { category: string; score: number }[];
  };
};

export type AnalysisRecord = {
  id: string;
  createdAt: string;
  targetRole: string;
  result: Analysis;
  demo: boolean;
};

export type Profile = {
  id: string;
  full_name: string;
  role: "student" | "officer";
  degree: string;
  branch: string;
  graduation_year: number | null;
  career_interests: string[];
  share_for_placement: boolean;
  share_learning_progress: boolean;
};
