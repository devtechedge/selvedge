export const DEMO_PASSWORD = "SelvedgeDemo!2026";

export const DEMO_ACCOUNTS = [
  {
    email: "manager@selvedge.demo",
    name: "Mara Okonkwo",
    role: "MANAGER",
    label: "Studio manager",
    blurb: "The looms, the people, the released patterns.",
  },
  {
    email: "weaver@selvedge.demo",
    name: "Theo Lindqvist",
    role: "WEAVER",
    label: "Weaver",
    blurb: "Drafts cloth and weaves it pick by pick.",
  },
  {
    email: "dyer@selvedge.demo",
    name: "Ana Ferreira",
    role: "DYER",
    label: "Dyer",
    blurb: "Keeps the dye lots and the recipes.",
  },
] as const;

export function isDemoEmail(email: string): boolean {
  return DEMO_ACCOUNTS.some((account) => account.email === email.toLowerCase());
}