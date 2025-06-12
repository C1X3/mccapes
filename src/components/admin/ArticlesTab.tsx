import { useState, useEffect } from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import { FaEdit, FaTrash, FaPlus, FaGripVertical, FaNewspaper, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";
import ArticleFormModal, { ArticleFormModalSchema } from "@/components/admin/ArticleFormModal";
import { Article } from "@generated";

export default function ArticlesTab() {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ArticleFormModalSchema | undefined>(undefined);
    const [orderedArticles, setOrderedArticles] = useState<Article[]>([]);
    const [isDragDisabled, setIsDragDisabled] = useState(false);

    const trpc = useTRPC();

    // tRPC article hooks
    const articles = useQuery(trpc.article.getAll.queryOptions({ includeInactive: true }));
    const deleteArticleMutation = useMutation(trpc.article.delete.mutationOptions({
        onSuccess: () => {
            toast.success("Article deleted successfully");
            articles.refetch();
        },
        onError: (error) => {
            toast.error(`Error deleting article: ${error.message}`);
        },
    }));

    // Article order mutation
    const updateArticleOrderMutation = useMutation(trpc.article.updateOrders.mutationOptions({
        onSuccess: () => {
            toast.success("Article order updated successfully");
        },
        onError: (error) => {
            toast.error(`Error updating article order: ${error.message}`);
            // Reset to original order if update fails
            if (articles.data) {
                setOrderedArticles(articles.data);
            }
        },
    }));

    // Toggle article active status
    const toggleArticleStatus = useMutation(trpc.article.update.mutationOptions({
        onSuccess: () => {
            toast.success("Article status updated successfully");
            articles.refetch();
        },
        onError: (error) => {
            toast.error(`Error updating article status: ${error.message}`);
        },
    }));

    useEffect(() => {
        if (articles.data) {
            setOrderedArticles(articles.data);
        }
    }, [articles.data]);

    const handleEditArticle = (article: Article) => {
        setSelectedArticle({
            id: article.id,
            title: article.title,
            description: article.description,
            videoKey: article.videoKey,
            thumbnailUrl: article.thumbnailUrl || "",
            color: article.color,
            alignment: article.alignment as "left" | "right",
            productSlug: article.productSlug,
            isActive: article.isActive,
            order: article.order,
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteArticle = (article: Article) => {
        if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
            deleteArticleMutation.mutate({ id: article.id });
        }
    };

    const handleToggleStatus = (article: Article) => {
        toggleArticleStatus.mutate({
            id: article.id,
            isActive: !article.isActive,
        });
    };

    const handleReorder = (newOrder: Article[]) => {
        setOrderedArticles(newOrder);

        const articleOrders = newOrder.map((article, index) => ({
            id: article.id,
            order: index,
        }));

        updateArticleOrderMutation.mutate({ articleOrders });
    };

    const handleModalClose = () => {
        setSelectedArticle(undefined);
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
    };

    const handleModalSuccess = () => {
        articles.refetch();
        handleModalClose();
    };

    if (articles.isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (articles.isError) {
        return (
            <div className="text-red-500 text-center p-4">
                Error loading articles: {articles.error?.message}
            </div>
        );
    }    return (
        <div className="bg-[color-mix(in_srgb,var(--background),#333_15%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                    <FaNewspaper />
                    Articles
                </h2>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
                >
                    <FaPlus />
                    Add Article                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                    <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Total Articles</h3>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{orderedArticles.length}</p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                    <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Active Articles</h3>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                        {orderedArticles.filter(a => a.isActive).length}
                    </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                    <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Inactive Articles</h3>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                        {orderedArticles.filter(a => !a.isActive).length}
                    </p>                </div>
            </div>

            {/* Article List */}
            <div className="bg-white rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] mt-6">
                <div className="p-4 border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Articles</h2>
                    <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                        Drag and drop to reorder articles
                    </p>
                </div>

                {orderedArticles.length === 0 ? (
                    <div className="p-8 text-center text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                        <FaNewspaper className="mx-auto mb-4 text-4xl" />
                        <p>No articles yet. Create your first article!</p>
                    </div>                ) : (                    <div className="p-4">
                        <Reorder.Group
                            axis="y"
                            values={orderedArticles}
                            onReorder={handleReorder}
                            className="space-y-2"
                        >
                            <AnimatePresence>
                                {orderedArticles.map((article) => (                                    <Reorder.Item
                                        key={article.id}
                                        value={article}
                                        dragListener={!isDragDisabled}
                                        className="bg-[color-mix(in_srgb,var(--background),#333_3%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] hover:border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] transition-colors"
                                    ><div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <FaGripVertical
                                                    className="text-[color-mix(in_srgb,var(--foreground),#888_50%)] cursor-move"
                                                    onMouseDown={() => setIsDragDisabled(false)}
                                                    onMouseUp={() => setIsDragDisabled(true)}
                                                />

                                                <div className="flex-1">
                                                    <h3 className="font-medium text-[var(--foreground)] mb-1">
                                                        {article.title}
                                                    </h3>
                                                    <div className="hidden md:flex items-center gap-4 text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                                        <span>Product: {article.productSlug}</span>
                                                        <span>Alignment: {article.alignment}</span>
                                                        <span>Order: {article.order}</span>
                                                    </div>
                                                </div>                                                <div className="hidden md:flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(article)}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${article.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {article.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                                        {article.isActive ? "Active" : "Inactive"}
                                                    </button>
                                                </div>
                                            </div>                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => handleEditArticle(article)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteArticle(article)}
                                                    className="hidden md:block p-2 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </AnimatePresence>
                        </Reorder.Group>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ArticleFormModal
                isOpen={isAddModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                isEditing={false}
            />

            <ArticleFormModal
                isOpen={isEditModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                initialData={selectedArticle}
                isEditing={true}
            />
        </div>
    );
}
