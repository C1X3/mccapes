import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { adminProcedure, createTRPCRouter } from "../init";
import { TRPCError } from "@trpc/server";
import { OrderStatus } from "@generated";

export const invoicesRouter = createTRPCRouter({
  getAll: adminProcedure.query(async () => {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
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
          customer: true,
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
