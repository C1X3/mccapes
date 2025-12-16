import { prisma } from "@/utils/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import { OrderStatus } from "@generated";

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
};

export const affiliateRouter = createTRPCRouter({
  getAll: adminProcedure.query(async () => {
    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            clicks: true,
          },
        },
      },
    });

    const last7Days = getLast7Days();

    const affiliatesWithStats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const orders = await prisma.customerInformation.findMany({
          where: {
            affiliateId: affiliate.id,
            order: {
              status: {
                in: [OrderStatus.PAID, OrderStatus.DELIVERED],
              },
            },
          },
          include: {
            order: true,
          },
        });

        const clicks = await prisma.affiliateClick.findMany({
          where: {
            affiliateId: affiliate.id,
            createdAt: {
              gte: last7Days[0],
            },
          },
          select: {
            createdAt: true,
          },
        });

        const clicksLast7Days = last7Days.map((day) => {
          const nextDay = new Date(day);
          nextDay.setDate(nextDay.getDate() + 1);
          return {
            date: day.toISOString().split("T")[0],
            clicks: clicks.filter(
              (c) => c.createdAt >= day && c.createdAt < nextDay
            ).length,
          };
        });

        const ordersLast7Days = last7Days.map((day) => {
          const nextDay = new Date(day);
          nextDay.setDate(nextDay.getDate() + 1);
          return {
            date: day.toISOString().split("T")[0],
            orders: orders.filter(
              (o) =>
                o.order &&
                new Date(o.order.createdAt) >= day &&
                new Date(o.order.createdAt) < nextDay
            ).length,
            revenue: orders
              .filter(
                (o) =>
                  o.order &&
                  new Date(o.order.createdAt) >= day &&
                  new Date(o.order.createdAt) < nextDay
              )
              .reduce((sum, o) => sum + (o.order?.totalPrice || 0), 0),
          };
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce(
          (sum, customer) => sum + (customer.order?.totalPrice || 0),
          0
        );
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const conversionRate =
          affiliate._count.clicks > 0
            ? (totalOrders / affiliate._count.clicks) * 100
            : 0;

        return {
          ...affiliate,
          totalClicks: affiliate._count.clicks,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate,
          clicksLast7Days,
          ordersLast7Days,
        };
      })
    );

    return affiliatesWithStats;
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const affiliate = await prisma.affiliate.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              clicks: true,
            },
          },
        },
      });

      if (!affiliate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Affiliate not found",
        });
      }

      const last7Days = getLast7Days();

      const orders = await prisma.customerInformation.findMany({
        where: {
          affiliateId: affiliate.id,
          order: {
            status: {
              in: [OrderStatus.PAID, OrderStatus.DELIVERED],
            },
          },
        },
        include: {
          order: {
            include: {
              OrderItem: {
                include: {
                  product: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const allClicks = await prisma.affiliateClick.findMany({
        where: {
          affiliateId: affiliate.id,
        },
        select: {
          createdAt: true,
        },
      });

      const clicksLast7Days = last7Days.map((day) => {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          date: day.toISOString().split("T")[0],
          clicks: allClicks.filter(
            (c) => c.createdAt >= day && c.createdAt < nextDay
          ).length,
        };
      });

      const ordersLast7Days = last7Days.map((day) => {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          date: day.toISOString().split("T")[0],
          orders: orders.filter(
            (o) =>
              o.order &&
              new Date(o.order.createdAt) >= day &&
              new Date(o.order.createdAt) < nextDay
          ).length,
          revenue: orders
            .filter(
              (o) =>
                o.order &&
                new Date(o.order.createdAt) >= day &&
                new Date(o.order.createdAt) < nextDay
            )
            .reduce((sum, o) => sum + (o.order?.totalPrice || 0), 0),
        };
      });

      const recentOrders = orders
        .filter((o) => o.order)
        .sort(
          (a, b) =>
            new Date(b.order!.createdAt).getTime() -
            new Date(a.order!.createdAt).getTime()
        )
        .slice(0, 3)
        .map((o) => ({
          id: o.order!.id,
          totalPrice: o.order!.totalPrice,
          createdAt: o.order!.createdAt,
          products: o.order!.OrderItem.map((item) => item.product.name).join(", "),
          customerEmail: o.email,
        }));

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, customer) => sum + (customer.order?.totalPrice || 0),
        0
      );
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate =
        affiliate._count.clicks > 0
          ? (totalOrders / affiliate._count.clicks) * 100
          : 0;

      const clicksToday = allClicks.filter((c) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return c.createdAt >= today;
      }).length;

      const ordersToday = orders.filter((o) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return o.order && new Date(o.order.createdAt) >= today;
      }).length;

      const revenueToday = orders
        .filter((o) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return o.order && new Date(o.order.createdAt) >= today;
        })
        .reduce((sum, o) => sum + (o.order?.totalPrice || 0), 0);

      return {
        ...affiliate,
        totalClicks: affiliate._count.clicks,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        conversionRate,
        clicksLast7Days,
        ordersLast7Days,
        recentOrders,
        clicksToday,
        ordersToday,
        revenueToday,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(1)
          .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, underscores, and hyphens"),
        name: z.string().min(1),
        active: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const existingAffiliate = await prisma.affiliate.findUnique({
        where: { code: input.code.toLowerCase() },
      });

      if (existingAffiliate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Affiliate code already exists",
        });
      }

      return await prisma.affiliate.create({
        data: {
          code: input.code.toLowerCase(),
          name: input.name,
          active: input.active,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        code: z
          .string()
          .min(1)
          .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, underscores, and hyphens")
          .optional(),
        name: z.string().min(1).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      if (data.code) {
        const existingAffiliate = await prisma.affiliate.findFirst({
          where: {
            code: data.code.toLowerCase(),
            id: { not: id },
          },
        });

        if (existingAffiliate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Affiliate code already exists",
          });
        }
      }

      return await prisma.affiliate.update({
        where: { id },
        data: {
          ...data,
          ...(data.code ? { code: data.code.toLowerCase() } : {}),
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.affiliate.delete({
        where: { id: input.id },
      });
    }),
});
