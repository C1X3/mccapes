import { useState, useEffect } from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaGripVertical,
  FaBox,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import ProductFormModal, {
  ProductFormModalSchema,
} from "@/components/admin/ProductFormModal";
import { Product } from "@generated/browser";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";
import { useAdminRole } from "@/contexts/AdminContext";
import StockEditModal from "./StockEditModal";

export default function ProductsTab() {
  const { userRole } = useAdminRole();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductFormModalSchema | undefined
  >(undefined);
  const [selectedStockProduct, setSelectedStockProduct] = useState<
    Product | undefined
  >(undefined);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  const router = useRouter();
  const trpc = useTRPC();

  // tRPC product hooks
  const products = useQuery(trpc.product.getAllWithStock.queryOptions());
  const deleteProductMutation = useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product deleted successfully");
        products.refetch();
      },
      onError: (error) => {
        toast.error(`Error deleting product: ${error.message}`);
      },
    }),
  );

  // Product order mutation
  const updateProductOrderMutation = useMutation(
    trpc.product.updateOrders.mutationOptions({
      onSuccess: () => {
        toast.success("Product order updated successfully");
      },
      onError: (error) => {
        toast.error(`Error updating product order: ${error.message}`);
        // Reset to original order if update fails
        if (products.data) {
          setOrderedProducts(products.data);
        }
      },
    }),
  );

  useEffect(() => {
    if (products.data) {
      setOrderedProducts(products.data);
    }
  }, [products.data]);

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate({ id });
    }
  };

  const handleEditProduct = (product: Product) => {
    // Support users can only edit stock
    if (userRole === "support") {
      setSelectedStockProduct(product);
      setIsStockModalOpen(true);
      return;
    }

    const formProduct: ProductFormModalSchema = {
      id: product.id,
      slug: product.slug || "",
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
      additionalImages: product.additionalImages,
      category: product.category,
      badge: product.badge || undefined,
      rating: product.rating,
      features: product.features,
      slashPrice: product.slashPrice || 0,
      hideHomePage: product.hideHomePage || false,
      hideProductPage: product.hideProductPage || false,
      isFeatured: product.isFeatured || false,
      order: product.order || 0,
      stripeProductName: product.stripeProductName || "",
    };
    setSelectedProduct(formProduct);
    setIsEditModalOpen(true);
  };

  const handleReorder = (reorderedProducts: Product[]) => {
    setOrderedProducts(reorderedProducts);

    // Update products with new order values
    const productOrders = reorderedProducts.map((product, index) => ({
      id: product.id,
      order: index,
    }));

    updateProductOrderMutation.mutate({ productOrders });
  };

  return (
    <>
      {/* Product Form Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <ProductFormModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => products.refetch()}
          />
        )}

        {isEditModalOpen && selectedProduct && (
          <ProductFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedProduct(undefined);
            }}
            initialData={selectedProduct}
            isEditing={true}
            onSuccess={() => products.refetch()}
          />
        )}

        {isStockModalOpen && selectedStockProduct && (
          <StockEditModal
            isOpen={isStockModalOpen}
            onClose={() => {
              setIsStockModalOpen(false);
              setSelectedStockProduct(undefined);
            }}
            product={selectedStockProduct}
            onSuccess={() => products.refetch()}
          />
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--color-admin-card)] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <FaBox />
            Products
          </h2>
          {userRole === "admin" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
            >
              <FaPlus size={14} />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {userRole === "admin" && (
          <div className="text-sm text-[var(--color-text-secondary)] mb-4">
            Drag and drop to reorder products
          </div>
        )}

        {products.isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : products.error ? (
          <div className="text-red-500 text-center py-8">
            Error loading products: {products.error.message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {userRole === "admin" && (
                    <th className="text-left py-4 px-2 text-[var(--foreground)] w-10">
                      Order
                    </th>
                  )}
                  <th className="text-left py-4 px-2 text-[var(--foreground)]">
                    ID
                  </th>
                  <th className="text-left py-4 px-2 text-[var(--foreground)]">
                    Name
                  </th>
                  <th className="text-left py-4 px-2 text-[var(--foreground)]">
                    Category
                  </th>
                  <th className="text-left py-4 px-2 text-[var(--foreground)]">
                    Price
                  </th>
                  <th className="text-left py-4 px-2 text-[var(--foreground)]">
                    Stock
                  </th>
                  <th className="text-right py-4 px-2 text-[var(--foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              {userRole === "admin" ? (
                <Reorder.Group
                  as="tbody"
                  axis="y"
                  values={orderedProducts}
                  onReorder={handleReorder}
                  className="relative"
                >
                  {!products.error &&
                    orderedProducts.map((product) => (
                      <Reorder.Item
                        key={product.id}
                        value={product}
                        as="tr"
                        dragListener={!isDragDisabled}
                        dragControls={undefined}
                        className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] relative"
                      >
                        <td className="py-4 px-2 text-[var(--color-text-secondary)] cursor-move">
                          <FaGripVertical className="text-[var(--color-text-secondary)]" />
                        </td>
                        <td className="py-4 px-2 text-[var(--color-text-secondary)]">
                          {product.id.substring(0, 8)}...
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          {product.name}
                        </td>
                        <td className="py-4 px-2 text-[var(--color-text-secondary)]">
                          {product.category}
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.stock.length > 10
                                ? "bg-success-bg text-success-text"
                                : product.stock.length > 0
                                  ? "bg-warning-bg text-warning-text"
                                  : "bg-error-bg text-error-text"
                            }`}
                          >
                            {product.stock.length}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push(`/shop/${product.slug}`)}
                              className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-500 hover:text-white transition-colors"
                              title="View Product"
                              onMouseEnter={() => setIsDragDisabled(true)}
                              onMouseLeave={() => setIsDragDisabled(false)}
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
                              title="Edit Product"
                              onMouseEnter={() => setIsDragDisabled(true)}
                              onMouseLeave={() => setIsDragDisabled(false)}
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-error-bg text-error-text rounded hover:bg-error transition-colors"
                              title="Delete Product"
                              onMouseEnter={() => setIsDragDisabled(true)}
                              onMouseLeave={() => setIsDragDisabled(false)}
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </Reorder.Item>
                    ))}
                </Reorder.Group>
              ) : (
                <tbody>
                  {!products.error &&
                    orderedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)]"
                      >
                        <td className="py-4 px-2 text-[var(--color-text-secondary)]">
                          {product.id.substring(0, 8)}...
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          {product.name}
                        </td>
                        <td className="py-4 px-2 text-[var(--color-text-secondary)]">
                          {product.category}
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-2 text-[var(--foreground)]">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.stock.length > 10
                                ? "bg-success-bg text-success-text"
                                : product.stock.length > 0
                                  ? "bg-warning-bg text-warning-text"
                                  : "bg-error-bg text-error-text"
                            }`}
                          >
                            {product.stock.length}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push(`/shop/${product.slug}`)}
                              className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-500 hover:text-white transition-colors"
                              title="View Product"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
                              title="Edit Stock"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
}
