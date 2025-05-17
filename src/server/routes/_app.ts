import { createTRPCRouter } from "../init";
import { productRouter } from "./product";
import { authenticationRouter } from "./authentication";
import { inferRouterOutputs } from "@trpc/server";

export const appRouter = createTRPCRouter({
  product: productRouter,
  auth: authenticationRouter
});

export type AppRouter = typeof appRouter;
type RouterOutput = inferRouterOutputs<AppRouter>;
export type ProductGetAllOutput = RouterOutput['product']['getAll'];