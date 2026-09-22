import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getSignalSnapshot } from "./db";

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
  }),
});

export type AppRouter = typeof appRouter;
