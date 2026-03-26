import { Device, Threat, NetworkNode, NetworkLink } from "./types";

export const devices: Device[] = [
  { id: "1", name: "PLC-01-Assembly", type: "PLC", status: "online", riskScore: 12, lastSeen: "2026-03-24 13:00", ip: "192.168.1.10", location: "Floor A" },
  { id: "2", name: "HMI-02-Control", type: "HMI", status: "warning", riskScore: 45, lastSeen: "2026-03-24 13:05", ip: "192.168.1.11", location: "Floor A" },
  { id: "3", name: "Sensor-03-Temp", type: "Sensor", status: "online", riskScore: 5, lastSeen: "2026-03-24 13:10", ip: "192.168.1.12", location: "Floor B" },
  { id: "4", name: "Gateway-Main", type: "Gateway", status: "online", riskScore: 8, lastSeen: "2026-03-24 13:15", ip: "192.168.1.1", location: "Server Room" },
  { id: "5", name: "PLC-04-Packaging", type: "PLC", status: "isolated", riskScore: 88, lastSeen: "2026-03-24 12:45", ip: "192.168.1.15", location: "Floor C" },
  { id: "6", name: "Robot-Arm-01", type: "Actuator", status: "online", riskScore: 15, lastSeen: "2026-03-24 13:12", ip: "192.168.1.20", location: "Floor B" },
];

export const threats: Threat[] = [
  { 
    id: "T1", 
    name: "Unauthorized Access Attempt", 
    severity: "high", 
    status: "active", 
    timestamp: "2026-03-24 13:10", 
    source: "10.0.0.55", 
    target: "PLC-04-Packaging", 
    description: "Multiple failed login attempts detected from an external IP.",
    mitreTactic: "Initial Access (TA0001)",
    mitreTechnique: "Brute Force (T1110)"
  },
  { 
    id: "T2", 
    name: "DDoS Anomaly", 
    severity: "critical", 
    status: "investigating", 
    timestamp: "2026-03-24 13:05", 
    source: "Internal Network", 
    target: "Gateway-Main", 
    description: "High volume of UDP traffic detected targeting the main gateway.",
    mitreTactic: "Impact (TA0040)",
    mitreTechnique: "Endpoint Denial of Service (T1499)"
  },
  { 
    id: "T3", 
    name: "Firmware Tampering", 
    severity: "medium", 
    status: "mitigated", 
    timestamp: "2026-03-24 12:30", 
    source: "Unknown", 
    target: "Sensor-03-Temp", 
    description: "Hash mismatch detected in the latest firmware update.",
    mitreTactic: "Persistence (TA0003)",
    mitreTechnique: "System Firmware (T1542.001)"
  },
];

export const networkData: { nodes: NetworkNode[]; links: NetworkLink[] } = {
  nodes: [
    { id: "1", name: "PLC-01", type: "device", status: "online" },
    { id: "2", name: "HMI-02", type: "device", status: "warning" },
    { id: "3", name: "Sensor-03", type: "device", status: "online" },
    { id: "4", name: "Gateway", type: "gateway", status: "online" },
    { id: "5", name: "PLC-04", type: "device", status: "isolated" },
    { id: "6", name: "Server", type: "server", status: "online" },
  ],
  links: [
    { source: "1", target: "4", traffic: 50 },
    { source: "2", target: "4", traffic: 30 },
    { source: "3", target: "4", traffic: 10 },
    { source: "4", target: "6", traffic: 100 },
    { source: "5", target: "4", traffic: 5 },
  ],
};
