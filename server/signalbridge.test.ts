import { describe, expect, it } from "vitest";
import { assessRisk, pointInPolygon } from "./geoshield";
import { appRouter } from "./routers";
import { getSignalSnapshot } from "./db";
import { DEMO_RAW_ALERT, interpretAlert } from "./signalcore";
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
