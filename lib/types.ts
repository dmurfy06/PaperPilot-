export interface StudyObjective {
  points: string[];
}

export interface PlainEnglishSummary {
  text: string;
}

export interface KeyFinding {
  text: string;
}

export interface MethodsOverview {
  text: string;
}

export interface Limitation {
  text: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface PaperAnalysis {
  studyObjective: StudyObjective;
  plainEnglishSummary: PlainEnglishSummary;
  keyFindings: KeyFinding[];
  methodsOverview: MethodsOverview;
  limitations: Limitation[];
  glossary: GlossaryTerm[];
}

export interface Note {
  id: string;
  paperId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Paper {
  id: string;
  filename: string;
  analysis: PaperAnalysis;
  uploadedAt: number;
}
