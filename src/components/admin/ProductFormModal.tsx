'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Prisma } from "@generated";
import { useTRPC } from "@/server/client";
import { useMutation } from "@tanstack/react-query";

type ProductFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Prisma.ProductCreateInput;
    isEditing?: boolean;
    onSuccess?: () => void;
};

export default function ProductFormModal({
    isOpen,
    onClose,
    initialData,
    isEditing = false,
    onSuccess,
}: ProductFormModalProps) {
    const trpc = useTRPC();

    const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState("");

    const {
        control,
        handleSubmit,
        reset,
        setValue,
    } = useForm<Prisma.ProductCreateInput>({
        defaultValues: initialData || {
            name: "",
            description: "",
            price: 0,
            stock: [],
            image: "",
            additionalImages: [],
            category: "",
            badge: "",
            rating: 0,
            features: [],
        },
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            setAdditionalImageUrls(initialData.additionalImages as string[] || []);
        } else {
            reset({
                name: "",
                description: "",
                price: 0,
                stock: [],
                image: "",
                additionalImages: [],
                category: "",
                badge: "",
                rating: 0,
                features: [],
            });
            setAdditionalImageUrls([]);
        }
    }, [initialData, reset]);

    // tRPC mutations
    const createProduct = useMutation(trpc.product.create.mutationOptions({
        onMutate: (data) => {
            console.log(data);
        },
        onSuccess: () => {
            toast.success("Product created successfully");
            reset();
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(`Error creating product: ${error.message}`);
        },
    }));

    const updateProduct = useMutation(trpc.product.update.mutationOptions({
        onSuccess: () => {
            toast.success("Product updated successfully");
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(`Error updating product: ${error.message}`);
        },
    }));

    const handleAddAdditionalImage = () => {
        if (newImageUrl && !additionalImageUrls.includes(newImageUrl)) {
            const newImages = [...additionalImageUrls, newImageUrl];
            setAdditionalImageUrls(newImages);
            setValue("additionalImages", newImages);
            setNewImageUrl("");
        }
    };

    const handleRemoveAdditionalImage = (index: number) => {
        const newImages = additionalImageUrls.filter((_, i) => i !== index);
        setAdditionalImageUrls(newImages);
        setValue("additionalImages", newImages);
    };

    const onSubmit = (data: Prisma.ProductCreateInput) => {
        // Include the additional images
        data.additionalImages = additionalImageUrls.concat(data.additionalImages as string[]);

        const formattedData = {
            ...data,
            additionalImages: additionalImageUrls,
            features: data.features as string[],
            stock: data.stock as string[],
        };

        if (isEditing && initialData?.id) {
            updateProduct.mutate({
                id: initialData.id,
                ...formattedData,
            });
        } else {
            createProduct.mutate(formattedData);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--background)] rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                        {isEditing ? "Edit Product" : "Add New Product"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
                    >
                        <FaTimes size={20} className="text-[var(--foreground)]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-[var(--foreground)] mb-2">
                            Product Name *
                        </label>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Product name is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="name"
                                        type="text"
                                        {...field}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter product name"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-[var(--foreground)] mb-2">
                            Description *
                        </label>
                        <Controller
                            name="description"
                            control={control}
                            rules={{ required: "Description is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        {...field}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter product description"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Price + Stock */}
                    <div>
                        <label htmlFor="price" className="block text-[var(--foreground)] mb-2">
                            Price ($) *
                        </label>
                        <Controller
                            name="price"
                            control={control}
                            rules={{
                                required: "Price is required",
                                min: { value: 0, message: "Price must be a positive number" },
                            }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={field.value as number}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        onBlur={field.onBlur}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter price"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Stock */}
                    <Controller
                        name="stock"
                        control={control}
                        rules={{
                            required: "At least one stock code is required",
                        }}
                        render={({ field, fieldState }) => (
                            <div>
                                <label htmlFor="stock" className="block text-[var(--foreground)] mb-2">
                                    Stock *
                                </label>
                                <textarea
                                    id="stock"
                                    rows={6}
                                    value={field.value as string[]}
                                    onChange={(val) => {
                                        const arr = val.target.value
                                            .split("\n")
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        field.onChange(arr);
                                    }}
                                    onBlur={field.onBlur}
                                    placeholder="Enter one code per line"
                                    className="
                                            w-full p-3
                                            bg-[color-mix(in_srgb,var(--background),#333_15%)]
                                            border rounded-lg
                                            text-[var(--foreground)]
                                            focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                                            border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]
                                            resize-vertical
                                        "
                                />
                                {fieldState.error && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-[var(--foreground)] mb-2">
                            Category *
                        </label>
                        <Controller
                            name="category"
                            control={control}
                            rules={{ required: "Category is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="category"
                                        type="text"
                                        {...field}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter category"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Badge */}
                    <div>
                        <label htmlFor="badge" className="block text-[var(--foreground)] mb-2">
                            Badge *
                        </label>
                        <Controller
                            name="badge"
                            control={control}
                            rules={{ required: "Badge is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="badge"
                                        type="text"
                                        {...field}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter badge"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Rating */}
                    <div>
                        <label htmlFor="rating" className="block text-[var(--foreground)] mb-2">
                            Rating *
                        </label>
                        <Controller
                            name="rating"
                            control={control}
                            rules={{ required: "Rating is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="rating"
                                        type="number"
                                        value={field.value as number}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        onBlur={field.onBlur}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter rating"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Features */}
                    <div>
                        <label htmlFor="features" className="block text-[var(--foreground)] mb-2">
                            Features *
                        </label>
                        <Controller
                            name="features"
                            control={control}
                            rules={{ required: "Features are required" }}
                            render={({ field, fieldState }) => {
                                // Turn the array into a comma-separated string (or blank if undefined)
                                const valueString = Array.isArray(field.value)
                                    ? (field.value as string[]).join(", ")
                                    : "";

                                return (
                                    <>
                                        <input
                                            id="features"
                                            type="text"
                                            // display the joined string
                                            value={valueString}
                                            onChange={(e) => {
                                                // split on comma, trim whitespace, drop any empty entries
                                                const arr = e.target.value
                                                    .split(",")
                                                    .map((s) => s.trim())
                                                    .filter(Boolean);
                                                field.onChange(arr);
                                            }}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                            className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                            placeholder="Enter features separated by commas"
                                        />
                                        {fieldState.error && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </>
                                );
                            }}
                        />
                    </div>

                    {/* Main Image */}
                    <div>
                        <label htmlFor="image" className="block text-[var(--foreground)] mb-2">
                            Main Image URL *
                        </label>
                        <Controller
                            name="image"
                            control={control}
                            rules={{ required: "Main image URL is required" }}
                            render={({ field, fieldState }) => (
                                <>
                                    <input
                                        id="image"
                                        type="text"
                                        {...field}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                        placeholder="Enter main image URL"
                                    />
                                    {fieldState.error && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>

                    {/* Additional Images (unchanged) */}
                    <div>
                        <label className="block text-[var(--foreground)] mb-2">Additional Images</label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <input
                                type="text"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1 p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                placeholder="Enter additional image URL"
                            />
                            <button
                                type="button"
                                onClick={handleAddAdditionalImage}
                                className="px-4 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)]"
                            >
                                Add Image
                            </button>
                        </div>
                        {additionalImageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {additionalImageUrls.map((url, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-[color-mix(in_srgb,var(--background),#333_10%)] rounded-lg"
                                    >
                                        <span className="text-sm text-[var(--foreground)] truncate pr-2">{url}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAdditionalImage(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--background),#333_25%)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
                            disabled={createProduct.isPending || updateProduct.isPending}
                        >
                            {createProduct.isPending || updateProduct.isPending
                                ? "Saving..."
                                : isEditing
                                    ? "Update Product"
                                    : "Add Product"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}