export type CodingStyleInfraction = {
  code: string;
  severity: string;
  comment: string;
  file: string;
  line: number;
  column: number;
};

export type GroupSummary = {
  group: string;
  members: string[];
  passCount: number;
  failCount: number;
  totalCount: number;
  codingStyleMark: number;
  codingStyleInfractions: number;
  lastBuildAt: number | null;
  building: boolean;
  result: string | null;
};

export type TestCase = {
  name: string;
  className: string;
  status: string;
  errorDetails: string | null;
};

export type TestSuite = {
  name: string;
  cases: TestCase[];
};

export type BuildTrend = {
  build: number;
  passed: number;
  failed: number;
  skipped: number;
  timestamp: number;
};

export type GroupDetail = {
  group: string;
  members: string[];
  passCount: number;
  failCount: number;
  totalCount: number;
  suites: TestSuite[];
  codingStyle: { mark: number; infractions: CodingStyleInfraction[] };
  coverage: { lines: number | null; functions: number | null; branches: number | null };
};
