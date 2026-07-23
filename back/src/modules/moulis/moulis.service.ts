import { schoolYear } from "@/lib/dates";
import type { GroupSummary, GroupDetail, CodingStyleInfraction, TestSuite, BuildTrend } from "./moulis.types";

const JENKINS_URL = process.env["JENKINS_URL"] ?? "https://jenkins.epitest.eu";
const JENKINS_USER = process.env["JENKINS_USER"] ?? "";
const JENKINS_TOKEN = process.env["JENKINS_TOKEN"] ?? "";
const JENKINS_INSTANCE = process.env["JENKINS_INSTANCE"] ?? "NCE-2-1";

const AUTH = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString("base64");

async function jGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${JENKINS_URL}${path}`, {
      headers: { Authorization: `Basic ${AUTH}` },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function jGetText(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${JENKINS_URL}${path}`, {
      headers: { Authorization: `Basic ${AUTH}` },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function getCrumb(): Promise<Record<string, string>> {
  const data = await jGet<{ crumb: string; crumbRequestField: string }>("/crumbIssuer/api/json");
  if (!data) return {};
  return { [data.crumbRequestField]: data.crumb };
}

function jobPath(...segments: string[]): string {
  return segments.map((s) => `/job/${encodeURIComponent(s)}`).join("");
}

function parseMembers(group: string): string[] {
  return group.split("_");
}

type ResolvedPath = { yearPath: string; instancePath: string; triggerJobName: string | null };
const resolvedPathCache = new Map<string, ResolvedPath>();

async function resolveInstancePath(module: string, project: string): Promise<ResolvedPath | null> {
  const cacheKey = `${module}/${project}`;
  const cached = resolvedPathCache.get(cacheKey);
  if (cached) return cached;

  const year = String(schoolYear());
  const yearPath = jobPath(module, project, year);

  // Fast path: expected instance exists directly
  const directCheck = await jGet<{ jobs: unknown[] }>(
    `${yearPath}${jobPath(JENKINS_INSTANCE)}/api/json?tree=jobs[name]`
  );
  if (directCheck) {
    const result: ResolvedPath = {
      yearPath,
      instancePath: `${yearPath}${jobPath(JENKINS_INSTANCE)}`,
      triggerJobName: `${JENKINS_INSTANCE}-jobs`,
    };
    resolvedPathCache.set(cacheKey, result);
    return result;
  }

  // Discovery: list all sub-folders under module/project/year
  const yearData = await jGet<{ jobs: { name: string }[] }>(
    `${yearPath}/api/json?tree=jobs[name]`
  );
  if (!yearData || yearData.jobs.length === 0) {
    // Try year-1 as fallback
    const fallbackYear = String(schoolYear() - 1);
    const fallbackYearPath = jobPath(module, project, fallbackYear);
    const fallbackData = await jGet<{ jobs: { name: string }[] }>(
      `${fallbackYearPath}/api/json?tree=jobs[name]`
    );
    if (!fallbackData || fallbackData.jobs.length === 0) return null;
    return resolveFromJobs(module, project, fallbackYearPath, fallbackData.jobs, cacheKey);
  }

  return resolveFromJobs(module, project, yearPath, yearData.jobs, cacheKey);
}

function resolveFromJobs(
  _module: string, _project: string,
  yearPath: string,
  jobs: { name: string }[],
  cacheKey: string
): ResolvedPath | null {
  // Trigger jobs end with '-jobs'; the instance folder is everything else
  const triggerJob = jobs.find((j) => j.name.endsWith("-jobs"));
  const instanceJob = jobs.find((j) => !j.name.endsWith("-jobs"));
  if (!instanceJob) return null;

  const result: ResolvedPath = {
    yearPath,
    instancePath: `${yearPath}${jobPath(instanceJob.name)}`,
    triggerJobName: triggerJob?.name ?? null,
  };
  resolvedPathCache.set(cacheKey, result);
  return result;
}

function parseCoverage(text: string): { lines: number | null; functions: number | null; branches: number | null } {
  const match = (pattern: RegExp) => {
    const m = text.match(pattern);
    return m ? parseFloat(m[1]!) : null;
  };
  return {
    lines: match(/^lines:\s+([\d.]+)%/m),
    functions: match(/^functions:\s+([\d.]+)%/m),
    branches: match(/^branches:\s+([\d.]+)%/m),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getGroupTrend(module: string, project: string, group: string, limit = 20): Promise<BuildTrend[]> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved) return [];

  const data = await jGet<{
    builds: {
      number: number;
      timestamp: number;
      actions: { _class: string; failCount?: number; skipCount?: number; totalCount?: number }[];
    }[];
  }>(`${resolved.instancePath}${jobPath(group)}/api/json?tree=builds[number,timestamp,actions[_class,failCount,skipCount,totalCount]]`);

  if (!data) return [];

  return data.builds
    .slice(0, limit)
    .reverse()
    .flatMap((b) => {
      const action = b.actions.find((a) => a._class === "hudson.tasks.junit.TestResultAction");
      if (!action || action.totalCount === undefined) return [];
      const failed = action.failCount ?? 0;
      const skipped = action.skipCount ?? 0;
      const passed = action.totalCount - failed - skipped;
      return [{ build: b.number, passed, failed, skipped, timestamp: b.timestamp }];
    });
}

export async function getRawBanana(module: string, project: string, group: string): Promise<unknown> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved) return { error: "path not resolved" };
  const path = `${resolved.instancePath}${jobPath(group)}/lastBuild/artifact/reports/banana-report.json`;
  const text = await jGetText(path);
  if (!text) return { error: "not found", path };
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function getModules(): Promise<string[]> {
  const data = await jGet<{ jobs: { name: string }[] }>("/api/json?tree=jobs[name]");
  if (!data) return [];
  return data.jobs.filter((j) => j.name.startsWith("G-")).map((j) => j.name);
}

