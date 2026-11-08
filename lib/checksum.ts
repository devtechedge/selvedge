import { createHash } from "node:crypto";

// Postgres jsonb does not preserve object key order, so a release checksum must
// be computed over a canonical form. Sorting keys recursively makes the hash
// stable across a database round-trip while array order is kept intact.
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(obj)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canonicalJson(obj[key]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}

export function checksumSnapshot(snapshot: unknown): string {
  return createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
}