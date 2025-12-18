import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { adminProcedure, createTRPCRouter } from "../init";
import { TRPCError } from "@trpc/server";
import { OrderStatus, PaymentType, CryptoType } from "@generated";

export const invoicesRouter = createTRPCRouter({
  getStats: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      paymentType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};

      if (input?.status && input.status !== "ALL") {
        if (input.status === OrderStatus.DELIVERED) {
          where.status = { in: [OrderStatus.PAID, OrderStatus.DELIVERED] };
        } else {
          where.status = input.status;
        }
      }

      if (input?.paymentType && input.paymentType !== "ALL") {
        if (Object.values(CryptoType).includes(input.paymentType as CryptoType)) {
          where.paymentType = PaymentType.CRYPTO;
          where.Wallet = { some: { chain: input.paymentType as CryptoType } };
        } else if (Object.values(PaymentType).includes(input.paymentType as PaymentType)) {
          where.paymentType = input.paymentType;
        }
      }

      if (input?.search) {
        where.OR = [
          { id: { contains: input.search, mode: "insensitive" } },
          { customer: { email: { contains: input.search, mode: "insensitive" } } },
          { customer: { name: { contains: input.search, mode: "insensitive" } } },
          { customer: { discord: { contains: input.search, mode: "insensitive" } } },
          { couponUsed: { contains: input.search, mode: "insensitive" } },
          { paypalNote: { contains: input.search, mode: "insensitive" } },
          { OrderItem: { some: { product: { name: { contains: input.search, mode: "insensitive" } } } } },
        ];
      }

      const completedWhere = { ...where, status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] } };
      const pendingWhere = { ...where, status: OrderStatus.PENDING };

      const [totalSales, totalCount, pendingCount, completedCount] = await Promise.all([
        prisma.order.aggregate({
          where: completedWhere,
          _sum: { totalPrice: true },
        }),
        prisma.order.count({ where }),
        prisma.order.count({ where: pendingWhere }),
        prisma.order.count({ where: completedWhere }),
      ]);

      return {
        totalSales: totalSales._sum.totalPrice || 0,
        totalCount,
        pendingCount,
        completedCount,
      };
    }),

  getPaginated: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(15),
      search: z.string().optional(),
      status: z.string().optional(),
      paymentType: z.string().optional(),
      cryptoType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, status, paymentType, cryptoType } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (status && status !== "ALL") {
        if (status === OrderStatus.DELIVERED) {
          where.status = { in: [OrderStatus.PAID, OrderStatus.DELIVERED] };
        } else {
          where.status = status;
        }
      }

      if (paymentType && paymentType !== "ALL") {
        if (Object.values(CryptoType).includes(paymentType as CryptoType)) {
          where.paymentType = PaymentType.CRYPTO;
          where.Wallet = { some: { chain: paymentType as CryptoType } };
        } else if (Object.values(PaymentType).includes(paymentType as PaymentType)) {
          where.paymentType = paymentType;
        }
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: "insensitive" } },
          { customer: { email: { contains: search, mode: "insensitive" } } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { discord: { contains: search, mode: "insensitive" } } },
          { couponUsed: { contains: search, mode: "insensitive" } },
          { paypalNote: { contains: search, mode: "insensitive" } },
          { OrderItem: { some: { product: { name: { contains: search, mode: "insensitive" } } } } },
          { OrderItem: { some: { codes: { has: search } } } },
        ];
      }

      const [invoices, totalCount] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            customer: {
              include: {
                affiliate: true,
              },
            },
            OrderItem: {
              include: {
                product: true,
              },
            },
            Wallet: true,
          },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        invoices,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  getAll: adminProcedure.query(async () => {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          include: {
            affiliate: true,
          },
        },
        OrderItem: {
          include: {
            product: true,
          },
        },
        Wallet: true,
      },
    });
  }),

  getFiltered: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      paymentType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { search, status, paymentType } = input;
      const where: Record<string, unknown> = {};

      if (status && status !== "ALL") {
        if (status === OrderStatus.DELIVERED) {
          where.status = { in: [OrderStatus.PAID, OrderStatus.DELIVERED] };
        } else {
          where.status = status;
        }
      }

      if (paymentType && paymentType !== "ALL") {
        if (Object.values(CryptoType).includes(paymentType as CryptoType)) {
          where.paymentType = PaymentType.CRYPTO;
          where.Wallet = { some: { chain: paymentType as CryptoType } };
        } else if (Object.values(PaymentType).includes(paymentType as PaymentType)) {
          where.paymentType = paymentType;
        }
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: "insensitive" } },
          { customer: { email: { contains: search, mode: "insensitive" } } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { discord: { contains: search, mode: "insensitive" } } },
          { couponUsed: { contains: search, mode: "insensitive" } },
          { paypalNote: { contains: search, mode: "insensitive" } },
          { OrderItem: { some: { product: { name: { contains: search, mode: "insensitive" } } } } },
        ];
      }

      return await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            include: {
              affiliate: true,
            },
          },
          OrderItem: {
            include: {
              product: true,
            },
          },
          Wallet: true,
        },
      });
    }),

  getById: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const invoice = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          customer: {
            include: {
              affiliate: true,
            },
          },
          OrderItem: {
            include: {
              product: true,
            },
          },
          Wallet: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Fetch coupon details if a coupon was used
      let couponDetails = null;
      if (invoice.couponUsed) {
        couponDetails = await prisma.coupon.findUnique({
          where: { code: invoice.couponUsed },
        });
      }

      return {
        ...invoice,
        couponDetails,
      };
    }),

  getByStatus: adminProcedure
    .input(z.object({ status: z.nativeEnum(OrderStatus) }))
    .query(async ({ input }) => {
      return await prisma.order.findMany({
        where: { status: input.status },
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });
    }),

  getByCustomerEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return await prisma.order.findMany({
        where: {
          customer: {
            email: input.email,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });
    }),

  getInvoicesByCustomer: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return await prisma.order.findMany({
        where: {
          customer: {
            email: input.email,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          OrderItem: {
            select: {
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          OrderItem: true,
          Wallet: true,
          customer: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Delete related data in transaction
      await prisma.$transaction(async (tx) => {
        // Delete order items
        await tx.orderItem.deleteMany({
          where: { orderId: input.orderId },
        });

        // Delete wallet records if any
        await tx.wallet.deleteMany({
          where: { orderId: input.orderId },
        });

        // Delete the order (this will also delete the customer due to cascade)
        await tx.order.delete({
          where: { id: input.orderId },
        });
      });

      return { success: true };
    }),
});
