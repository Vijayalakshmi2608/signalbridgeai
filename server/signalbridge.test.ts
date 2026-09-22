import { describe, expect, it } from "vitest";
import { assessRisk, pointInPolygon } from "./geoshield";
import { appRouter } from "./routers";
import { getSignalSnapshot } from "./db";
import { DEMO_RAW_ALERT, interpretAlert } from "./signalcore";
import { buildEvidenceGraph, compileActionPlan } from "./actionforge";
import { fetchOfficialWarnings, liveIntegrationStatus } from "./liveSources";
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
