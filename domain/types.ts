export const ROLES = ["WEAVER", "DYER", "MANAGER"] as const;
export type Role = (typeof ROLES)[number];

export const PROJECT_STATUSES = ["WARP", "THREADED", "WEAVING", "FINISHED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const LOOM_STATUSES = ["AVAILABLE", "DRESSED", "MAINTENANCE"] as const;
export type LoomStatus = (typeof LOOM_STATUSES)[number];

export const RESERVATION_REASONS = ["WARP", "WEFT", "ADJUSTMENT", "RELEASE"] as const;
export type ReservationReason = (typeof RESERVATION_REASONS)[number];

export const STRUCTURES = [
  "plain",
  "twill22",
  "twill31",
  "satin5",
  "basket",
  "herringbone",
  "waffle",
] as const;
export type Structure = (typeof STRUCTURES)[number];

export const STRUCTURE_LABELS: Record<Structure, string> = {
  plain: "Plain weave",
  twill22: "2/2 twill",
  twill31: "3/1 twill",
  satin5: "5-end satin",
  basket: "Basket weave",
  herringbone: "Herringbone",
  waffle: "Waffle",
};

export const FINISHING_METHODS = ["wet-finish", "steam", "press", "none"] as const;
export type FinishingMethod = (typeof FINISHING_METHODS)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function isStructure(value: string): value is Structure {
  return (STRUCTURES as readonly string[]).includes(value);
}