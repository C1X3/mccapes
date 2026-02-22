import { cache } from "react";
import SuperJSON from "superjson";
import { cookies } from "next/headers";
import { initTRPC, TRPCError } from "@trpc/server";

export const createTRPCContext = cache(async () => {
  const cooks = await cookies();
  const authenticatedCookie = cooks.get("authenticated");

  // Parse password and role from cookie
  let isAuthenticated = false;
  let role: "admin" | "support" | null = null;

  if (authenticatedCookie?.value) {
    const password = authenticatedCookie.value;

    // Validate password and derive role from which password matched
    // SECURITY: Never trust client-provided role - derive it from password validation
    if (password === process.env.ADMIN_PASSWORD) {
      isAuthenticated = true;
      role = "admin";
    } else if (password === process.env.SUPPORT_PASSWORD) {
      isAuthenticated = true;
      role = "support";
    }
  }

  return {
    isAuthenticated,
    role,
  };
});

const t = initTRPC
  .context<{
    isAuthenticated: Awaited<
      ReturnType<typeof createTRPCContext>
    >["isAuthenticated"];
    role: Awaited<ReturnType<typeof createTRPCContext>>["role"];
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

// Allows both admin and support users
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

// Only allows admin users
export const adminOnlyProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // Check for admin password in the context
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this resource.",
    });
  }

  // Check for admin role
  if (ctx.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next();
});
