export type CrowdPulseVerification = "COMMUNITY-REPORTED" | "PENDING VERIFICATION" | "SUPPORTED" | "CONFLICTING";

export type CitizenIncidentReport = {
  id: string;
  reportText: string;
  location: { name: string; lat: number; lng: number };
  timestamp: string;
  category: "ROAD FLOODING" | "ACCESS" | "POWER" | "SHELTER";
  source: "COMMUNITY REPORT" | "COMMUNITY MODERATOR";
  verificationStatus: CrowdPulseVerification;
};

export type IncidentCluster = {
  id: string;
  title: string;
  relatedReportIds: string[];
  reportCount: number;
  geographicSpreadKm: number;
  latestReportTime: string;
  representativeSummary: string;
  verificationStatus: CrowdPulseVerification;
  semanticSimilarity: number;
  isOfficialWarning: false;
  disclaimer: string;
};

export const DEMO_CROWD_REPORTS: CitizenIncidentReport[] = [
  { id: "cp-001", reportText: "Water is covering the service lane near Perambur flyover; two-wheelers are being turned back.", location: { name: "Perambur Flyover service road", lat: 13.111, lng: 80.244 }, timestamp: "2026-09-22T06:25:00.000Z", category: "ROAD FLOODING", source: "COMMUNITY REPORT", verificationStatus: "PENDING VERIFICATION" },
  { id: "cp-002", reportText: "Floodwater is pooling beside the bus corridor and buses are slowing near Perambur station.", location: { name: "Perambur bus corridor", lat: 13.109, lng: 80.247 }, timestamp: "2026-09-22T06:31:00.000Z", category: "ROAD FLOODING", source: "COMMUNITY REPORT", verificationStatus: "SUPPORTED" },
  { id: "cp-003", reportText: "Service road water is getting deeper by the flyover. Please avoid the low section.", location: { name: "Perambur Flyover approach", lat: 13.114, lng: 80.241 }, timestamp: "2026-09-22T06:38:00.000Z", category: "ROAD FLOODING", source: "COMMUNITY MODERATOR", verificationStatus: "CONFLICTING" },
  { id: "cp-004", reportText: "The bus shelter is open but the approach road is partly blocked by parked vehicles.", location: { name: "Ayanavaram bus stop", lat: 13.099, lng: 80.238 }, timestamp: "2026-09-22T06:10:00.000Z", category: "ACCESS", source: "COMMUNITY REPORT", verificationStatus: "SUPPORTED" },
  { id: "cp-005", reportText: "Street lighting is intermittent near the Purasawalkam market junction.", location: { name: "Purasawalkam High Road", lat: 13.088, lng: 80.256 }, timestamp: "2026-09-22T05:52:00.000Z", category: "POWER", source: "COMMUNITY REPORT", verificationStatus: "COMMUNITY-REPORTED" },
  { id: "cp-006", reportText: "Low visibility reported around the market junction; source is not independently verified.", location: { name: "Purasawalkam market junction", lat: 13.089, lng: 80.255 }, timestamp: "2026-09-22T06:03:00.000Z", category: "POWER", source: "COMMUNITY REPORT", verificationStatus: "PENDING VERIFICATION" },
];

const STOP_WORDS = new Set(["the", "is", "near", "by", "and", "a", "to", "of", "are", "on", "with", "this", "not"]);
const tokens = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(word => word.length > 2 && !STOP_WORDS.has(word)));

export function semanticSimilarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right);
  const intersection = Array.from(a).filter(token => b.has(token)).length;
  const union = new Set(Array.from(a).concat(Array.from(b))).size;
  return union ? Math.round((intersection / union) * 100) : 0;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad; const dLng = (b.lng - a.lng) * rad;
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

function clusterStatus(reports: CitizenIncidentReport[]): CrowdPulseVerification {
  if (reports.some(report => report.verificationStatus === "CONFLICTING")) return "CONFLICTING";
  if (reports.some(report => report.verificationStatus === "SUPPORTED")) return "SUPPORTED";
  if (reports.some(report => report.verificationStatus === "PENDING VERIFICATION")) return "PENDING VERIFICATION";
  return "COMMUNITY-REPORTED";
}

export function buildIncidentClusters(reports = DEMO_CROWD_REPORTS): IncidentCluster[] {
  const groups: CitizenIncidentReport[][] = [];
  for (const report of reports) {
    const target = groups.find(group => {
      const anchor = group[0]!;
      return anchor.category === report.category && distanceKm(anchor.location, report.location) <= 1.2;
    });
    if (target) target.push(report); else groups.push([report]);
  }
  return groups.map((group, index) => {
    const latest = [...group].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]!;
    const anchor = group[0]!;
    const spread = Math.max(...group.map(report => distanceKm(anchor.location, report.location)));
    const similarity = group.length > 1 ? Math.round(group.slice(1).reduce((sum, report) => sum + semanticSimilarity(anchor.reportText, report.reportText), 0) / (group.length - 1)) : 0;
    const title = anchor.category === "ROAD FLOODING" ? "Road flooding near Chennai bus corridor" : anchor.category === "POWER" ? "Low-visibility reports near Purasawalkam market" : `${anchor.category[0]}${anchor.category.slice(1).toLowerCase()} reports near Chennai transit routes`;
    return { id: `cluster-${index + 1}`, title, relatedReportIds: group.map(report => report.id), reportCount: group.length, geographicSpreadKm: Number(spread.toFixed(2)), latestReportTime: latest.timestamp, representativeSummary: latest.reportText, verificationStatus: clusterStatus(group), semanticSimilarity: similarity, isOfficialWarning: false, disclaimer: "Community intelligence only; this cluster never becomes an official warning automatically." };
  });
}

export function getCrowdPulseBundle() {
  const clusters = buildIncidentClusters();
  return { reports: DEMO_CROWD_REPORTS, clusters, disclaimer: "CrowdPulse groups noisy citizen signals for local context. Citizen reports are not official warnings and are never promoted automatically." };
}
