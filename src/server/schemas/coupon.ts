import { CouponType } from "@generated";
import { z } from "zod";

export const couponCodeSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(3, "Code must be at least 3 characters"),
    discount: z.number().positive("Discount must be a positive number"),
    type: z.nativeEnum(CouponType),
    validUntil: z.string().min(1, "Valid until date is required"),
    usageLimit: z
        .number()
        .int()
        .positive("Usage limit must be a positive number"),
    active: z.boolean().default(true),
});