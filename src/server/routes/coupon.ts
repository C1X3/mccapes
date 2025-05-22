import { prisma } from "@/utils/prisma";
import { CouponType } from "@generated";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";

export const couponRouter = createTRPCRouter({
  getAll: adminProcedure.query(async () => {
    return await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getActive: baseProcedure.query(async () => {
    return await prisma.coupon.findMany({
      where: {
        active: true,
        validUntil: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  validateCoupon: baseProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: input.code,
          active: true,
          validUntil: { gte: new Date() },
          usageCount: { lt: prisma.coupon.fields.usageLimit },
        },
      });

      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coupon not found or expired",
        });
      }

      return coupon;
    }),

  create: adminProcedure
    .input(
      z.object({
        code: z.string(),
        discount: z.number().positive(),
        type: z.nativeEnum(CouponType),
        validUntil: z.string(),
        usageLimit: z.number().int().positive(),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      // Check if coupon code already exists
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: input.code },
      });

      if (existingCoupon) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Coupon code already exists",
        });
      }

      return await prisma.coupon.create({
        data: {
          ...input,
          validUntil: new Date(input.validUntil),
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().optional(),
        discount: z.number().positive().optional(),
        type: z.nativeEnum(CouponType).optional(),
        validUntil: z.string().optional(),
        usageLimit: z.number().int().positive().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // If code is being updated, check if the new code already exists
      if (data.code) {
        const existingCoupon = await prisma.coupon.findFirst({
          where: {
            code: data.code,
            id: { not: id },
          },
        });

        if (existingCoupon) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Coupon code already exists",
          });
        }
      }

      return await prisma.coupon.update({
        where: { id },
        data: {
          ...data,
          ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.coupon.delete({
        where: { id: input.id },
      });
    }),
});
