import { describe, expect, it } from "vitest";
import { assessRisk, pointInPolygon } from "./geoshield";
import { appRouter } from "./routers";
import { getSignalSnapshot } from "./db";
import { DEMO_RAW_ALERT, interpretAlert } from "./signalcore";
import { buildEvidenceGraph, compileActionPlan } from "./actionforge";
import { fetchOfficialWarnings, liveIntegrationStatus } from "./liveSources";
import { buildIncidentClusters, DEMO_CROWD_REPORTS, getCrowdPulseBundle, semanticSimilarity } from "./crowdpulse";
import { buildAccessBridgeBundle, transformActionPlan } from "./accessbridge";
import { getSafeLoopState, updateSafeLoopStatus } from "./safeloop";
import { getResilienceVaultBundle } from "./resiliencevault";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("SignalBridge demo snapshot", () => {
  it("provides a complete, evidence-linked flood response snapshot", async () => {
    const snapshot = await getSignalSnapshot();
    expect(snapshot.warnings.length).toBeGreaterThan(0);
    expect(snapshot.evidence.length).toBeGreaterThan(0);
    expect(snapshot.actionPlans.length).toBeGreaterThan(0);
    expect(snapshot.citizenReports.length).toBeGreaterThan(0);
    expect(snapshot.profile.homeArea).toContain("Chennai");
    expect(snapshot.safety.state).toBeDefined();
    expect(snapshot.warnings[0]?.alertId).toBeDefined();
    expect(snapshot.warnings[0]?.recommendedPrecautions).toContain("Avoid");
  });

  it("exposes the same demo data through the public tRPC procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const snapshot = await caller.signalbridge.snapshot();
    expect(snapshot.warnings[0]?.hazardType).toBe("Urban flooding");
    expect(snapshot.evidence[0]?.confidence).toBeGreaterThan(0);
    expect(snapshot.actionPlans.some(plan => plan.priority === "now")).toBe(true);
  });
});

describe("SignalCore", () => {
  it("turns raw demo input into a structured, explicitly demo-labeled alert", () => {
    const structured = interpretAlert(DEMO_RAW_ALERT);
    expect(structured.hazard).toBe("Urban flooding");
    expect(structured.affectedZones).toEqual(["Perambur", "Purasawalkam", "Basin Power"]);
    expect(structured.extractedInstructions).toContain("Avoid underpasses");
    expect(structured.sourceStatus).toBe("simulated");
    expect(structured.intelligenceStatus).toBe("DEMO INTERPRETATION");
    expect(structured.confidence).toBe(76);
  });
});

describe("GeoShield", () => {
  it("uses point-in-polygon geometry to return ACTION, WATCH, and SAFE", () => {
    expect(assessRisk({ lat: 13.111, lng: 80.244 }).state).toBe("ACTION");
    expect(assessRisk({ lat: 13.070, lng: 80.250 }).state).toBe("WATCH");
    expect(assessRisk({ lat: 13.085, lng: 80.210 }).state).toBe("SAFE");
  });

  it("returns a relevant shelter, matched zones, and boundary distance", () => {
    const assessment = assessRisk({ lat: 13.111, lng: 80.244 });
    expect(assessment.matchedZoneIds).toContain("north-chennai-flood-zone");
    expect(assessment.nearestShelter.name).toContain("Perambur");
    expect(assessment.distanceToAffectedBoundaryKm).toBeGreaterThan(0);
    expect(assessment.isDemo).toBe(true);
  });

  it("supports the public risk assessment procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const assessment = await caller.signalbridge.riskAssessment({ lat: 13.085, lng: 80.210 });
    expect(assessment.state).toBe("SAFE");
    expect(assessment.disclaimer).toContain("not a real-time emergency prediction");
  });

  it("recognizes a point inside a polygon and rejects a point outside", () => {
    const polygon = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }, { lat: 1, lng: 0 }];
    expect(pointInPolygon({ lat: 0.5, lng: 0.5 }, polygon)).toBe(true);
    expect(pointInPolygon({ lat: 2, lng: 2 }, polygon)).toBe(false);
  });
});

