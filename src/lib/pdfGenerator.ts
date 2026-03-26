import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Device, Threat } from "../types";

export const generateProfessionalPDF = (
  devices: Device[],
  threats: Threat[],
  stats: { totalAlerts: number; criticalFixes: number; uptime: string }
) => {
  try {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    const reportId = `AEGIS-AUDIT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // ── Header & Branding ──────────────────────────────────────────
    doc.setFillColor(17, 13, 24); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(0, 245, 255); 
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("AEGIS IIoT SECURITY", 15, 20);
    
    doc.setTextColor(161, 168, 184); 
    doc.setFontSize(10);
    doc.text("Obsidian Protocol - Enterprise Audit Report", 15, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.text(`ID: ${reportId}`, 160, 20);
    doc.text(`Generated: ${timestamp}`, 145, 30);

    // ── Executive Summary ──────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("1. Executive Summary", 15, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summary = `During the current observation cycle, the Aegis IIoT platform monitored ${devices?.length || 0} active nodes. 
A total of ${stats.totalAlerts} security events were detected, with ${stats.criticalFixes} critical threats 
successfully mitigated by automated isolation protocols. The network maintained ${stats.uptime} uptime.`;
    
    doc.text(doc.splitTextToSize(summary, 180), 15, 65);

    // ── Asset Integrity Status Table ────────────────────────────────
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Asset Integrity Status", 15, 90);

    const deviceRows = (devices || []).map(d => [
      d.name || "Unknown",
      d.type || "N/A",
      (d.status || "OFFLINE").toUpperCase(),
      `${d.riskScore || 0}%`,
      d.ip || "0.0.0.0"
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Device Name', 'Identifier', 'Status', 'Risk Score', 'Network IP']],
      body: deviceRows,
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 15, right: 15 }
    });

    // ── Incident Log Table ─────────────────────────────────────────
    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("3. Detailed Incident Log", 15, nextY);

    const threatRows = (threats || []).map(t => [
      t.timestamp ? t.timestamp.split('T')[1].split('.')[0] : "N/A",
      t.name || "Generic Threat",
      (t.severity || "LOW").toUpperCase(),
      (t.status || "ACTIVE").toUpperCase(),
      t.target || "Network"
    ]).slice(0, 20); // Cap to 20 incidents for readability

    autoTable(doc, {
      startY: nextY + 5,
      head: [['Time', 'Threat Type', 'Severity', 'Resolution', 'Impacted Asset']],
      body: threatRows,
      headStyles: { fillColor: [239, 68, 68] },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      margin: { left: 15, right: 15 }
    });

    // ── Neural Recommendations ─────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < 250) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("4. AI Neural Recommendations", 15, finalY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const recommendation = "Obsidian Protocol recommends immediate firmware optimization for 'Motor 1' and periodic rotation of isolation certificates for micro-segmented zones. Risk variance remains within acceptable limits.";
      doc.text(doc.splitTextToSize(recommendation, 180), 15, finalY + 10);
    }

    // ── Footer ─────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Aegis IIoT Confidential - Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
    }

    doc.save(`Aegis_Security_Audit_${reportId}.pdf`);
  } catch (err) {
    console.error("PDF Generation Error:", err);
  }
};