export async function getProjects(module: string): Promise<string[]> {
  const data = await jGet<{ jobs: { name: string }[] }>(
    `${jobPath(module)}/api/json?tree=jobs[name]`
  );
  if (!data) return [];
  return data.jobs.map((j) => j.name);
}

export async function getGroupSummaries(module: string, project: string): Promise<GroupSummary[]> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved) return [];
  const data = await jGet<{ jobs: { name: string }[] }>(`${resolved.instancePath}/api/json?tree=jobs[name]`);
  if (!data) return [];

  const groups = data.jobs.map((j) => j.name);

  const results = await Promise.all(
    groups.map(async (group): Promise<GroupSummary> => {
      const buildBase = `${resolved.instancePath}${jobPath(group)}/lastBuild`;
      const members = parseMembers(group);

      const [build, banana] = await Promise.all([
        jGet<{
          timestamp: number;
          building: boolean;
          result: string | null;
          actions: { _class: string; failCount?: number; skipCount?: number; totalCount?: number }[];
        }>(`${buildBase}/api/json`),
        jGet<{ mark: number; infractions: CodingStyleInfraction[] }>(
          `${buildBase}/artifact/reports/banana-report.json`
        ),
      ]);

      if (!build) {
        return { group, members, passCount: 0, failCount: 0, totalCount: 0, codingStyleMark: 0, codingStyleInfractions: 0, lastBuildAt: null, building: false, result: null };
      }

      const testAction = build.actions.find((a) => a._class === "hudson.tasks.junit.TestResultAction");
      const failCount = testAction?.failCount ?? 0;
      const totalCount = testAction?.totalCount ?? 0;
      const passCount = totalCount - failCount - (testAction?.skipCount ?? 0);

      return {
        group,
        members,
        passCount,
        failCount,
        totalCount,
        codingStyleMark: banana?.mark ?? 0,
        codingStyleInfractions: banana?.infractions?.length ?? 0,
        lastBuildAt: build.timestamp,
        building: build.building,
        result: build.result,
      };
    })
  );

  return results.sort((a, b) => {
    const aRate = a.totalCount > 0 ? a.passCount / a.totalCount : 0;
    const bRate = b.totalCount > 0 ? b.passCount / b.totalCount : 0;
    return bRate - aRate;
  });
}

export async function getGroupDetail(module: string, project: string, group: string): Promise<GroupDetail | null> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved) return null;
  const buildBase = `${resolved.instancePath}${jobPath(group)}/lastBuild`;

  const [testReport, banana, coverageText] = await Promise.all([
    jGet<{
      failCount: number;
      passCount: number;
      skipCount: number;
      suites: {
        name: string;
        cases: {
          name: string;
          className: string;
          status: string;
          errorDetails: string | null;
        }[];
      }[];
    }>(`${buildBase}/testReport/api/json`),
    jGet<{ mark: number; infractions: CodingStyleInfraction[] }>(
      `${buildBase}/artifact/reports/banana-report.json`
    ),
    jGetText(`${buildBase}/artifact/reports/coverage_report.txt`),
  ]);

  if (!testReport) return null;

  const suites: TestSuite[] = testReport.suites.map((s) => ({
    name: s.name,
    cases: s.cases.map((c) => ({
      name: c.name,
      className: c.className,
      status: c.status,
      errorDetails: c.errorDetails ?? null,
    })),
  }));

  return {
    group,
    members: parseMembers(group),
    passCount: testReport.passCount,
    failCount: testReport.failCount,
    totalCount: testReport.failCount + testReport.passCount + testReport.skipCount,
    suites,
    codingStyle: { mark: banana?.mark ?? 0, infractions: banana?.infractions ?? [] },
    coverage: parseCoverage(coverageText ?? ""),
  };
}

export async function triggerAll(module: string, project: string): Promise<boolean> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved || !resolved.triggerJobName) return false;
  const path = `${resolved.yearPath}${jobPath(resolved.triggerJobName)}/build`;
  const crumb = await getCrumb();
  try {
    const res = await fetch(`${JENKINS_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Basic ${AUTH}`, ...crumb },
      redirect: "follow",
    });
    return res.status === 201 || res.status === 200;
  } catch {
    return false;
  }
}

export async function triggerGroup(module: string, project: string, group: string): Promise<boolean> {
  const resolved = await resolveInstancePath(module, project);
  if (!resolved) return false;
  const path = `${resolved.instancePath}${jobPath(group)}/build`;
  const crumb = await getCrumb();
  try {
    const res = await fetch(`${JENKINS_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Basic ${AUTH}`, ...crumb },
      redirect: "follow",
    });
    return res.status === 201 || res.status === 200;
  } catch {
    return false;
  }
}
