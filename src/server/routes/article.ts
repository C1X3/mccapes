import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";
import { TRPCError } from "@trpc/server";

export const articleRouter = createTRPCRouter({
  getAll: baseProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      return await prisma.article.findMany({
        where: {
          ...(input.includeInactive ? {} : { isActive: true }),
        },
        orderBy: { order: "asc" },
      });
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.article.findUnique({
        where: { id: input.id },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        videoKey: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        color: z.string().default("var(--primary)"),
        alignment: z.enum(["left", "right"]).default("left"),
        productSlug: z.string().min(1),
        isActive: z.boolean().default(true),
        order: z.number().default(0),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await prisma.article.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        videoKey: z.string().min(1).optional(),
        thumbnailUrl: z.string().optional(),
        color: z.string().optional(),
        alignment: z.enum(["left", "right"]).optional(),
        productSlug: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        order: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { id, ...data } = input;
      return await prisma.article.update({
        where: { id },
        data,
      });
    }),

  updateOrders: adminProcedure
    .input(
      z.object({
        articleOrders: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { articleOrders } = input;

      // Update articles in transaction
      const updates = articleOrders.map(({ id, order }) =>
        prisma.article.update({
          where: { id },
          data: { order },
        }),
      );

      await prisma.$transaction(updates);

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await prisma.article.delete({
        where: { id: input.id },
      });
    }),
});