describe("ActionForge and TrustMesh", () => {
  it("compiles exactly four traceable action categories from supplied guidance", async () => {
    const snapshot = await getSignalSnapshot();
    const assessment = assessRisk({ lat: 13.111, lng: 80.244 });
    const compiled = compileActionPlan({ warning: snapshot.warnings[0]!, affectedZoneRelationship: assessment.affectedZoneRelationship, riskState: assessment.state, profile: snapshot.profile, evidence: snapshot.evidence, communityReports: snapshot.citizenReports });
    expect(compiled.recommendations.map(action => action.category)).toEqual(["immediate", "preparation", "avoidance", "escalation"]);
    expect(compiled.recommendations.every(action => action.action && action.reason && action.supportingEvidence && action.source && action.uncertainty)).toBe(true);
    expect(compiled.disclaimer).toContain("does not create authoritative");
  });

  it("keeps conflict visible instead of auto-resolving community evidence", async () => {
    const snapshot = await getSignalSnapshot();
    const assessment = assessRisk({ lat: 13.111, lng: 80.244 });
    const compiled = compileActionPlan({ warning: snapshot.warnings[0]!, affectedZoneRelationship: assessment.affectedZoneRelationship, riskState: assessment.state, profile: snapshot.profile, evidence: snapshot.evidence, communityReports: snapshot.citizenReports });
    const graph = buildEvidenceGraph({ warning: snapshot.warnings[0]!, riskState: assessment.state, affectedZoneRelationship: assessment.affectedZoneRelationship, evidence: snapshot.evidence, communityReports: snapshot.citizenReports, actions: compiled.recommendations });
    expect(graph.nodes.some(node => node.category === "conflicting")).toBe(true);
    expect(graph.disclaimer).toContain("does not automatically choose");
    expect(graph.nodes.filter(node => node.type === "ACTION RECOMMENDATION")).toHaveLength(4);
  });

  it("exposes the compiled plan and evidence graph through tRPC", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const plan = await caller.signalbridge.actionForge({ lat: 13.111, lng: 80.244 });
    const graph = await caller.signalbridge.evidenceGraph({ lat: 13.111, lng: 80.244 });
    expect(plan.recommendations).toHaveLength(4);
    expect(graph.links.length).toBeGreaterThan(4);
  });
});

describe("Live source integrations", () => {
  it("reports configured providers and never presents the demo feed as live", () => {
    const status = liveIntegrationStatus();
    expect(status.officialWarnings.verification).toMatch(/not configured|allowlisted|rejected/);
    expect(status.geocoder.provider).toContain("nominatim");
    expect(status.routing.provider).toContain("router.project-osrm.org");
  });

  it("fails closed to an explicit unconfigured official feed state", async () => {
    const result = await fetchOfficialWarnings();
    expect(result.warnings).toEqual([]);
    expect(["unconfigured", "rejected", "error", "connected"]).toContain(result.status);
    if (result.status === "unconfigured") expect(result.message).toContain("Demo warnings remain active");
  });
});

describe("CrowdPulse", () => {
  it("groups semantically similar reports using geographic proximity", () => {
    expect(semanticSimilarity("water near Perambur bus corridor", "floodwater beside Perambur bus corridor")).toBeGreaterThan(20);
    const clusters = buildIncidentClusters(DEMO_CROWD_REPORTS);
    const floodCluster = clusters.find(cluster => cluster.title === "Road flooding near Chennai bus corridor");
    expect(floodCluster?.reportCount).toBe(3);
    expect(floodCluster?.geographicSpreadKm).toBeGreaterThan(0);
    expect(floodCluster?.verificationStatus).toBe("CONFLICTING");
    expect(floodCluster?.isOfficialWarning).toBe(false);
  });

  it("keeps source fields and explicit non-official safety boundaries", () => {
    const bundle = getCrowdPulseBundle();
    expect(bundle.reports.every(report => report.reportText && report.location.lat && report.location.lng && report.timestamp && report.category && report.source && report.verificationStatus)).toBe(true);
    expect(bundle.disclaimer).toContain("not official warnings");
    expect(bundle.clusters.every(cluster => cluster.isOfficialWarning === false && cluster.disclaimer.includes("never becomes an official warning"))).toBe(true);
  });

  it("exposes clustered citizen intelligence through tRPC", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const bundle = await caller.signalbridge.crowdPulse();
    expect(bundle.clusters.length).toBeGreaterThan(1);
    expect(bundle.reports).toHaveLength(6);
  });
});

