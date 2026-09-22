import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getSignalSnapshot } from "./db";
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
  });

  it("exposes the same demo data through the public tRPC procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const snapshot = await caller.signalbridge.snapshot();
    expect(snapshot.warnings[0]?.hazardType).toBe("Urban flooding");
    expect(snapshot.evidence[0]?.confidence).toBeGreaterThan(0);
    expect(snapshot.actionPlans.some(plan => plan.priority === "now")).toBe(true);
  });
});
