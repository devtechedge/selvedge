import { z } from "zod";
import { FINISHING_METHODS, RESERVATION_REASONS, ROLES, STRUCTURES } from "@/domain/types";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email.");
export const passwordSchema = z.string().min(10, "Use at least 10 characters.");

const positiveInt = (label: string, max = 100000) =>
  z.coerce.number().int(`${label} must be a whole number.`).min(1, `${label} must be at least 1.`).max(max);

export const threadingSchema = z.array(z.number().int().min(0)).max(2000);
export const treadlingSchema = z.array(z.number().int().min(0)).max(4000);
export const tieUpSchema = z.array(z.array(z.boolean()).max(32)).max(64);
export const colorListSchema = z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.")).max(4000);

export const createDraftSchema = z.object({
  name: z.string().trim().min(1, "Name the draft.").max(120),
  structure: z.enum(STRUCTURES),
  ends: positiveInt("Warp ends", 2000),
  picks: positiveInt("Weft picks", 4000),
  settEpi: positiveInt("Sett", 200),
  reedWidthCm: positiveInt("Reed width", 500),
  warpLengthCm: positiveInt("Warp length", 2000),
  takeUpPct: z.coerce.number().int().min(0).max(50),
  shrinkagePct: z.coerce.number().int().min(0).max(50),
});

export const saveDraftSchema = z.object({
  draftId: z.string().min(1),
  expectedRevision: positiveInt("Revision"),
  name: z.string().trim().min(1).max(120),
  shafts: z.coerce.number().int().min(2).max(32),
  treadles: z.coerce.number().int().min(1).max(64),
  ends: positiveInt("Warp ends", 2000),
  picks: positiveInt("Weft picks", 4000),
  threading: threadingSchema,
  tieUp: tieUpSchema,
  treadling: treadlingSchema,
  warpColors: colorListSchema,
  weftColors: colorListSchema,
  settEpi: positiveInt("Sett", 200),
  reedWidthCm: positiveInt("Reed width", 500),
  warpLengthCm: positiveInt("Warp length", 2000),
  takeUpPct: z.coerce.number().int().min(0).max(50),
  shrinkagePct: z.coerce.number().int().min(0).max(50),
});

export const reserveYarnSchema = z.object({
  projectId: z.string().min(1),
  yarnLotId: z.string().min(1),
  lengthM: positiveInt("Length", 100000),
  reason: z.enum(RESERVATION_REASONS),
});

export const yarnLotSchema = z.object({
  code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9-]+$/, "Use uppercase letters, digits and hyphens."),
  name: z.string().trim().min(1).max(120),
  fiber: z.string().trim().min(1).max(40),
  dyeRecipe: z.string().trim().min(1).max(240),
  colorName: z.string().trim().min(1).max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color."),
  lengthOnHandM: z.coerce.number().int().min(0).max(1000000),
  reorderM: z.coerce.number().int().min(0).max(100000),
  lotNumber: z.string().trim().min(1).max(40),
});

export const intakeSchema = z.object({
  yarnLotId: z.string().min(1),
  meters: positiveInt("Meters", 100000),
});

export const createProjectSchema = z.object({
  draftId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

export const assignLoomSchema = z.object({
  projectId: z.string().min(1),
  loomId: z.string().min(1),
});

export const weaveSchema = z.object({
  projectId: z.string().min(1),
  picks: positiveInt("Picks", 4000),
});

export const finishSchema = z.object({
  projectId: z.string().min(1),
  method: z.enum(FINISHING_METHODS),
  measuredShrinkagePct: z.coerce.number().int().min(0).max(80),
  finalWidthCm: positiveInt("Final width", 1000),
  finalLengthCm: positiveInt("Final length", 5000),
  notes: z.string().trim().max(500),
});

export const releaseSchema = z.object({
  draftId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

export const loomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  shafts: z.coerce.number().int().min(2).max(32),
  treadles: z.coerce.number().int().min(1).max(64),
  reedWidthCm: positiveInt("Reed width", 500),
});

export const roleSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(ROLES),
});