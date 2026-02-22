import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";
import { TRPCError } from "@trpc/server";
import {
  CouponType,
  CryptoType,
  OrderStatus,
  PaymentType,
} from "@generated/client";
import { createCheckoutSession as createStripeCheckout } from "../providers/stripe";
import { createCheckoutSession as createPaypalCheckout } from "../providers/paypal";
import { createWalletDetails as createCryptoCheckout } from "../providers/crypto";
import { WalletDetails } from "../providers/types";
import {
  sendCodeReplacedEmail,
  sendOrderCompleteEmail,
} from "@/server/email/send";
import { headers, cookies } from "next/headers";
import { getPaymentFee } from "@/utils/fees";
import {
  getEmailValidationErrorMessage,
  validateCustomerEmail,
} from "@/server/email/validation";

const AFFILIATE_COOKIE_NAME = "mccapes_affiliate";
const PENDING_PAYPAL_TIMEOUT_MS = 30 * 60 * 1000;

const toCapeTextureDataUrl = (bytes: Uint8Array | null | undefined) => {
  if (!bytes || bytes.length === 0) return null;
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
};

export const checkoutRouter = createTRPCRouter({
  processPayment: baseProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().int().positive(),
            price: z.number().positive(),
            name: z.string(),
          }),
        ),
        customerInfo: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          discord: z.string().optional(),
        }),
        paymentType: z.enum(PaymentType),
        cryptoType: z.enum(CryptoType).optional(),
        couponCode: z.string().nullable().optional(),
        paymentFee: z.number().positive(),
        totalPrice: z.number().positive(),
        discountAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const reqHeaders = await headers();
        const reqCookies = await cookies();
        const ipAddress =
          reqHeaders.get("CF-Connecting-IP") ||
          reqHeaders.get("X-Forwarded-For") ||
          reqHeaders.get("X-Real-IP");
        const useragent = reqHeaders.get("User-Agent");

        const affiliateCookie = reqCookies.get(AFFILIATE_COOKIE_NAME);
        let affiliateId: string | null = null;

        if (affiliateCookie?.value) {
          const affiliate = await prisma.affiliate.findFirst({
            where: {
              code: { equals: affiliateCookie.value, mode: "insensitive" },
              active: true,
            },
          });
          if (affiliate) {
            affiliateId = affiliate.id;
          }
        }

        let totalPrice = 0;

        for (const item of input.items) {
          const product = await prisma.product.findUnique({
            where: {
              id: item.productId,
            },
          });

          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Product not found",
            });
          }

          // Check if enough stock is available BEFORE creating the order
          if (product.stock.length < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough stock available for ${product.name}. Available: ${product.stock.length}, Requested: ${item.quantity}`,
            });
          }

          totalPrice += product.price * item.quantity;
        }

        if (input.couponCode) {
          const coupon = await prisma.coupon.findUnique({
            where: {
              code: input.couponCode,
            },
          });

          if (!coupon) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coupon not found",
            });
          }

          if (coupon.validUntil < new Date()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coupon expired",
            });
          }

          if (coupon.active === false) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coupon is not active",
            });
          }

          if (coupon.usageCount >= coupon.usageLimit) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coupon limit reached",
            });
          }

          if (coupon.validUntil < new Date()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Coupon expired",
            });
          }

          if (coupon.type === CouponType.FIXED) {
            totalPrice -= coupon.discount;
          } else {
            const discountAmount = (coupon.discount / 100) * totalPrice;
            totalPrice -= discountAmount;
          }
        }

        const paymentFeePercentage = getPaymentFee(input.paymentType);
        const paymentFee = paymentFeePercentage * totalPrice;

        totalPrice += paymentFee;

        const frontendFinalPrice =
          input.totalPrice - (input.discountAmount || 0) + input.paymentFee;

        if (
          Math.round(totalPrice * 100) / 100 !==
          Math.round(frontendFinalPrice * 100) / 100
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Total price does not match, please try again!",
          });
        }

        const emailValidation = await validateCustomerEmail(
          input.customerInfo.email,
        );
        if (!emailValidation.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: getEmailValidationErrorMessage(emailValidation.reason),
          });
        }

        const order = await prisma.order.create({
          data: {
            totalPrice: input.totalPrice,
            paymentFee: input.paymentFee,
            paymentType: input.paymentType,
            couponUsed: input.couponCode || null,
            discountAmount: input.discountAmount || 0,
            status: OrderStatus.PENDING,
            customer: {
              create: {
                name: input.customerInfo.name,
                email: emailValidation.normalizedEmail,
                emailValidationStatus: emailValidation.status,
                emailValidationReason: emailValidation.reason,
                emailValidatedAt: new Date(),
                discord: input.customerInfo.discord,
                ipAddress,
                useragent,
                affiliateId,
              },
            },
            OrderItem: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });

        // 2. Generate payment link based on the selected payment method
        let walletDetails: WalletDetails | undefined;

        const payloadForProviders = {
          orderId: order.id,
          items: input.items,
          customerInfo: input.customerInfo,
          totalPrice: input.totalPrice,
          couponCode: input.couponCode || null,
          discountAmount: input.discountAmount || 0,
          paymentFee: input.paymentFee,
        };

        switch (input.paymentType) {
          case PaymentType.STRIPE:
            walletDetails = {
              amount: input.totalPrice.toFixed(2),
              address: "",
              url: await createStripeCheckout(payloadForProviders),
            };
            break;
          case PaymentType.PAYPAL:
            walletDetails = await createPaypalCheckout(payloadForProviders);
            break;
          case PaymentType.CRYPTO:
            if (!input.cryptoType) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Crypto type is required for crypto payments",
              });
            }

            walletDetails = await createCryptoCheckout(
              payloadForProviders,
              input.cryptoType,
            );
            break;
          default:
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment Method Coming Soon",
            });
        }

        return {
          orderId: order.id,
          paymentType: input.paymentType,
          walletDetails,
          success: true,
        };
      } catch (err) {
        console.error("Payment processing error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment",
        });
      }
    }),

  getCryptoWalletDetails: baseProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const wallet = await prisma.wallet.findFirst({
        where: { orderId: input.orderId },
        orderBy: { depositIndex: "asc" },
      });

      if (!wallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet not found",
        });
      }

      return wallet;
    }),
  getOrderStatus: baseProcedure
    .input(
      z.object({
        orderId: z.string(),
        customerEmail: z.string().email().optional(), // For order ownership verification
      }),
    )
    .query(async ({ input }) => {
      let order = await prisma.order.findUnique({
        where: { id: input.orderId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          paymentType: true,
          paymentFee: true,
          totalPrice: true,
          paypalNote: true,
          couponUsed: true,
          discountAmount: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              discord: true,
            },
          },
        },
      });
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const isOverduePaypalPending =
        order.paymentType === PaymentType.PAYPAL &&
        order.status === OrderStatus.PENDING &&
        Date.now() - new Date(order.createdAt).getTime() >=
          PENDING_PAYPAL_TIMEOUT_MS;

      if (isOverduePaypalPending) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
        order = { ...order, status: OrderStatus.CANCELLED };
      }

      // 4) Backend-side Authorization Check: Verify order ownership if email provided
      if (input.customerEmail && order.customer.email !== input.customerEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Order does not belong to the requester.",
        });
      } // 1) Restrict Access Based on Payment Status
      // 3) Sanitize API Response - Don't return codes unless PAID, but show basic order info
      if (
        order.status !== OrderStatus.PAID &&
        order.status !== OrderStatus.DELIVERED
      ) {
        // Get order items but WITHOUT codes for unpaid orders
        const orderWithBasicItems = await prisma.order.findUnique({
          where: { id: input.orderId },
          select: {
            id: true,
            status: true,
            createdAt: true,
            paymentType: true,
            paymentFee: true,
            totalPrice: true,
            paypalNote: true,
            couponUsed: true,
            discountAmount: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                discord: true,
              },
            },
            OrderItem: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    slug: true,
                    productType: true,
                    backgroundImageUrl: true,
                    capeTexturePng: true,
                  },
                },
                // Explicitly exclude codes field
              },
            },
          },
        });

        return {
          ...orderWithBasicItems,
          orderId: orderWithBasicItems?.id,
          paymentStatus: orderWithBasicItems?.status,
          // Add empty codes array to each order item to maintain type consistency
          OrderItem:
            orderWithBasicItems?.OrderItem.map((item) => ({
              ...item,
              product: {
                ...item.product,
                capeTextureDataUrl: toCapeTextureDataUrl(
                  item.product.capeTexturePng,
                ),
                capeTexturePng: undefined,
              },
              codes: [], // Always empty for unpaid orders
            })) || [],
        };
      }

      const fullOrder = await prisma.order.findUnique({
        where: { id: input.orderId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          paymentType: true,
          paymentFee: true,
          totalPrice: true,
          paypalNote: true,
          couponUsed: true,
          discountAmount: true,
          OrderItem: {
            select: {
              id: true,
              orderId: true,
              productId: true,
              quantity: true,
              price: true,
              codes: true,
              createdAt: true,
              updatedAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  image: true,
                  slug: true,
                  productType: true,
                  backgroundImageUrl: true,
                  capeTexturePng: true,
                  additionalImages: true,
                  category: true,
                  rating: true,
                  badge: true,
                  features: true,
                  order: true,
                  stripeProductName: true,
                  slashPrice: true,
                  hideHomePage: true,
                  hideProductPage: true,
                  isFeatured: true,
                  stripeId: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          customer: true,
        },
      });

      return {
        ...fullOrder,
        OrderItem:
          fullOrder?.OrderItem.map((item) => ({
            ...item,
            product: {
              ...item.product,
              capeTextureDataUrl: toCapeTextureDataUrl(
                item.product.capeTexturePng,
              ),
              capeTexturePng: undefined,
            },
          })) ?? [],
        orderId: fullOrder?.id,
        paymentStatus: fullOrder?.status,
      };
    }),

  updateOrderStatus: baseProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["PENDING", "PAID", "DELIVERED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Get the current order status
        const currentOrder = await prisma.order.findUnique({
          where: { id: input.orderId },
          select: { status: true },
        });

        if (!currentOrder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Only allow specific legitimate transitions
        const allowedTransitions: Record<string, string[]> = {
          PENDING: [], // PENDING can't be set by this endpoint (only webhooks)
          PAID: ["DELIVERED"], // PAID orders can only be marked as DELIVERED
          DELIVERED: [], // DELIVERED is final state
          CANCELLED: [], // CANCELLED is final state
        };

        const currentStatus = currentOrder.status;
        const newStatus = input.status;

        // Check if the transition is allowed
        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          });
        }

        const order = await prisma.order.update({
          where: { id: input.orderId },
          data: { status: input.status },
        });

        return { success: true, order };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        });
      }
    }),

  manuallyProcessInvoice: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          customer: true,
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      for (const item of order.OrderItem) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            stock: true,
          },
        });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        if (product.stock.length < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough stock for product",
          });
        }

        const oldestStock = product.stock.slice(0, item.quantity);
        const filteredStock = product.stock.filter(
          (stock) => !oldestStock.includes(stock),
        );
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: filteredStock },
        });

        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            codes: item.codes.concat(oldestStock),
          },
        });
      }

      // Format the manual processing note with timestamp
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      const roleLabel = ctx.role === "admin" ? "ADMIN" : "SUPPORT";
      const processingNote = `MANUALLY PROCESSED - ${formattedDate} (${roleLabel})`;

      await prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.PAID,
          notes: {
            push: processingNote,
          },
        },
      });

      // Fetch the updated order with codes for email
      const updatedOrder = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          customer: true,
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!updatedOrder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Updated order not found",
        });
      }

      await sendOrderCompleteEmail({
        customerName: updatedOrder.customer.name,
        customerEmail: updatedOrder.customer.email,
        orderId: updatedOrder.id,
        items: updatedOrder.OrderItem.map((item) => ({
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          codes: item.codes,
          image: item.product.image,
          slug: item.product.slug,
          productType: item.product.productType,
        })),
        totalPrice: updatedOrder.totalPrice,
        paymentFee: updatedOrder.paymentFee,
        totalWithFee: updatedOrder.totalPrice + updatedOrder.paymentFee,
        paymentType: updatedOrder.paymentType,
        orderDate: updatedOrder.createdAt.toISOString(),
      });

      return { success: true, order: updatedOrder };
    }),

  cancelInvoice: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      // Fetch all orders, if it's stripe or paypal and lasts more than 30 minutes from created cancel the order
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          OrderItem: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      return { success: true, order };
    }),

  replaceCode: adminProcedure
    .input(
      z.object({
        itemId: z.string(),
        codeIndex: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: input.itemId },
        include: {
          product: true,
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (!orderItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order item not found",
        });
      }

      if (input.codeIndex >= orderItem.codes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid code index",
        });
      }

      // Get the next available code from stock
      if (orderItem.product.stock.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No codes available in stock for this product",
        });
      }

      const newCode = orderItem.product.stock[0]; // Take the first available code
      const oldCode = orderItem.codes[input.codeIndex];

      // Create a new array with the replaced code
      const updatedCodes = [...orderItem.codes];
      updatedCodes[input.codeIndex] = newCode;

      // Format the replacement note with timestamp
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      const roleLabel = ctx.role === "admin" ? "ADMIN" : "SUPPORT";
      const replacementNote = `REPLACED: ${oldCode} -> ${newCode}: ${formattedDate} (${roleLabel})`;

      // Update the order item with the new codes array and remove code from product stock
      await prisma.$transaction([
        // Update the order item with new codes
        prisma.orderItem.update({
          where: { id: input.itemId },
          data: { codes: updatedCodes },
        }),
        // Remove the code from product stock
        prisma.product.update({
          where: { id: orderItem.product.id },
          data: {
            stock: {
              set: orderItem.product.stock.slice(1), // Remove the first code
            },
          },
        }),
        // Add the replacement note to the order
        prisma.order.update({
          where: { id: orderItem.order.id },
          data: {
            notes: {
              push: replacementNote,
            },
          },
        }),
      ]);

      // Send email notification to customer
      if (orderItem.order.customer?.email) {
        try {
          await sendCodeReplacedEmail({
            customerName: orderItem.order.customer.name || "Customer",
            customerEmail: orderItem.order.customer.email,
            orderId: orderItem.order.id,
            productName: orderItem.product.name,
            productSlug: orderItem.product.slug,
            oldCode,
            newCode: newCode,
          });
        } catch (emailError) {
          console.error("Failed to send code replacement email:", emailError);
          // Don't throw error - code replacement should still succeed even if email fails
        }
      }

      // NOTE: We do NOT add the old code back to stock as codes cannot be resold once sent to users

      return {
        success: true,
        oldCode,
        newCode: newCode,
        updatedCodes,
      };
    }),
});
