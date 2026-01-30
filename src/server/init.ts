import { initTRPC } from "@trpc/server";
import { cache } from "react";
import SuperJSON from "superjson";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";

export const createTRPCContext = cache(async () => {
  const cooks = await cookies();
  const authenticatedCookie = cooks.get("authenticated");
  const isAuthenticated =
    authenticatedCookie?.value === process.env.ADMIN_PASSWORD;

  return {
    isAuthenticated,
  };
});

const t = initTRPC
  .context<{
    isAuthenticated: Awaited<
      ReturnType<typeof createTRPCContext>
    >["isAuthenticated"];
  }>()
  .create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: SuperJSON,
  });

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const adminProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // Check for admin password in the context
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this resource.",
    });
  }

  return next();
});
