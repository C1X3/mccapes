import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@generated/client";

const PRODUCT_TYPE_VALUES = ["CAPE", "STANDARD"] as const;

const serializeCapeTexture = (bytes: Uint8Array | null) => {
  if (!bytes || bytes.length === 0) return null;
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:image/png;base64,${base64}`;
};

export const productRouter = createTRPCRouter({
  getAll: baseProcedure
    .input(
      z.object({
        isHomePage: z.boolean().default(false),
        isProductPage: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const raw = await prisma.product.findMany({
        orderBy: { order: "asc" },
        where: {
          ...(input.isHomePage && { hideHomePage: false }),
          ...(input.isProductPage && { hideProductPage: false }),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          image: true,
          additionalImages: true,
          productType: true,
          backgroundImageUrl: true,
          capeTexturePng: true,
          category: true,
          rating: true,
          badge: true,
          features: true,
          stock: true,
          slashPrice: true,
          hideHomePage: true,
          hideProductPage: true,
          isFeatured: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return raw.map(({ stock: stockArr, capeTexturePng, ...rest }) => {
        const capeTextureDataUrl =
          rest.productType === "CAPE"
            ? serializeCapeTexture(capeTexturePng)
            : null;
        return {
          ...rest,
          capeTextureDataUrl,
          stock: stockArr.length,
        };
      });
    }),
  getBySlugForArticle: baseProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          image: true,
          additionalImages: true,
          productType: true,
          backgroundImageUrl: true,
          capeTexturePng: true,
          category: true,
          rating: true,
          badge: true,
          features: true,
          stock: true,
          slashPrice: true,
          hideHomePage: true,
          hideProductPage: true,
          isFeatured: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!product) return null;

      const { stock: stockArr, capeTexturePng, ...rest } = product;
      return {
        ...rest,
        capeTextureDataUrl:
          rest.productType === "CAPE"
            ? serializeCapeTexture(capeTexturePng)
            : null,
        stock: stockArr.length,
      };
    }),

  getAllWithStock: adminProcedure.query(async () => {
    return await prisma.product.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        image: true,
        additionalImages: true,
        productType: true,
        backgroundImageUrl: true,
        capeTexturePng: true,
        category: true,
        rating: true,
        badge: true,
        features: true,
        stock: true,
        slashPrice: true,
        hideHomePage: true,
        hideProductPage: true,
        isFeatured: true,
        order: true,
        stripeProductName: true,
        stripeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        price: z.number().min(0),
        stock: z.array(z.string()),
        image: z.string().min(1),
        additionalImages: z.array(z.string()),
        productType: z.enum(PRODUCT_TYPE_VALUES),
        capeTextureBase64: z.string().optional(),
        backgroundImageUrl: z.string().optional(),
        category: z.string().min(1),
        badge: z.string().optional(),
        rating: z.number().min(0).max(5),
        features: z.array(z.string()),
        slashPrice: z.number().optional(),
        hideHomePage: z.boolean().default(false),
        hideProductPage: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
        stripeProductName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        productType,
        capeTextureBase64,
        additionalImages,
        backgroundImageUrl,
        ...rest
      } = input;
      const normalizedBackground = backgroundImageUrl?.trim() || null;
      const capeTexturePng =
        productType === "CAPE" && capeTextureBase64
          ? Buffer.from(capeTextureBase64, "base64")
          : null;

      return await prisma.product.create({
        data: {
          ...rest,
          productType,
          backgroundImageUrl: normalizedBackground,
          capeTexturePng,
          additionalImages: productType === "CAPE" ? [] : additionalImages,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        price: z.number().min(0).optional(),
        stock: z.array(z.string()).optional(),
        image: z.string().min(1).optional(),
        additionalImages: z.array(z.string()).optional(),
        productType: z.enum(PRODUCT_TYPE_VALUES).optional(),
        capeTextureBase64: z.string().optional(),
        clearCapeTexture: z.boolean().optional(),
        backgroundImageUrl: z.string().optional(),
        category: z.string().min(1).optional(),
        badge: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        features: z.array(z.string()).optional(),
        slashPrice: z.number().optional(),
        order: z.number().optional(),
        hideHomePage: z.boolean().optional(),
        hideProductPage: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        stripeProductName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Support users can only update stock
      if (ctx.role === "support") {
        const { id, stock } = input;
        // Check if they're trying to update anything other than stock
        const otherFields = Object.keys(input).filter(
          (key) => key !== "id" && key !== "stock",
        );
        if (otherFields.length > 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Support users can only update product stock",
          });
        }
        // Allow stock-only update
        if (stock !== undefined) {
          return await prisma.product.update({
            where: { id },
            data: { stock },
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No stock data provided",
        });
      }

      // Admin can update everything
      const { id, capeTextureBase64, clearCapeTexture, ...data } = input;
      const productType = data.productType;

      const updateData: Prisma.ProductUpdateInput = {
        ...data,
        backgroundImageUrl:
          typeof data.backgroundImageUrl === "string"
            ? data.backgroundImageUrl.trim() || null
            : data.backgroundImageUrl,
      };

      if (productType === "CAPE") {
        updateData.additionalImages = [];
      }
      if (productType === "STANDARD") {
        updateData.capeTexturePng = null;
      }
      if (capeTextureBase64 && productType !== "STANDARD") {
        updateData.capeTexturePng = Buffer.from(capeTextureBase64, "base64");
      }
      if (clearCapeTexture) {
        updateData.capeTexturePng = null;
      }

      return await prisma.product.update({
        where: { id },
        data: updateData,
      });
    }),

  // Stock-only update for support users
  updateStock: adminProcedure
    .input(
      z.object({
        id: z.string(),
        stock: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, stock } = input;
      return await prisma.product.update({
        where: { id },
        data: { stock },
      });
    }),

  updateOrders: adminProcedure
    .input(
      z.object({
        productOrders: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { productOrders } = input;

      // Update products in transaction
      const updates = productOrders.map(({ id, order }) =>
        prisma.product.update({
          where: { id },
          data: { order },
        }),
      );

      await prisma.$transaction(updates);

      return { success: true };
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

      return await prisma.product.delete({
        where: { id: input.id },
      });
    }),
});
