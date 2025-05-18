import { z } from 'zod';
import { prisma } from '@/utils/prisma';
import { adminProcedure, baseProcedure, createTRPCRouter } from '../init';

export const productRouter = createTRPCRouter({
    getAll: baseProcedure.query(async () => {
        const raw = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                image: true,
                additionalImages: true,
                category: true,
                rating: true,
                badge: true,
                features: true,
                stock: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return raw.map(({ stock: stockArr, ...rest }) => ({
            ...rest,
            stock: stockArr.length,
        }));
    }),

    getAllWithStock: adminProcedure.query(async () => {
        return await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
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
                category: z.string().min(1),
                badge: z.string(),
                rating: z.number().min(0).max(5),
                features: z.array(z.string()),
            })
        )
        .mutation(async ({ input }) => {
            return await prisma.product.create({
                data: input
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
                category: z.string().min(1).optional(),
                badge: z.string().optional(),
                rating: z.number().min(0).max(5).optional(),
                features: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            return await prisma.product.update({
                where: { id },
                data,
            });
        }),

    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await prisma.product.delete({
                where: { id: input.id },
            });
        }),
}); 