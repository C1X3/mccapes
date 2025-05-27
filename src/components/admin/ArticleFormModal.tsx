import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Controller, Resolver, useForm } from "react-hook-form";
import { FaTimes, FaUpload, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useTRPC } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const schema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    videoKey: z.string().min(1, "Video file is required"),
    thumbnailUrl: z.string().optional(),
    color: z.string().default("var(--primary)"),
    alignment: z.enum(["left", "right"]).default("left"),
    productSlug: z.string().min(1, "Product slug is required"),
    isActive: z.boolean().default(true),
    order: z.number().optional().default(0),
});

export type ArticleFormModalSchema = z.infer<typeof schema>;

interface ArticleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: ArticleFormModalSchema;
    isEditing?: boolean;
    onSuccess?: () => void;
}

export default function ArticleFormModal({
    isOpen,
    onClose,
    initialData,
    isEditing = false,
    onSuccess,
}: ArticleFormModalProps) {
    const trpc = useTRPC();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema) as Resolver<z.infer<typeof schema>>,
        defaultValues: initialData || {
            title: "",
            description: "",
            videoKey: "",
            thumbnailUrl: "",
            color: "var(--primary)",
            alignment: "left",
            productSlug: "",
            isActive: true,
            order: 0,
        },
    });

    const videoKey = watch("videoKey");

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            if (initialData.videoKey) {
                // Set video preview if editing
                const videoUrl = `${process.env.NEXT_PUBLIC_MINIO_ENDPOINT}/${process.env.DATA_BUCKET}/${initialData.videoKey}`;
                setVideoPreviewUrl(videoUrl);
            }
        } else {
            reset({
                title: "",
                description: "",
                videoKey: "",
                thumbnailUrl: "",
                color: "var(--primary)",
                alignment: "left",
                productSlug: "",
                isActive: true,
                order: 0,
            });
            setVideoPreviewUrl("");
        }
    }, [initialData, reset]);

    // tRPC mutations
    const createArticle = useMutation(trpc.article.create.mutationOptions({
        onSuccess: () => {
            toast.success("Article created successfully");
            reset();
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(`Error creating article: ${error.message}`);
        },
    }));

    const updateArticle = useMutation(trpc.article.update.mutationOptions({
        onSuccess: () => {
            toast.success("Article updated successfully");
            onClose();
            if (onSuccess) onSuccess();
        },
        onError: (error) => {
            toast.error(`Error updating article: ${error.message}`);
        },
    }));

    const onSubmit = (data: z.infer<typeof schema>) => {
        if (isEditing && initialData?.id) {
            updateArticle.mutate({
                id: initialData.id,
                ...data,
            });
        } else {
            createArticle.mutate(data);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a valid video file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create XHR for progress tracking
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        setValue('videoKey', response.objectKey);
                        setVideoPreviewUrl(response.url);
                        toast.success('Video uploaded successfully');
                    } else {
                        toast.error(`Upload failed: ${response.error || 'Unknown error'}`);
                    }
                } else {
                    toast.error(`Upload failed with status ${xhr.status}`);
                }
                setIsUploading(false);
            });

            xhr.addEventListener('error', () => {
                toast.error('An error occurred during the upload');
                setIsUploading(false);
            });

            xhr.open('POST', '/api/upload-article-media');
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload video');
            setIsUploading(false);
        }
    };

    const isLoading = createArticle.isPending || updateArticle.isPending || isUploading;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 z-50 flex items-center justify-center p-4">
            <motion.div
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            {isEditing ? "Edit Article" : "Create New Article"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                            disabled={isLoading}
                        >
                            <FaTimes className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Title
                            </label>
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="text"
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="Enter article title"
                                    />
                                )}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Description
                            </label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        rows={8}
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="Enter article description"
                                    />
                                )}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Video Upload */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Video Upload
                            </label>
                            <Controller
                                name="videoKey"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-4">
                                        <input
                                            type="hidden"
                                            {...field}
                                        />
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Uploading... {uploadProgress}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaUpload />
                                                        {videoKey ? "Change Video" : "Upload Video"}
                                                    </>
                                                )}
                                            </button>
                                            {videoKey && (
                                                <span className="text-green-600 text-sm">
                                                    Video uploaded successfully
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        {isUploading && (
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        {videoPreviewUrl && !isUploading && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                                                    Video Preview:
                                                </p>
                                                <video
                                                    src={videoPreviewUrl}
                                                    controls
                                                    className="w-full max-h-[200px] object-contain rounded-lg border border-gray-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                            {errors.videoKey && (
                                <p className="mt-1 text-sm text-red-600">{errors.videoKey.message}</p>
                            )}
                        </div>

                        {/* Thumbnail URL */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Custom Thumbnail URL (Optional)
                            </label>
                            <Controller
                                name="thumbnailUrl"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="url"
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="https://example.com/thumbnail.jpg"
                                    />
                                )}
                            />
                            <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                If provided, this will be used as the video thumbnail
                            </p>
                        </div>

                        {/* Product Slug */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                Product Slug
                            </label>
                            <Controller
                                name="productSlug"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="text"
                                        className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder="experience-cape"
                                    />
                                )}
                            />
                            {errors.productSlug && (
                                <p className="mt-1 text-sm text-red-600">{errors.productSlug.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Color
                                </label>
                                <Controller
                                    name="color"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        >
                                            <option value="var(--primary)">Primary</option>
                                            <option value="var(--accent)">Accent</option>
                                            <option value="#ef4444">Red</option>
                                            <option value="#3b82f6">Blue</option>
                                            <option value="#10b981">Green</option>
                                            <option value="#f59e0b">Yellow</option>
                                            <option value="#8b5cf6">Purple</option>
                                        </select>
                                    )}
                                />
                            </div>

                            {/* Alignment */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Alignment
                                </label>
                                <Controller
                                    name="alignment"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        >
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                        </select>
                                    )}
                                />
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                    Order
                                </label>
                                <Controller
                                    name="order"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="number"
                                            min="0"
                                            className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                            placeholder="0"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-3">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => {
                                    const { value, onChange, onBlur, name, ref } = field;
                                    return (
                                        <div className="flex items-center gap-3">
                                            <input
                                                id={name}
                                                type="checkbox"
                                                checked={value}
                                                onChange={e => onChange(e.target.checked)}
                                                onBlur={onBlur}
                                                name={name}
                                                ref={ref}
                                                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                                            />
                                            <label htmlFor={name} className="text-sm font-medium text-[var(--foreground)]">
                                                Active (visible on homepage)
                                            </label>
                                        </div>
                                    );
                                }}
                            />
                            <label className="text-sm font-medium text-[var(--foreground)]">
                                Active (visible on homepage)
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {isEditing ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>{isEditing ? "Update Article" : "Create Article"}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
} 