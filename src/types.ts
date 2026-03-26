export type DeviceStatus = "online" | "offline" | "isolated" | "warning";
export type ThreatSeverity = "critical" | "high" | "medium" | "low";

export interface Device {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  riskScore: number;
  lastSeen: string;
  ip: string;
  location: string;
}

export interface Threat {
  id: string;
  name: string;
  severity: ThreatSeverity;
  status: "active" | "mitigated" | "investigating";
  timestamp: string;
  source: string;
  target: string;
  description: string;
  mitreTactic?: string;
  mitreTechnique?: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: "device" | "gateway" | "server";
  status: DeviceStatus;
}

export interface NetworkLink {
  source: string;
  target: string;
  traffic: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
