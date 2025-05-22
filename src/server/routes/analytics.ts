import { prisma } from "@/utils/prisma";
import { TRPCError } from "@trpc/server";
import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
  subMonths,
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
          status: "PAID",
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

      // Format dates based on time range
      let groupByFormat = "yyyy-MM-dd"; // Default for daily
      let resultFormat = "MMM dd"; // Default for daily display

      if (timeRange === "today" || timeRange === "yesterday") {
        groupByFormat = "yyyy-MM-dd-HH";
        resultFormat = "HH:00";
      } else if (["past_6_months", "past_year"].includes(timeRange)) {
        groupByFormat = "yyyy-MM";
        resultFormat = "MMM yyyy";
      }

      // Get orders within the date range
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: "PAID",
        },
        select: {
          totalPrice: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group data by date format
      const groupedData: Record<string, { revenue: number; orders: number }> =
        {};

      orders.forEach((order) => {
        const date = format(order.createdAt, groupByFormat);

        if (!groupedData[date]) {
          groupedData[date] = { revenue: 0, orders: 0 };
        }

        groupedData[date].revenue += order.totalPrice;
        groupedData[date].orders += 1;
      });

      // Convert to array format expected by chart
      const chartData = Object.entries(groupedData).map(([date, data]) => {
        // Format the date for display
        let dateObj;
        if (groupByFormat === "yyyy-MM-dd-HH") {
          // For hourly data
          const [year, month, day, hour] = date.split("-").map(Number);
          dateObj = new Date(year, month - 1, day, hour);
        } else if (groupByFormat === "yyyy-MM") {
          // For monthly data
          const [year, month] = date.split("-").map(Number);
          dateObj = new Date(year, month - 1, 1);
        } else {
          // For daily data
          dateObj = parseISO(date);
        }

        return {
          time: format(dateObj, resultFormat),
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
          status: "PAID",
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
