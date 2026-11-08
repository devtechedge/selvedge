const DEFAULT_SITE_URL = "http://localhost:3000";

try {
  process.loadEnvFile();
} catch {
  // CI and Vercel provide the environment directly.
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  sessionPepper: required("SESSION_PEPPER"),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, ""),
  demoMode: process.env.DEMO_MODE !== "0",
  commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "dev",
  isProduction: process.env.NODE_ENV === "production",
};

export function siteUrl(): string {
  return env.siteUrl;
}