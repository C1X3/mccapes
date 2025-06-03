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
import { baseProcedure, createTRPCRouter } from "../init";
import { OrderStatus } from "@generated";

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
  customRange?: { startDate: string; endDate: string }
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
      return {
        start: new Date(customRange.startDate),
        end: new Date(customRange.endDate),
      };
    default:
      return {
        start: subDays(now, 30),
        end: now,
      };
  }
};

export const analyticsRouter = createTRPCRouter({
  // Get revenue data
  getRevenue: baseProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);

      // Get current period revenue
      const currentPeriodOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          OR: [
            { status: OrderStatus.PAID },
            { status: OrderStatus.DELIVERED },
          ],
        },
        select: {
          totalPrice: true,
          paymentFee: true,
        },
      });

      const currentTotalAmount = currentPeriodOrders.reduce(
        (sum, order) => sum + order.totalPrice,
        0
      );

      // Calculate previous period date range
      const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
      const prevEnd = new Date(dateRange.start);
      const prevStart = new Date(prevEnd.getTime() - periodLength);

      // Get previous period revenue for comparison
      const previousPeriodOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: prevStart,
            lte: prevEnd,
          },
          status: "PAID",
        },
        select: {
          totalPrice: true,
          paymentFee: true,
        },
      });

      const previousTotalAmount = previousPeriodOrders.reduce(
        (sum, order) => sum + order.totalPrice,
        0
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
  getOrders: baseProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
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

      // Calculate previous period date range
      const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
      const prevEnd = new Date(dateRange.start);
      const prevStart = new Date(prevEnd.getTime() - periodLength);

      // Get previous period orders for comparison
      const previousPeriodOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: prevStart,
            lte: prevEnd,
          },
          status: "PAID",
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
  getChartData: baseProcedure
    .input(
      z.object({
        timeRange: timeRangeSchema,
        customRange: customDateRangeSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const { timeRange, customRange } = input;
      const dateRange = getDateRange(timeRange, customRange);
      const { start, end } = dateRange;

      let bucketType: 'hour' | 'day' | 'week' | 'month';
      let bucketSize: number;

      const totalHours = differenceInHours(end, start);
      const totalDays = differenceInDays(end, start);

      if (totalHours <= 24) {
        bucketType = 'hour';
        bucketSize = 1;
      } else if (totalHours <= 48) {
        bucketType = 'hour';
        bucketSize = 2;
      } else if (totalHours <= 168) { // 7 days = 168 hours
        bucketType = 'hour';
        bucketSize = 6;
      } else if (totalDays <= 30) {
        bucketType = 'day';
        bucketSize = 1;
      } else if (totalDays <= 90) {
        bucketType = 'week';
        bucketSize = 1;
      } else {
        bucketType = 'month';
        bucketSize = 1;
      }

      function floorToBucket(d: Date): Date {
        if (bucketType === 'hour') {
          // e.g. if bucketSize = 2, and d = 2025-06-02T15:37:00, we want 2025-06-02T14:00:00
          const flooredHour = Math.floor(d.getHours() / bucketSize) * bucketSize;
          return new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            flooredHour,
            0,
            0,
            0
          );
        } else if (bucketType === 'day') {
          // simply startOfDay
          return startOfDay(d);
        } else if (bucketType === 'week') {
          // startOfWeek (defaults to Sunday start; adjust if you want Monday start, pass { weekStartsOn: 1 })
          const weekStart = startOfWeek(d, { weekStartsOn: 0 });
          // if bucketSize > 1, you could floor to 2-week or 3-week boundaries, but for now bucketSize=1
          return weekStart;
        } else {
          // bucketType = 'month'
          const m = startOfMonth(d);
          // if bucketSize > 1 (e.g., 3-month buckets), you could do:
          // const monthGroup = Math.floor(m.getMonth() / bucketSize) * bucketSize;
          // return new Date(m.getFullYear(), monthGroup, 1);
          return m;
        }
      }

      //
      // 3) Helper: given a Date, “add one bucket” of the appropriate size
      //
      function addOneBucket(d: Date): Date {
        if (bucketType === 'hour') {
          return addHours(d, bucketSize);
        } else if (bucketType === 'day') {
          return addDays(d, bucketSize);
        } else if (bucketType === 'week') {
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

      while (cursor <= end) {
        buckets.push(cursor);
        cursor = addOneBucket(cursor);
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
          createdAt: 'asc',
        },
      });

      // Initialize a map from bucket‐ISO (string) → { revenue, orders }
      const bucketMap: Record<string, { revenue: number; orders: number }> = {};
      for (const b of buckets) {
        bucketMap[b.toISOString()] = { revenue: 0, orders: 0 };
      }

      // For each order, find its bucket start, then accumulate
      for (const order of orders) {
        const bucketStart = floorToBucket(order.createdAt);
        const key = bucketStart.toISOString();
        if (!bucketMap[key]) {
          // In case an order falls exactly on “end + epsilon” or rounding, 
          // but normally we pre‐filled all buckets up to end inclusive.
          bucketMap[key] = { revenue: 0, orders: 0 };
        }
        bucketMap[key].revenue += order.totalPrice;
        bucketMap[key].orders += 1;
      }

      //
      // 6) Convert bucketMap → array in chronological order, formatting labels
      //
      const chartData = buckets.map((b) => {
        const data = bucketMap[b.toISOString()]!;
        let label: string;

        if (bucketType === 'hour') {
          // e.g. “Jun 02 14:00”
          label = format(b, 'MMM dd HH:00');
        } else if (bucketType === 'day') {
          // e.g. “Jun 02”
          label = format(b, 'MMM dd');
        } else if (bucketType === 'week') {
          // show week’s starting day: “Jun 01” (Sunday)
          label = format(b, 'MMM dd');
        } else {
          // month
          label = format(b, 'MMM yyyy');
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
  getRecentOrders: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(5),
      })
    )
    .query(async ({ input }) => {
      const { limit } = input;

      // Get recent completed orders from database
      const recentOrders = await prisma.order.findMany({
        where: {
          OR: [
            { status: OrderStatus.PAID },
            { status: OrderStatus.DELIVERED },
          ],
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
});
