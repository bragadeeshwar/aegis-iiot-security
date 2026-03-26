/**
 * supabaseMapper.ts
 * ─────────────────────────────────────────────────────────────────
 * Central transformation layer that maps raw Supabase table rows
 * to the frontend's typed interfaces.
 *
 * This decouples the DB schema from the UI types, so renaming a
 * Supabase column only requires a change here.
 * ─────────────────────────────────────────────────────────────────
 */

import type { Device, Threat } from "../types";

// ── Status Mapping ──────────────────────────────────────────────
// Supabase may store: "active", "inactive", "isolated", "warning", "online", "offline"
const DEVICE_STATUS_MAP: Record<string, Device["status"]> = {
  active:   "online",
  online:   "online",
  inactive: "offline",
  offline:  "offline",
  isolated: "isolated",
  quarantine: "isolated",
  warning:  "warning",
  alert:    "warning",
};

function mapDeviceStatus(raw?: string | null): Device["status"] {
  if (!raw) return "offline";
  return DEVICE_STATUS_MAP[raw.toLowerCase()] ?? "offline";
}

// ── Device Mapper ───────────────────────────────────────────────
export function mapDevice(row: Record<string, any>): Device {
  // Generate a deterministic IP from the device name if none stored
  const fallbackIp = generateFallbackIp(row.name ?? "Unknown");

  const status = mapDeviceStatus(row.status);
  let riskScore = typeof row.risk_score === "number" ? row.risk_score : 0;
  
  // Enforce 100 risk score for any device that is completely offline
  if (status === "offline") {
    riskScore = 100;
  }

  return {
    id:        String(row.id ?? ""),
    name:      row.name      ?? "Unknown Device",
    type:      row.type      ?? "Sensor",
    status,
    riskScore,
    lastSeen:  row.last_seen ?? row.updated_at ?? row.created_at ?? "—",
    ip:        row.ip        ?? row.ip_address ?? fallbackIp,
    location:  row.location  ?? row.zone ?? "Unknown Zone",
  };
}

export function mapDevices(rows: Record<string, any>[]): Device[] {
  return (rows ?? []).map(mapDevice);
}

// ── Threat Mapper ───────────────────────────────────────────────
const THREAT_STATUS_MAP: Record<string, Threat["status"]> = {
  active:       "active",
  open:         "active",
  new:          "active",
  investigating: "investigating",
  mitigated:    "mitigated",
  resolved:     "mitigated",
  closed:       "mitigated",
};

function mapThreatStatus(raw?: string | null): Threat["status"] {
  if (!raw) return "active";
  return THREAT_STATUS_MAP[raw.toLowerCase()] ?? "active";
}

const THREAT_SEVERITY_MAP: Record<string, Threat["severity"]> = {
  critical: "critical",
  high:     "high",
  medium:   "medium",
  med:      "medium",
  low:      "low",
  info:     "low",
};

function mapThreatSeverity(raw?: string | null): Threat["severity"] {
  if (!raw) return "medium";
  return THREAT_SEVERITY_MAP[raw.toLowerCase()] ?? "medium";
}

export function mapThreat(row: Record<string, any>): Threat {
  return {
    id:             String(row.id ?? ""),
    name:           row.name        ?? row.title      ?? "Unknown Threat",
    severity:       mapThreatSeverity(row.severity),
    status:         mapThreatStatus(row.status),
    timestamp:      row.timestamp   ?? row.created_at ?? new Date().toISOString(),
    source:         row.source      ?? row.source_ip  ?? "Unknown",
    target:         row.target      ?? row.target_device ?? "—",
    description:    row.description ?? row.summary    ?? "No details available.",
    mitreTactic:    row.mitre_tactic    ?? row.tactic     ?? undefined,
    mitreTechnique: row.mitre_technique ?? row.technique  ?? undefined,
  };
}

export function mapThreats(rows: Record<string, any>[]): Threat[] {
  return (rows ?? []).map(mapThreat);
}

// ── Helpers ─────────────────────────────────────────────────────
/**
 * Generates a deterministic-looking fake IP from a device name
 * when the Supabase row doesn't have an ip column.
 */
function generateFallbackIp(name: string): string {
  // Simple hash → last 2 octets
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  const third  = 1 + (Math.abs(hash) % 254);
  const fourth = 1 + (Math.abs(hash >> 8) % 254);
  return `192.168.${third}.${fourth}`;
}
