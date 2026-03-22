import { prisma } from "@/utils/prisma";
import { CouponType } from "@generated/client";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";
import { couponCodeSchema } from "../schemas/coupon";

const AFFILIATE_COOKIE_NAME = "mccapes_affiliate";

export const couponRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

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

  getAffiliateCoupon: baseProcedure.query(async () => {
    const reqCookies = await cookies();
    const affiliateCookie = reqCookies.get(AFFILIATE_COOKIE_NAME);
    const affiliateCode = affiliateCookie?.value?.trim();

    if (!affiliateCode) {
      return null;
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: {
        code: { equals: affiliateCode, mode: "insensitive" },
        active: true,
      },
      select: { code: true },
    });

    if (!affiliate) {
      return null;
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: { equals: affiliate.code, mode: "insensitive" },
        active: true,
        validUntil: { gte: new Date() },
        usageCount: { lt: prisma.coupon.fields.usageLimit },
      },
      select: {
        code: true,
      },
    });

    return coupon;
  }),

  validateCoupon: baseProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: { equals: input.code, mode: "insensitive" },
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

  create: adminProcedure.input(couponCodeSchema).mutation(async ({ input, ctx }) => {
    if (ctx.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

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
        type: z.enum(CouponType).optional(),
        validUntil: z.string().optional(),
        usageLimit: z.number().int().positive().optional(),
        active: z.boolean().optional(),
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
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await prisma.coupon.delete({
        where: { id: input.id },
      });
    }),
});
