import { prisma } from "@/utils/prisma";
import { TRPCError } from "@trpc/server";
import {
  endOfDay,
  format,
  startOfDay,
  subDays,
  subMonths,
  differenceInHours,
  differenceInDays,
  startOfWeek,
  startOfMonth,
  addHours,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import { OrderStatus } from "@generated/client";

// Define time range schema
const timeRangeSchema = z.enum([
  "today",
  "yesterday",
  "past_week",
  "past_month",
  "past_3_months",
  "past_6_months",
  "past_year",
  "custom",
]);

// Define custom date range schema
const customDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

// Helper function to get date range based on time range
const getDateRange = (
  timeRange: z.infer<typeof timeRangeSchema>,
  customRange?: { startDate: string; endDate: string },
) => {
  const now = new Date();

  switch (timeRange) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };
    case "past_week":
      return {
        start: subDays(now, 7),
        end: now,
      };
    case "past_month":
      return {
        start: subDays(now, 30),
        end: now,
      };
    case "past_3_months":
      return {
        start: subMonths(now, 3),
        end: now,
      };
    case "past_6_months":
      return {
        start: subMonths(now, 6),
        end: now,
      };
    case "past_year":
      return {
        start: subMonths(now, 12),
        end: now,
      };
    case "custom":
      if (!customRange) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Custom date range is required for custom time range",
        });
      }
      // Use startOfDay/endOfDay so single-day ranges are midnight-to-midnight (not same instant = $0)
      const customStart = new Date(customRange.startDate + "T00:00:00");
      const customEnd = new Date(customRange.endDate + "T00:00:00");
      return {
        start: startOfDay(customStart),
        end: endOfDay(customEnd),
      };
    default:
      return {
        start: subDays(now, 30),
        end: now,
      };
  }
};

const getPreviousDateRange = (
  timeRange: z.infer<typeof timeRangeSchema>,
  currentRange: { start: Date; end: Date },
) => {
  switch (timeRange) {
    case "today": {
      const yesterday = subDays(currentRange.start, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };
    }
    case "yesterday": {
      const dayBeforeYesterday = subDays(currentRange.start, 1);
      return {
        start: startOfDay(dayBeforeYesterday),
        end: endOfDay(dayBeforeYesterday),
      };
    }
    case "past_week":
      return {
        start: subDays(currentRange.start, 7),
        end: subDays(currentRange.end, 7),
      };
    case "past_month":
      return {
        start: subMonths(currentRange.start, 1),
        end: subMonths(currentRange.end, 1),
      };
    case "past_3_months":
      return {
        start: subMonths(currentRange.start, 3),
        end: subMonths(currentRange.end, 3),
      };
    case "past_6_months":
      return {
        start: subMonths(currentRange.start, 6),
        end: subMonths(currentRange.end, 6),
      };
    case "past_year":
      return {
        start: subMonths(currentRange.start, 12),
        end: subMonths(currentRange.end, 12),
      };
    case "custom":
    default: {
      const durationMs = currentRange.end.getTime() - currentRange.start.getTime();
      const previousEnd = new Date(currentRange.start.getTime() - 1);
      return {
        start: new Date(previousEnd.getTime() - durationMs),
        end: previousEnd,
      };
    }
  }
};

