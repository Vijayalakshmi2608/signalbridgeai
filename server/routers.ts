import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getSignalSnapshot } from "./db";
import { assessRisk } from "./geoshield";
import { DEMO_RAW_ALERT, interpretAlert } from "./signalcore";
import { buildEvidenceGraph, compileActionPlan } from "./actionforge";
import { fetchOfficialWarnings, geocodeLocation, liveIntegrationStatus, routeDistance, shelterAvailability } from "./liveSources";
import { getCrowdPulseBundle } from "./crowdpulse";
import { buildAccessBridgeBundle } from "./accessbridge";
import { SAFE_LOOP_STATUSES, getSafeLoopState, updateSafeLoopStatus } from "./safeloop";
import { getResilienceVaultBundle } from "./resiliencevault";
import { aiHealthCheck, generateAiInsight } from "./ai";
import { z } from "zod";

const pointSchema = z.object({ lat: z.number(), lng: z.number() });

async function getActionForgeBundle(point = { lat: 13.111, lng: 80.244 }) {
  const snapshot = await getSignalSnapshot();
  const assessment = assessRisk(point);
  const warning = snapshot.warnings.find(item => item.status === "active") ?? snapshot.warnings[0];
  const compiled = compileActionPlan({ warning, affectedZoneRelationship: assessment.affectedZoneRelationship, riskState: assessment.state, profile: snapshot.profile, evidence: snapshot.evidence, communityReports: snapshot.citizenReports });
  const graph = buildEvidenceGraph({ warning, riskState: assessment.state, affectedZoneRelationship: assessment.affectedZoneRelationship, evidence: snapshot.evidence, communityReports: snapshot.citizenReports, actions: compiled.recommendations });
  return { ...compiled, assessment, graph, profile: snapshot.profile, warning };
}

function buildAiContextFromBundle(bundle: Awaited<ReturnType<typeof getActionForgeBundle>>) {
  return {
    warning: bundle.warning.warningText,
    hazard: bundle.warning.hazardType,
    severity: bundle.warning.severity,
    location: bundle.warning.area,
    guidance: bundle.trustedGuidance.slice(0, 6),
    evidence: bundle.graph.nodes
      .filter(node => node.type !== "ACTION RECOMMENDATION")
      .slice(0, 8)
      .map(node => `${node.type}: ${node.label}`),
    userProfile: bundle.profile,
    accessibility: { preferredLanguage: bundle.profile.preferredLanguage, mobilityNeeds: bundle.profile.mobilityNeeds },
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  signalbridge: router({
    snapshot: publicProcedure.query(() => getSignalSnapshot()),
    warnings: publicProcedure.query(async () => (await getSignalSnapshot()).warnings),
    evidence: publicProcedure.query(async () => (await getSignalSnapshot()).evidence),
    actionPlans: publicProcedure.query(async () => (await getSignalSnapshot()).actionPlans),
    citizenReports: publicProcedure.query(async () => (await getSignalSnapshot()).citizenReports),
    profile: publicProcedure.query(async () => (await getSignalSnapshot()).profile),
    safety: publicProcedure.query(async () => (await getSignalSnapshot()).safety),
    rawDemoAlert: publicProcedure.query(() => DEMO_RAW_ALERT),
    alertIntelligence: publicProcedure.query(() => interpretAlert(DEMO_RAW_ALERT)),
    interpretAlert: publicProcedure.input(z.object({
      alertId: z.string().min(1), hazardType: z.string().min(1), severity: z.enum(["advisory", "watch", "warning", "critical"]), source: z.string().min(1), sourceStatus: z.enum(["official", "connected", "simulated"]), affectedArea: z.string().min(1), issueTime: z.string().min(1), validFrom: z.string().min(1), expiryTime: z.string().min(1), warningText: z.string().min(1), recommendedPrecautions: z.string().min(1),
    })).mutation(({ input }) => interpretAlert(input)),
    riskAssessment: publicProcedure.input(pointSchema.optional()).query(({ input }) => assessRisk(input)),
    actionForge: publicProcedure.input(pointSchema.optional()).query(({ input }) => getActionForgeBundle(input)),
    evidenceGraph: publicProcedure.input(pointSchema.optional()).query(({ input }) => getActionForgeBundle(input).then(bundle => bundle.graph)),
    aiHealth: publicProcedure.query(() => aiHealthCheck()),
    aiInsight: publicProcedure.input(pointSchema.optional()).query(async ({ input }) => {
      const bundle = await getActionForgeBundle(input ?? { lat: 13.111, lng: 80.244 });
      const context = buildAiContextFromBundle(bundle);
      const result = await generateAiInsight(context);
      return { ...result, response: result.response };
    }),
    regenerateAiInsight: publicProcedure.input(pointSchema.optional()).mutation(async ({ input }) => {
      const bundle = await getActionForgeBundle(input ?? { lat: 13.111, lng: 80.244 });
      const context = buildAiContextFromBundle(bundle);
      const result = await generateAiInsight(context);
      return result;
    }),
    officialFeed: publicProcedure.query(() => fetchOfficialWarnings()),
    integrationStatus: publicProcedure.query(() => liveIntegrationStatus()),
    geocode: publicProcedure.input(z.object({ query: z.string().min(2) })).mutation(({ input }) => geocodeLocation(input.query)),
    routeDistance: publicProcedure.input(z.object({ from: pointSchema, to: pointSchema })).mutation(({ input }) => routeDistance(input.from, input.to)),
    shelterAvailability: publicProcedure.input(z.object({ name: z.string(), capacity: z.number(), availableSpaces: z.number(), status: z.string() })).query(({ input }) => shelterAvailability(input)),
    crowdPulse: publicProcedure.query(() => getCrowdPulseBundle()),
    accessBridge: publicProcedure.query(() => getActionForgeBundle().then(bundle => buildAccessBridgeBundle(bundle.recommendations))),
    safeLoop: publicProcedure.query(() => getSafeLoopState()),
    updateSafeLoop: publicProcedure.input(z.object({ status: z.enum(SAFE_LOOP_STATUSES) })).mutation(({ input }) => updateSafeLoopStatus(input.status)),
    resilienceVault: publicProcedure.query(() => getResilienceVaultBundle()),
  }),
});

export type AppRouter = typeof appRouter;
