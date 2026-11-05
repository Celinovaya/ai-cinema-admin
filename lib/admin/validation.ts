import type { Section } from "./sections";

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function validateValues(section: Section, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid form values.");
  const source = input as Record<string, unknown>;
  if (Object.keys(source).some((key) => !section.fields.some((field) => field.name === key))) {
    throw new Error("This form contains fields that cannot be edited.");
  }
  const values: Record<string, string | number | boolean | null> = {};
  for (const field of section.fields) {
    const raw = source[field.name];
    if (field.type === "boolean") {
      if (typeof raw !== "boolean") throw new Error(`${field.label} must be true or false.`);
      values[field.name] = raw;
      continue;
    }
    if (typeof raw !== "string" && typeof raw !== "number" && raw != null) throw new Error(`${field.label} is invalid.`);
    const value = String(raw ?? "").trim();
    if (!value) {
      if (field.required) throw new Error(`${field.label} is required.`);
      values[field.name] = null;
      continue;
    }
    if (value.length > 100000) throw new Error(`${field.label} is too long (maximum 100,000 characters).`);
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) throw new Error(`${field.label} is outside the allowed range.`);
      if (field.step === "1" && !Number.isInteger(number)) throw new Error(`${field.label} must be a whole number.`);
      if (field.step === "0.01" && Math.abs(number * 100 - Math.round(number * 100)) > 0.000001) throw new Error(`${field.label} allows up to two decimal places.`);
      values[field.name] = number;
    } else if (field.type === "provider") {
      if (!isUuid(value)) throw new Error("Please select a valid provider.");
      values[field.name] = value;
    } else if (field.type === "domain") {
      const domain = value.toLowerCase();
      if (domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domain)) throw new Error("Enter a domain such as example.com, without @, paths, or a protocol.");
      values[field.name] = domain;
    } else if (field.type === "email") {
      if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Enter a valid email address.");
      values[field.name] = value.toLowerCase();
    } else if (field.type === "url") {
      let url: URL;
      try { url = new URL(value); } catch { throw new Error("Enter a valid HTTP or HTTPS URL."); }
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("Use an HTTP(S) base URL without credentials, query parameters, or fragments.");
      values[field.name] = value;
    } else {
      values[field.name] = value;
    }
  }
  return values;
}

export function databaseMessage(code?: string) {
  if (code === "23505") return "A record with this unique value already exists.";
  if (code === "23503") return "This record references a missing record, or is still used by another record. Check its relationships before trying again.";
  if (code === "42501") return "Database access was denied. Verify the superadmin RLS policies for this table.";
  if (code === "PGRST116") return "The record no longer exists or your access has changed. Refresh and try again.";
  return "The database request failed. Check the connection, table permissions, and field values, then try again.";
}
