export interface Finding {
  severity: 'Blocker' | 'Major' | 'Minor';
  title: string;
  file: string;
  line?: number;
  confidence: number;
  failure: string;
  fix: string;
}

export interface ReviewResult {
  stackDetected: string;
  findings: Finding[];
  worthSecondLook: string[];
  summary: string;
}

export interface CliOptions {
  path: string;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}