export const analyticsRouter = createTRPCRouter({
  // Get revenue data
  getRevenue: adminProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);

      // Get current period revenue
      const currentPeriodOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          OR: [{ status: OrderStatus.PAID }, { status: OrderStatus.DELIVERED }],
        },
        select: {
          totalPrice: true,
          paymentFee: true,
        },
      });

      const currentTotalAmount = currentPeriodOrders.reduce(
        (sum, order) => sum + order.totalPrice,
        0,
      );

      const previousDateRange = getPreviousDateRange(timeRange, dateRange);

      // Get previous period revenue for comparison
      const previousPeriodOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: previousDateRange.start,
            lte: previousDateRange.end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
        select: {
          totalPrice: true,
          paymentFee: true,
        },
      });

      const previousTotalAmount = previousPeriodOrders.reduce(
        (sum, order) => sum + order.totalPrice,
        0,
      );

      // Calculate percent change
      let percentChange = 0;
      if (previousTotalAmount > 0) {
        percentChange =
          ((currentTotalAmount - previousTotalAmount) / previousTotalAmount) *
          100;
      }

      return {
        amount: currentTotalAmount,
        percentChange: parseFloat(percentChange.toFixed(1)),
      };
    }),

  // Get orders data
  getOrders: adminProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);

      // Get current period orders
      const currentPeriodOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
      });

      const previousDateRange = getPreviousDateRange(timeRange, dateRange);

      // Get previous period orders for comparison
      const previousPeriodOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: previousDateRange.start,
            lte: previousDateRange.end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
      });

      // Calculate percent change
      let percentChange = 0;
      if (previousPeriodOrders > 0) {
        percentChange =
          ((currentPeriodOrders - previousPeriodOrders) /
            previousPeriodOrders) *
          100;
      }

      return {
        count: currentPeriodOrders,
        percentChange: parseFloat(percentChange.toFixed(1)),
      };
    }),

  // Get chart data
  getChartData: adminProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);
      const { start, end } = dateRange;

      let bucketType: "hour" | "day" | "week" | "month";
      let bucketSize: number;

      const totalHours = differenceInHours(end, start);
      const totalDays = differenceInDays(end, start);

      if (totalHours <= 24) {
        // Up to 1 day (e.g., "Last 24 hours")
        bucketType = "hour";
        bucketSize = 3; // 8 points
      } else if (totalHours <= 48) {
        // Up to 2 days (e.g., "Last 48 hours")
        bucketType = "hour";
        bucketSize = 2; // 24 points (48/2)
      } else if (totalDays <= 7) {
        // For ranges from >2 days up to 7 days (e.g., "Last 7 days")
        // This includes the case where totalDays is exactly 7.
        bucketType = "day";
        bucketSize = 1; // Will result in up to 7 daily points.
        // If totalDays is 3, you get 3 points. If 7, you get 7 points.
      } else if (totalDays <= 30) {
        // For ranges >7 days up to 30 days (e.g., "Last 30 days")
        bucketType = "day";
        bucketSize = 1; // Up to 30 daily points
      } else if (totalDays <= 90) {
        // For ranges >30 days up to 90 days (e.g., "Last 90 days")
        bucketType = "week";
        bucketSize = 1; // Up to ~13 weekly points
      } else {
        // For ranges >90 days
        bucketType = "month";
        bucketSize = 1; // Monthly points
      }

      function floorToBucket(d: Date): Date {
        if (bucketType === "hour") {
          const flooredHour =
            Math.floor(d.getHours() / bucketSize) * bucketSize;
          return new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            flooredHour,
            0,
            0,
            0,
          );
        } else if (bucketType === "day") {
          return startOfDay(d);
        } else if (bucketType === "week") {
          // startOfWeek defaults to Sunday. Use { weekStartsOn: 1 } for Monday.
          return startOfWeek(d, { weekStartsOn: 0 });
        } else {
          // 'month'
          return startOfMonth(d);
        }
      }

      function addOneBucket(d: Date): Date {
        if (bucketType === "hour") {
          return addHours(d, bucketSize);
        } else if (bucketType === "day") {
          return addDays(d, bucketSize);
        } else if (bucketType === "week") {
          return addWeeks(d, bucketSize);
        } else {
          // 'month'
          return addMonths(d, bucketSize);
        }
      }

      //
      // 4) Generate an ordered list of all bucket‐start timestamps from floor(start) up to <= end
      //
      const buckets: Date[] = [];
      let cursor = floorToBucket(start);

      const effectiveEnd = end; // Use the original end for comparison with cursor

      while (cursor <= effectiveEnd) {
        buckets.push(cursor);
        const nextCursor = addOneBucket(cursor);
        // Safety break if bucket size is 0 or negative (should not happen with current logic)
        if (nextCursor <= cursor) {
          console.error(
            "Bucket generation stalled. Check bucketSize and addOneBucket logic.",
            { bucketType, bucketSize, cursor, nextCursor },
          );
          break;
        }
        cursor = nextCursor;
      }

      //
      // 5) Fetch all orders in the raw date range, then assign each to its bucket
      //
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const bucketMap: Record<string, { revenue: number; orders: number }> = {};
      for (const b of buckets) {
        bucketMap[b.toISOString()] = { revenue: 0, orders: 0 };
      }

      for (const order of orders) {
        const bucketStartForOrder = floorToBucket(order.createdAt);
        const key = bucketStartForOrder.toISOString();

        if (bucketMap[key]) {
          bucketMap[key].revenue += order.totalPrice;
          bucketMap[key].orders += 1;
        }
      }

      const chartData = buckets.map((b) => {
        // Ensure data exists, though it should due to pre-initialization
        const data = bucketMap[b.toISOString()] || { revenue: 0, orders: 0 };
        let label: string;

        if (bucketType === "hour") {
          label = format(b, "MMM dd HH:00");
        } else if (bucketType === "day") {
          label = format(b, "MMM dd"); // e.g., "Jun 02"
        } else if (bucketType === "week") {
          label = format(b, "MMM dd"); // Start of week, e.g., "Jun 01"
        } else {
          // 'month'
          label = format(b, "MMM yyyy");
        }

        return {
          time: label,
          revenue: data.revenue,
          orders: data.orders,
        };
      });

      return chartData;
    }),
  // Get recent completed orders
  getRecentOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(5),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { limit } = input;

      // Get recent completed orders from database
      const recentOrders = await prisma.order.findMany({
        where: {
          OR: [{ status: OrderStatus.PAID }, { status: OrderStatus.DELIVERED }],
        },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
            },
          },
          OrderItem: {
            select: {
              quantity: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      // Map to the format expected by the UI
      return recentOrders.map((order) => ({
        id: order.id,
        customer: order.customer.name,
        date: order.createdAt.toISOString(),
        total: order.totalPrice,
        items: order.OrderItem.reduce((sum, item) => sum + item.quantity, 0),
      }));
    }),

  // Get top 5 products by sales volume
  getTopProducts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { limit } = input;

      // Get all order items with product info from completed orders
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            OR: [
              { status: OrderStatus.PAID },
              { status: OrderStatus.DELIVERED },
            ],
          },
        },
        include: {
          product: {
            select: {
              name: true,
              stripeProductName: true,
            },
          },
          order: {
            select: {
              totalPrice: true,
            },
          },
        },
      });

      // Group by product and calculate totals
      const productStats = orderItems.reduce(
        (acc, item) => {
          const productKey = item.productId;
          const productName = item.product.name;
          const stripeProductName =
            item.product.stripeProductName || item.product.name;

          if (!acc[productKey]) {
            acc[productKey] = {
              id: productKey,
              name: productName,
              stripeProductName: stripeProductName,
              totalSales: 0,
              totalRevenue: 0,
            };
          }

          acc[productKey].totalSales += item.quantity;
          acc[productKey].totalRevenue += item.price * item.quantity;

          return acc;
        },
        {} as Record<
          string,
          {
            id: string;
            name: string;
            stripeProductName: string;
            totalSales: number;
            totalRevenue: number;
          }
        >,
      );

      // Convert to array and sort by total revenue
      return Object.values(productStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
        .map((product) => ({
          name: product.name,
          stripeProductName: product.stripeProductName,
          totalSales: product.totalSales,
          totalRevenue: product.totalRevenue,
        }));
    }),

  // Get top 5 customers by total spending
  getTopCustomers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { limit } = input;

      // Get all completed orders with customer info
      const orders = await prisma.order.findMany({
        where: {
          OR: [{ status: OrderStatus.PAID }, { status: OrderStatus.DELIVERED }],
        },
        include: {
          customer: {
            select: {
              email: true,
            },
          },
        },
      });

      // Group by customer email and calculate totals
      const customerStats = orders.reduce(
        (acc, order) => {
          const customerEmail = order.customer.email;

          if (!acc[customerEmail]) {
            acc[customerEmail] = {
              email: customerEmail,
              totalOrders: 0,
              totalSpent: 0,
            };
          }

          acc[customerEmail].totalOrders += 1;
          acc[customerEmail].totalSpent += order.totalPrice;

          return acc;
        },
        {} as Record<
          string,
          { email: string; totalOrders: number; totalSpent: number }
        >,
      );

      // Convert to array and sort by total spent
      return Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    }),

  // Get click stats (total clicks and conversion rate)
  getClickStats: adminProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);

      // Get current period site clicks (all visitors)
      const currentPeriodClicks = await prisma.siteClick.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      // Get current period orders
      const currentPeriodOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
      });

      // Calculate conversion rate
      const conversionRate =
        currentPeriodClicks > 0
          ? (currentPeriodOrders / currentPeriodClicks) * 100
          : 0;

      const previousDateRange = getPreviousDateRange(timeRange, dateRange);

      // Get previous period site clicks
      const previousPeriodClicks = await prisma.siteClick.count({
        where: {
          createdAt: {
            gte: previousDateRange.start,
            lte: previousDateRange.end,
          },
        },
      });

      // Get previous period orders
      const previousPeriodOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: previousDateRange.start,
            lte: previousDateRange.end,
          },
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        },
      });

      // Calculate previous conversion rate
      const previousConversionRate =
        previousPeriodClicks > 0
          ? (previousPeriodOrders / previousPeriodClicks) * 100
          : 0;

      // Calculate percent changes
      let clicksPercentChange = 0;
      if (previousPeriodClicks > 0) {
        clicksPercentChange =
          ((currentPeriodClicks - previousPeriodClicks) /
            previousPeriodClicks) *
          100;
      }

      let conversionPercentChange = 0;
      if (previousConversionRate > 0) {
        conversionPercentChange =
          ((conversionRate - previousConversionRate) / previousConversionRate) *
          100;
      }

      return {
        clicks: currentPeriodClicks,
        clicksPercentChange: parseFloat(clicksPercentChange.toFixed(1)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        conversionPercentChange: parseFloat(conversionPercentChange.toFixed(1)),
      };
    }),

  // Get recent completed orders with detailed information for the table
  getLatestCompletedOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { limit } = input;

      // Get recent completed orders from database with all needed info
      const recentOrders = await prisma.order.findMany({
        where: {
          OR: [{ status: OrderStatus.PAID }, { status: OrderStatus.DELIVERED }],
        },
        include: {
          customer: {
            select: {
              email: true,
            },
          },
          OrderItem: {
            select: {
              price: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          Wallet: {
            select: {
              chain: true,
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      // Map to the format expected by the UI
      return recentOrders.map((order) => {
        // Sort order items by price (most expensive first)
        const sortedItems = [...order.OrderItem].sort(
          (a, b) => b.price - a.price,
        );
        const mostExpensive = sortedItems[0];
        const additionalCount = sortedItems.length - 1;

        return {
          id: order.id,
          products: mostExpensive
            ? additionalCount > 0
              ? `${mostExpensive.product.name} +${additionalCount} more`
              : mostExpensive.product.name
            : "N/A",
          price: order.totalPrice,
          paymentType: order.paymentType,
          cryptoType: order.Wallet.length > 0 ? order.Wallet[0].chain : null,
          email: order.customer.email,
          createdAt: order.createdAt.toISOString(),
        };
      });
    }),
});
