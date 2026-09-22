import { DEMO_RAW_ALERT } from "./signalcore";
import { transformActionPlan } from "./accessbridge";
import { compileActionPlan } from "./actionforge";
import { assessRisk } from "./geoshield";
import { getSignalSnapshot } from "./db";
import { SHELTERS, WARNING_ZONES } from "@shared/geoshield";

export async function getResilienceVaultBundle() {
  const snapshot = await getSignalSnapshot();
  const warning = snapshot.warnings.find(item => item.status === "active") ?? snapshot.warnings[0];
  const assessment = assessRisk({ lat: 13.111, lng: 80.244 });
  const compiled = compileActionPlan({ warning, affectedZoneRelationship: assessment.affectedZoneRelationship, riskState: assessment.state, profile: snapshot.profile, evidence: snapshot.evidence, communityReports: snapshot.citizenReports });
  const contact = snapshot.profile.emergencyContact ?? "Trusted contact · Not recorded";
  return {
    cacheKey: "signalbridge:resilience-vault:v1",
    lastSynchronizedAt: new Date("2026-09-22T06:32:00+05:30"),
    syncStatus: "SIMULATED LAST SYNC",
    warning: { alertId: DEMO_RAW_ALERT.alertId, hazard: DEMO_RAW_ALERT.hazardType, severity: DEMO_RAW_ALERT.severity, affectedArea: DEMO_RAW_ALERT.affectedArea, text: DEMO_RAW_ALERT.warningText, source: DEMO_RAW_ALERT.source, sourceStatus: DEMO_RAW_ALERT.sourceStatus, expiryTime: DEMO_RAW_ALERT.expiryTime },
    essentialInstructions: compiled.recommendations.map(action => ({ category: action.category, priority: action.priority, text: action.action, source: action.source, confidence: action.confidence })),
    tamilActionCards: transformActionPlan(compiled.recommendations).map(action => ({ category: action.category, text: action.tamil, voiceText: action.voiceText })),
    emergencyContacts: [{ name: "Local emergency services", number: "112", note: "Use if in immediate danger; this demo does not place calls." }, { name: contact.split(" · ")[0] ?? "Trusted contact", number: contact.split(" · ")[1] ?? "Not recorded", note: "Trusted contact from the demo profile." }],
    shelters: SHELTERS.map(shelter => ({ name: shelter.name, address: shelter.address, status: shelter.status, point: shelter.point })),
    mapInformation: { warningZones: WARNING_ZONES.map(zone => ({ id: zone.id, name: zone.name, severity: zone.severity, points: zone.points })), selectedDemoLocation: { lat: 13.111, lng: 80.244 }, riskState: assessment.state, disclaimer: "Map information is cached demonstration geometry, not live routing or a current evacuation map." },
    disclaimer: "ResilienceVault only shows the last synchronized emergency information. Cached content is not live, and this prototype does not dispatch responders or guarantee emergency-service availability.",
  };
}
