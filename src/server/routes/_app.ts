import { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { analyticsRouter } from "./analytics";
import { authenticationRouter } from "./authentication";
import { checkoutRouter } from "./checkout";
import { couponRouter } from "./coupon";
import { productRouter } from "./product";

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authenticationRouter,
  checkout: checkoutRouter,
  analytics: analyticsRouter,
  coupon: couponRouter,
});

export type AppRouter = typeof appRouter;
type RouterOutput = inferRouterOutputs<AppRouter>;
export type ProductGetAllOutput = RouterOutput["product"]["getAll"];
