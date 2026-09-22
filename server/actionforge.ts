import type { GeoPoint } from "@shared/geoshield";

export type ActionCategory = "immediate" | "preparation" | "avoidance" | "escalation";
export type EvidenceCategory = "verified" | "supported" | "unverified" | "conflicting" | "unknown";

export type ActionRecommendation = {
  id: string;
  category: ActionCategory;
  priority: "now" | "next" | "ready";
  action: string;
  reason: string;
  supportingEvidence: string;
  source: string;
  evidenceCategory: EvidenceCategory;
  confidence: number;
  uncertainty: string;
};

export type EvidenceNode = { id: string; type: string; label: string; category: EvidenceCategory; confidence: number; relevance: number; timestamp: string; source: string; uncertainty: string };
export type EvidenceLink = { from: string; to: string; label: string; category: EvidenceCategory };

const splitPrecautions = (precautions: string) => precautions.split(/\.\s+/).map(item => item.trim()).filter(Boolean).map(item => item.endsWith(".") ? item : `${item}.`);

export function compileActionPlan(input: {
  warning: { title: string; hazardType: string; severity: string; area: string; sourceLabel: string; sourceStatus: string; warningText: string; recommendedPrecautions: string; issuedAt: Date | string; validUntil: Date | string | null };
  affectedZoneRelationship: string;
  riskState: "SAFE" | "WATCH" | "ACTION";
  profile: { displayName: string; householdSize: number; mobilityNeeds: string | null; preferredLanguage: string };
  evidence: Array<{ title: string; publisher: string; evidenceType: string; confidence: number; summary: string; publishedAt: Date | string }>;
  communityReports: Array<{ summary: string; verificationStatus: string; reportedAt: Date | string }>;
}) {
  const precautions = splitPrecautions(input.warning.recommendedPrecautions);
  const officialEvidence = input.evidence.find(item => item.confidence >= 90) ?? input.evidence[0];
  const communityEvidence = input.communityReports.find(item => item.verificationStatus === "corroborated" || item.verificationStatus === "triaged");
  const source = input.warning.sourceLabel;
  const commonReason = `${input.warning.title} affects ${input.warning.area}; ${input.affectedZoneRelationship}`;
  const recommendations: ActionRecommendation[] = [
    { id: "immediate-01", category: "immediate", priority: input.riskState === "ACTION" ? "now" : "next", action: "Move to a safer elevated location if water is approaching or access is deteriorating.", reason: commonReason, supportingEvidence: precautions.find(item => /higher|move|water/i.test(item)) ?? precautions[0] ?? input.warning.warningText, source, evidenceCategory: input.warning.sourceStatus === "simulated" ? "supported" : "verified", confidence: input.warning.sourceStatus === "simulated" ? 76 : 92, uncertainty: "The prototype does not estimate water depth or evacuation time; use current official instructions and local judgment." },
    { id: "preparation-01", category: "preparation", priority: "next", action: "Keep medication, identification, water, a torch, and a charged phone ready for the household.", reason: `Preparedness is adapted for ${input.profile.householdSize} people and ${input.profile.mobilityNeeds ?? "no recorded mobility preference"}.`, supportingEvidence: precautions.find(item => /medication|phone|water|torch|ready/i.test(item)) ?? input.warning.recommendedPrecautions, source, evidenceCategory: "supported", confidence: 82, uncertainty: `Accessibility preference is ${input.profile.preferredLanguage}; no live household inventory is available.` },
    { id: "avoidance-01", category: "avoidance", priority: "now", action: "Do not enter moving floodwater or use the Basin Power underpass.", reason: `The selected location is assessed as ${input.riskState} and the warning covers ${input.warning.area}.`, supportingEvidence: precautions.find(item => /avoid|underpass|moving water|drive|walk/i.test(item)) ?? input.warning.warningText, source, evidenceCategory: input.warning.sourceStatus === "simulated" ? "supported" : "verified", confidence: 88, uncertainty: "Road closures and water depth can change faster than this prototype refreshes." },
    { id: "escalation-01", category: "escalation", priority: "ready", action: "If trapped or unable to evacuate safely, follow the configured official assistance guidance and contact local emergency services.", reason: "Escalation is shown without inventing a responder number or promise of rescue.", supportingEvidence: "No responder handoff or verified local assistance instruction is present in the supplied dataset.", source: "SignalBridge safety boundary", evidenceCategory: "unknown", confidence: 48, uncertainty: "A live, verified emergency contact or responder workflow has not been configured." },
  ];
  return { generatedAt: new Date().toISOString(), isDemo: input.warning.sourceStatus === "simulated", warningTitle: input.warning.title, validity: { issuedAt: input.warning.issuedAt, validUntil: input.warning.validUntil }, recommendations, trustedGuidance: precautions, sourceStatus: input.warning.sourceStatus, disclaimer: "ActionForge compiles supplied guidance; it does not create authoritative emergency instructions or replace official responders." };
}

