import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { cookies } from "next/headers";

export const authenticationRouter = createTRPCRouter({
  authenticate: baseProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const { password } = input;

      // Check if the password is correct
      if (password !== process.env.ADMIN_PASSWORD)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
        });

      // If the password is correct, set the session cookie
      (await cookies()).set({
        name: "authenticated",
        value: process.env.ADMIN_PASSWORD!,
      });

      // Return a success message
      return true;
    }),

  isAuthenticated: baseProcedure.query(async ({}) => {
    // Check if the authenticated cookie is set
    const sessionCookie = (await cookies()).get("authenticated");
    if (!sessionCookie) {
      return false;
    }

    // Return a success message
    return true;
  }),
});
