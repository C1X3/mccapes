import { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaGripVertical,
  FaNewspaper,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";
import ArticleFormModal, {
  ArticleFormModalSchema,
} from "@/components/admin/ArticleFormModal";
import { Article } from "@generated/browser";

export default function ArticlesTab() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<
    ArticleFormModalSchema | undefined
  >(undefined);
  const [orderedArticles, setOrderedArticles] = useState<Article[]>([]);
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  const trpc = useTRPC();

  // tRPC article hooks
  const articles = useQuery(
    trpc.article.getAll.queryOptions({ includeInactive: true }),
  );
  const deleteArticleMutation = useMutation(
    trpc.article.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Article deleted successfully");
        articles.refetch();
      },
      onError: (error) => {
        toast.error(`Error deleting article: ${error.message}`);
      },
    }),
  );

  // Article order mutation
  const updateArticleOrderMutation = useMutation(
    trpc.article.updateOrders.mutationOptions({
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
    }),
  );

  // Toggle article active status
  const toggleArticleStatus = useMutation(
    trpc.article.update.mutationOptions({
      onSuccess: () => {
        toast.success("Article status updated successfully");
        articles.refetch();
      },
      onError: (error) => {
        toast.error(`Error updating article status: ${error.message}`);
      },
    }),
  );

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
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--color-admin-card)] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaNewspaper />
          Articles
        </h2>
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
          >
            <FaPlus className="size-4" />
            <span>Add Article</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
              Total Articles
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {orderedArticles.length}
            </p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
              Active Articles
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {orderedArticles.filter((a) => a.isActive).length}
            </p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
            <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
              Inactive Articles
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {orderedArticles.filter((a) => !a.isActive).length}
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-[var(--color-text-secondary)] mb-4">
        Drag and drop to reorder articles
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-4 px-2 text-[var(--foreground)] w-10">
                Order
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Title
              </th>
              <th className="text-left py-4 px-4 text-[var(--foreground)]">
                Product
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Status
              </th>
              <th className="text-right py-4 px-2 text-[var(--foreground)]">
                Actions
              </th>
            </tr>
          </thead>
          <Reorder.Group
            as="tbody"
            axis="y"
            values={orderedArticles}
            onReorder={handleReorder}
            className="relative"
          >
            {orderedArticles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-[var(--color-text-secondary)]"
                >
                  <FaNewspaper className="mx-auto mb-4 text-4xl" />
                  <p>No articles found</p>
                </td>
              </tr>
            ) : (
              orderedArticles.map((article) => (
                <Reorder.Item
                  key={article.id}
                  value={article}
                  as="tr"
                  dragListener={!isDragDisabled}
                  className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)]"
                >
                  <td className="py-4 px-2 text-[var(--color-text-secondary)] cursor-move">
                    <FaGripVertical className="text-[var(--color-text-secondary)]" />
                  </td>
                  <td className="py-4 px-2 text-[var(--foreground)] max-w-[250px]">
                    <div className="font-medium">{article.title}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] truncate">
                      {article.description.substring(0, 75)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[var(--foreground)]">
                    {article.productSlug}
                  </td>
                  <td className="py-4 px-2">
                    <button
                      onClick={() => handleToggleStatus(article)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        article.isActive
                          ? "bg-success-bg text-success-text"
                          : "bg-error-bg text-error-text"
                      }`}
                    >
                      {article.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      {article.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditArticle(article)}
                        className="p-2 text-info-text hover:bg-info-bg rounded transition-colors"
                        title="Edit Article"
                        onMouseEnter={() => setIsDragDisabled(true)}
                        onMouseLeave={() => setIsDragDisabled(false)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article)}
                        className="p-2 text-error-text hover:bg-error-bg rounded transition-colors"
                        title="Delete Article"
                        onMouseEnter={() => setIsDragDisabled(true)}
                        onMouseLeave={() => setIsDragDisabled(false)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </Reorder.Item>
              ))
            )}
          </Reorder.Group>
        </table>
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
