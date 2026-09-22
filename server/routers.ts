import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getSignalSnapshot } from "./db";
import { assessRisk } from "./geoshield";
import { DEMO_RAW_ALERT, interpretAlert } from "./signalcore";
import { z } from "zod";

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
      alertId: z.string().min(1),
      hazardType: z.string().min(1),
      severity: z.enum(["advisory", "watch", "warning", "critical"]),
      source: z.string().min(1),
      sourceStatus: z.enum(["official", "connected", "simulated"]),
      affectedArea: z.string().min(1),
      issueTime: z.string().min(1),
      validFrom: z.string().min(1),
      expiryTime: z.string().min(1),
      warningText: z.string().min(1),
      recommendedPrecautions: z.string().min(1),
    })).mutation(({ input }) => interpretAlert(input)),
    riskAssessment: publicProcedure.input(z.object({ lat: z.number(), lng: z.number() }).optional()).query(({ input }) => assessRisk(input)),
  }),
});

export type AppRouter = typeof appRouter;
