import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHz(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return `${n.toFixed(digits)} Hz`;
}

export function formatPct(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return `${n.toFixed(digits)}%`;
}

export function formatDb(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return `${n.toFixed(digits)} dB`;
}

export function formatSec(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return `${n.toFixed(digits)} s`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