export function buildEvidenceGraph(input: {
  warning: { title: string; sourceLabel: string; sourceStatus: string; issuedAt: Date | string; area: string; recommendedPrecautions: string };
  riskState: "SAFE" | "WATCH" | "ACTION";
  affectedZoneRelationship: string;
  evidence: Array<{ title: string; publisher: string; evidenceType: string; confidence: number; summary: string; publishedAt: Date | string }>;
  communityReports: Array<{ summary: string; verificationStatus: string; reportedAt: Date | string }>;
  actions: ActionRecommendation[];
}) {
  const nodes: EvidenceNode[] = [];
  const links: EvidenceLink[] = [];
  const addNode = (node: EvidenceNode) => nodes.push(node);
  const addLink = (from: string, to: string, label: string, category: EvidenceCategory) => links.push({ from, to, label, category });
  addNode({ id: "warning", type: "WARNING", label: input.warning.title, category: input.warning.sourceStatus === "simulated" ? "supported" : "verified", confidence: input.warning.sourceStatus === "simulated" ? 76 : 92, relevance: 100, timestamp: new Date(input.warning.issuedAt).toISOString(), source: input.warning.sourceLabel, uncertainty: "Demo warning unless a verified live source is connected." });
  addNode({ id: "source", type: "SOURCE", label: input.warning.sourceLabel, category: input.warning.sourceStatus === "simulated" ? "supported" : "verified", confidence: input.warning.sourceStatus === "simulated" ? 76 : 94, relevance: 100, timestamp: new Date(input.warning.issuedAt).toISOString(), source: input.warning.sourceLabel, uncertainty: input.warning.sourceStatus === "simulated" ? "Source label is part of the demo dataset." : "Source verification depends on the configured official feed." });
  addLink("warning", "source", "published by", input.warning.sourceStatus === "simulated" ? "supported" : "verified");
  addNode({ id: "geo", type: "GEOGRAPHIC RELEVANCE", label: `${input.riskState} · ${input.affectedZoneRelationship}`, category: input.riskState === "SAFE" ? "unknown" : "supported", confidence: input.riskState === "SAFE" ? 72 : 88, relevance: input.riskState === "SAFE" ? 52 : 96, timestamp: new Date().toISOString(), source: "GeoShield geometry", uncertainty: "Uses simulated polygons; not official GIS boundaries." });
  addLink("warning", "geo", "applies to", "supported");
  addNode({ id: "guidance", type: "TRUSTED GUIDANCE", label: input.warning.recommendedPrecautions, category: "supported", confidence: 84, relevance: 94, timestamp: new Date(input.warning.issuedAt).toISOString(), source: input.warning.sourceLabel, uncertainty: "Guidance is displayed from the supplied dataset and is not rewritten." });
  addLink("source", "guidance", "supplies", "supported");
  input.evidence.forEach((item, index) => {
    const category: EvidenceCategory = item.confidence >= 90 ? "verified" : item.confidence >= 70 ? "supported" : "unverified";
    const id = `evidence-${index + 1}`;
    addNode({ id, type: item.evidenceType.toUpperCase(), label: item.title, category, confidence: item.confidence, relevance: item.confidence >= 90 ? 92 : 68, timestamp: new Date(item.publishedAt).toISOString(), source: item.publisher, uncertainty: item.summary });
    addLink("source", id, "corroborates", category);
  });
  input.communityReports.forEach((report, index) => {
    const id = `community-${index + 1}`;
    const category: EvidenceCategory = report.verificationStatus === "corroborated" ? "supported" : report.verificationStatus === "triaged" ? "conflicting" : "unverified";
    addNode({ id, type: "COMMUNITY REPORT", label: report.summary, category, confidence: report.verificationStatus === "corroborated" ? 78 : 54, relevance: 72, timestamp: new Date(report.reportedAt).toISOString(), source: "SignalBridge community reports", uncertainty: report.verificationStatus === "conflicting" ? "Community report is not corroborated by an official depth reading." : "Citizen evidence is contextual, not authoritative." });
    addLink(id, "geo", "reports near", category);
  });
  input.actions.forEach(action => {
    const id = `action-${action.id}`;
    addNode({ id, type: "ACTION RECOMMENDATION", label: action.action, category: action.evidenceCategory, confidence: action.confidence, relevance: 100, timestamp: new Date().toISOString(), source: action.source, uncertainty: action.uncertainty });
    addLink("guidance", id, "compiled into", action.evidenceCategory);
    addLink("geo", id, "prioritizes", action.evidenceCategory);
  });
  return { nodes, links, conflictCount: nodes.filter(node => node.category === "conflicting").length, disclaimer: "TrustMesh exposes conflicts and uncertainty; it does not automatically choose between competing sources." };
}

export const DEFAULT_ACTION_LOCATION: GeoPoint = { lat: 13.111, lng: 80.244 };