describe("AccessBridge", () => {
  it("keeps the same action count and safety meaning across English, Tamil, and simplified outputs", async () => {
    const snapshot = await getSignalSnapshot();
    const bundle = await appRouter.createCaller(createPublicContext()).signalbridge.actionForge({ lat: 13.111, lng: 80.244 });
    const transformed = transformActionPlan(bundle.recommendations);
    expect(transformed).toHaveLength(4);
    expect(transformed[0]?.standardEnglish).toContain("safer elevated location");
    expect(transformed[0]?.tamil).toContain("பாதுகாப்பான");
    expect(transformed[0]?.simplifiedEnglish).toContain("higher safe place");
    expect(transformed.every(action => action.safetyMeaning.includes("same supplied safety meaning"))).toBe(true);
    expect(snapshot.actionPlans.length).toBeGreaterThan(0);
  });

  it("returns a browser-native voice boundary instead of inventing a paid voice provider", async () => {
    const bundle = await appRouter.createCaller(createPublicContext()).signalbridge.accessBridge();
    expect(bundle.supportedLanguages).toEqual(["English", "Tamil", "Simplified English"]);
    expect(bundle.voice.provider).toBe("Browser SpeechSynthesis");
    expect(bundle.disclaimer).toContain("does not create new emergency instructions");
  });
});

describe("SafeLoop", () => {
  it("stores a selected status with a timestamp and appends the user response timeline event", () => {
    const before = getSafeLoopState();
    const updated = updateSafeLoopStatus("PREPARING");
    expect(updated.currentStatus).toBe("PREPARING");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.updatedAt.getTime());
    expect(updated.timeline.some(event => event.type === "USER RESPONSE" && event.status === "PREPARING")).toBe(true);
    expect(updated.timeline.some(event => event.type === "SAFETY STATUS" && event.status === "PREPARING")).toBe(true);
    expect(updated.disclaimer).toContain("does not automatically dispatch responders");
  });

  it("exposes the closed-loop status through tRPC", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const updated = await caller.signalbridge.updateSafeLoop({ status: "EVACUATING" });
    const state = await caller.signalbridge.safeLoop();
    expect(updated.currentStatus).toBe("EVACUATING");
    expect(state.timeline.map(event => event.type)).toEqual(expect.arrayContaining(["WARNING RECEIVED", "ACTION PLAN GENERATED", "USER RESPONSE", "SAFETY STATUS"]));
  });
});

describe("ResilienceVault", () => {
  it("contains the last verified warning, essential instructions, Tamil cards, contacts, shelters, and map context", async () => {
    const vault = await getResilienceVaultBundle();
    expect(vault.lastSynchronizedAt).toBeInstanceOf(Date);
    expect(vault.syncStatus).toContain("LAST SYNC");
    expect(vault.warning.sourceStatus).toBe("simulated");
    expect(vault.essentialInstructions.length).toBe(4);
    expect(vault.tamilActionCards.length).toBe(4);
    expect(vault.emergencyContacts.some(contact => contact.number === "112")).toBe(true);
    expect(vault.shelters.length).toBeGreaterThan(0);
    expect(vault.mapInformation.warningZones.length).toBeGreaterThan(0);
    expect(vault.disclaimer).toContain("Cached content is not live");
  });

  it("exposes the cached bundle through tRPC without presenting it as live", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const vault = await caller.signalbridge.resilienceVault();
    expect(vault.warning.sourceStatus).toBe("simulated");
    expect(vault.mapInformation.disclaimer).toContain("cached demonstration geometry");
  });
});
