"use client";

import { useTRPC } from "@/server/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import {
  FaBox,
  FaUser,
  FaShoppingBag,
  FaFileInvoice,
  FaTrash,
  FaTimes,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaCopy,
  FaSync,
  FaExternalLinkAlt,
  FaStickyNote,
} from "react-icons/fa";
import { OrderStatus, PaymentType } from "@generated/browser";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  getStatusBadgeClass,
  formatDate,
  getPaymentDisplayName,
} from "@/utils/invoiceUtils";
import { PaymentMethodLogo } from "@/components/PaymentMethodLogo";
import { useAdminRole } from "@/contexts/AdminContext";

export default function InvoiceDetailPage({ id }: { id: string }) {
  const trpc = useTRPC();
  const { userRole } = useAdminRole();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    codes: string[];
    product: {
      name: string;
    };
  } | null>(null);
  const [pendingReplaceCode, setPendingReplaceCode] = useState<{
    itemId: string;
    codeIndex: number;
    oldCode: string;
  } | null>(null);
  const [countryInfo, setCountryInfo] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [newNote, setNewNote] = useState("");

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery(
    trpc.invoices.getById.queryOptions({
      orderId: id as string,
    }),
  );

  // Fetch country information based on IP address
  useEffect(() => {
    if (invoice?.customer?.ipAddress) {
      // Check if IP is localhost/private
      const ip = invoice.customer.ipAddress;
      if (
        ip === "127.0.0.1" ||
        ip === "localhost" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.16.")
      ) {
        setCountryInfo({ code: "UNAVAIL", name: "Unavailable (Local IP)" });
        return;
      }

      fetch(`https://ipapi.co/${invoice.customer.ipAddress}/json/`)
        .then((response) => response.json())
        .then((data) => {
          if (data.country_code && data.country_name) {
            setCountryInfo({
              code: data.country_code,
              name: data.country_name,
            });
          } else {
            // If the API returns data but no country info
            setCountryInfo({ code: "UNAVAIL", name: "Unavailable" });
          }
        })
        .catch((err) => {
          console.error("Error fetching country info:", err);
          setCountryInfo({ code: "UNAVAIL", name: "Unavailable" });
        });
    } else {
      // No IP address provided
      setCountryInfo({ code: "UNAVAIL", name: "Unavailable (No IP)" });
    }
  }, [invoice?.customer?.ipAddress]);

  const { mutate: manuallyProcessInvoice, isPending: isManuallyProcessing } =
    useMutation(
      trpc.checkout.manuallyProcessInvoice.mutationOptions({
        onSuccess: () => {
          toast.success("Invoice manually processed");
        },
        onError: () => {
          toast.error("Failed to manually process invoice");
        },
      }),
    );

  const { mutate: cancelInvoice, isPending: isCancelling } = useMutation(
    trpc.checkout.cancelInvoice.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice cancelled");
      },
      onError: () => {
        toast.error("Failed to cancel invoice");
      },
    }),
  );

  const { mutate: deleteInvoice, isPending: isDeleting } = useMutation(
    trpc.invoices.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice permanently deleted");
        // Redirect to invoices list after deletion
        window.location.href = "/admin?tab=invoices";
      },
      onError: () => {
        toast.error("Failed to delete invoice");
      },
    }),
  );

  const { mutate: replaceCode, isPending: isReplacingCode } = useMutation(
    trpc.checkout.replaceCode.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Code replaced: ${data.oldCode} → ${data.newCode}`);
        // Refresh the invoice data
        window.location.reload();
      },
      onError: () => {
        toast.error("Failed to replace code");
      },
    }),
  );

  const { mutate: addNote, isPending: isAddingNote } = useMutation(
    trpc.invoices.addNote.mutationOptions({
      onSuccess: () => {
        toast.success("Note added successfully");
        setNewNote("");
        window.location.reload();
      },
      onError: () => {
        toast.error("Failed to add note");
      },
    }),
  );

  const { mutate: deleteNote, isPending: isDeletingNote } = useMutation(
    trpc.invoices.deleteNote.mutationOptions({
      onSuccess: () => {
        toast.success("Note deleted successfully");
        window.location.reload();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete note");
      },
    }),
  );

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    addNote({
      orderId: id,
      note: newNote.trim(),
    });
  };

  const handleDeleteNote = (noteIndex: number) => {
    if (userRole !== "admin") {
      toast.error("Only admin users can delete notes");
      return;
    }
    deleteNote({
      orderId: id,
      noteIndex,
    });
  };

  const handleReplaceCode = async (
    itemId: string,
    codeIndex: number,
    oldCode: string,
  ) => {
    // Check if this is the same code that's pending confirmation
    if (
      pendingReplaceCode &&
      pendingReplaceCode.itemId === itemId &&
      pendingReplaceCode.codeIndex === codeIndex &&
      pendingReplaceCode.oldCode === oldCode
    ) {
      // This is the second click, perform the actual replacement
      replaceCode({
        itemId,
        codeIndex,
      });
      // Reset the pending state
      setPendingReplaceCode(null);
    } else {
      // First click, set as pending and wait for confirmation
      setPendingReplaceCode({
        itemId,
        codeIndex,
        oldCode,
      });

      // Automatically clear the pending state after 5 seconds
      setTimeout(() => {
        setPendingReplaceCode((current) => {
          // Only clear if it's still the same pending replacement
          if (
            current &&
            current.itemId === itemId &&
            current.codeIndex === codeIndex &&
            current.oldCode === oldCode
          ) {
            return null;
          }
          return current;
        });
      }, 5000);
    }
  };

  const handleManuallyProcessInvoice = () => {
    setShowConfirmModal(true);
  };

  const confirmProcessInvoice = () => {
    setShowConfirmModal(false);
    manuallyProcessInvoice({
      orderId: id as string,
    });
  };

  const handleCancelInvoice = () => {
    cancelInvoice({
      orderId: id as string,
    });
  };

  const handleDeleteInvoice = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteInvoice = () => {
    setShowDeleteModal(false);
    deleteInvoice({
      orderId: id as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-error-bg text-error-text p-4 rounded-lg">
        <h3 className="font-bold">Error loading invoice</h3>
        <p>{error?.message || "Invoice not found"}</p>
        <Link
          href="/admin?tab=invoices"
          className="text-info underline mt-2 inline-block"
        >
          Return to invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Invoice Details</h1>
          <p className="text-text-muted text-sm">
            View the details of the invoice.
          </p>
        </div>
        <div className="flex gap-2">
          {(invoice.status === OrderStatus.PENDING ||
            invoice.status === OrderStatus.CANCELLED) && (
            <button
              className="px-4 py-2 flex items-center gap-2 bg-transparent border border-gray-700 rounded-md hover:bg-admin-hover transition-colors"
              onClick={handleManuallyProcessInvoice}
            >
              <FaFileInvoice />{" "}
              {isManuallyProcessing
                ? "Processing..."
                : "Manually Process Invoice"}
            </button>
          )}
          {invoice.status == OrderStatus.PENDING && (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 flex items-center gap-2 bg-transparent border border-gray-700 rounded-md hover:bg-admin-hover transition-colors"
                onClick={handleCancelInvoice}
              >
                <FaTimesCircle />{" "}
                {isCancelling ? "Cancelling..." : "Cancel Invoice"}
              </button>
            </div>
          )}
          <Link
            href={`/order/${invoice.id}`}
            className="px-4 py-2 flex items-center gap-2 bg-transparent border border-info text-info rounded-md hover:bg-info hover:text-white transition-colors"
          >
            <FaEye /> View Invoice
          </Link>
          {userRole === "admin" && (
            <button
              className="px-4 py-2 flex items-center gap-2 bg-transparent border border-error text-error rounded-md hover:bg-error hover:text-white transition-colors"
              onClick={handleDeleteInvoice}
            >
              <FaTrash /> {isDeleting ? "Deleting..." : "Delete Invoice"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information Card */}
        <div className="bg-admin-card rounded-lg shadow text-foreground p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaShoppingBag className="text-text-muted" />
            <h2 className="font-semibold">Order Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">ID</span>
              <span>{invoice.id}</span>
            </div>
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}
              >
                {invoice.status === "PAID" ? "COMPLETED" : invoice.status}
              </span>
            </div>
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Payment Method</span>
              <div className="flex items-center gap-2">
                <span>{getPaymentDisplayName(invoice)}</span>
                <PaymentMethodLogo
                  paymentType={invoice.paymentType}
                  cryptoType={invoice.Wallet?.[0]?.chain}
                  size="md"
                />
              </div>
            </div>{" "}
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Subtotal</span>
              <span>
                $
                {(
                  invoice.totalPrice -
                  (invoice.couponDetails?.type === "PERCENTAGE"
                    ? (invoice.totalPrice * invoice.couponDetails.discount) /
                      100
                    : invoice.couponDetails?.discount || 0)
                ).toFixed(2) || "N/A"}
                {invoice.couponDetails && (
                  <span className="text-success ml-2">
                    (
                    {invoice.couponDetails.type === "PERCENTAGE"
                      ? `-${invoice.couponDetails.discount}%`
                      : `-$${invoice.couponDetails.discount.toFixed(2)}`}
                    )
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Gateway Fee</span>
              <span>
                ${invoice.paymentFee ? invoice.paymentFee.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Total Price</span>
              <span>
                $
                {(
                  invoice.totalPrice -
                  (invoice.couponDetails?.type === "PERCENTAGE"
                    ? (invoice.totalPrice * invoice.couponDetails.discount) /
                      100
                    : invoice.couponDetails?.discount || 0) +
                  invoice.paymentFee
                ).toFixed(2)}
              </span>
            </div>
            {invoice.couponUsed && (
              <div className="flex justify-between border-b border-admin-card-border pb-2">
                <span className="text-text-secondary">Coupon</span>
                <span>
                  {invoice.couponUsed}
                  {invoice.couponDetails && (
                    <span className="text-success ml-2">
                      (
                      {invoice.couponDetails.type === "PERCENTAGE"
                        ? `${invoice.couponDetails.discount}% OFF`
                        : `$${invoice.couponDetails.discount.toFixed(2)} off`}
                      )
                    </span>
                  )}
                </span>
              </div>
            )}
            {invoice.paymentType === PaymentType.CRYPTO && (
              <div className="flex justify-between border-b border-admin-card-border pb-2">
                <span className="text-text-secondary">Transaction ID</span>
                <span>{invoice.Wallet?.[0]?.txHash || "N/A"}</span>
              </div>
            )}
            {invoice.paymentType === PaymentType.PAYPAL && (
              <div className="flex justify-between border-b border-admin-card-border pb-2">
                <span className="text-text-secondary">Paypal Note</span>
                <span>{invoice.paypalNote || "N/A"}</span>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <span className="text-text-secondary">Created At</span>
              <span>{formatDate(invoice.createdAt, "long")}</span>
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="bg-admin-card rounded-lg shadow text-foreground p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaUser className="text-text-muted" />
            <h2 className="font-semibold">Customer Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">E-mail Address</span>
              <span>{invoice.customer?.email || "N/A"}</span>
            </div>

            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">IP Address</span>
              <span>{invoice.customer?.ipAddress || "N/A"}</span>
            </div>

            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Country</span>
              <div className="flex items-center gap-2">
                {countryInfo ? (
                  <>
                    <span>{countryInfo.name}</span>
                    {countryInfo.code !== "UNAVAIL" && (
                      <Image
                        src={`https://flagsapi.com/${countryInfo.code}/flat/64.png`}
                        alt={countryInfo.code}
                        className="w-6 h-4"
                        width={64}
                        height={64}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-text-muted">Unavailable</span>
                )}
              </div>
            </div>

            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">User Agent</span>
              <span className="text-sm truncate max-w-[300px]">
                {invoice.customer?.useragent || "N/A"}
              </span>
            </div>

            <div className="flex justify-between border-b border-admin-card-border pb-2">
              <span className="text-text-secondary">Discord Username</span>
              <span>{invoice.customer?.discord || "Not provided"}</span>
            </div>

            {invoice.customer?.affiliate && (
              <div className="flex justify-between pb-2">
                <span className="text-text-secondary">Affiliate</span>
                <span className="px-2 py-1 bg-info-bg text-info-text rounded-full text-xs font-medium">
                  {invoice.customer.affiliate.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mt-6 bg-admin-card rounded-lg shadow text-foreground p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaBox className="text-text-muted" />
          <h2 className="font-semibold">Items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-admin-card-border">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">
                  Product & Variant
                </th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">
                  Quantity
                </th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">
                  Total Price
                </th>
                <th className="text-left py-3 px-4 font-medium text-text-secondary">
                  Deliverable
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.OrderItem.map((item) => (
                <tr className="border-b border-gray-100" key={item.id}>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}
                    >
                      {invoice.status === OrderStatus.PAID
                        ? "COMPLETED"
                        : invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-text-muted">
                        {item.product.slug}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{item.quantity}</td>
                  <td className="py-3 px-4">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {item.codes && item.codes.length > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowCodeModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-info text-white text-xs rounded-md hover:bg-info-text transition-colors"
                      >
                        <FaExternalLinkAlt size={12} />
                        View
                      </button>
                    ) : (
                      <span className="text-text-muted text-xs px-3 py-1 bg-gray-200 rounded-md">
                        None
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Notes Section */}
      <div className="mt-6 bg-admin-card rounded-lg shadow text-foreground p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaStickyNote className="text-text-muted" />
          <h2 className="font-semibold">Notes</h2>
        </div>

        {/* Add Note Form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border border-admin-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAddingNote) {
                handleAddNote();
              }
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={isAddingNote || !newNote.trim()}
            className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingNote ? "Adding..." : "Add Note"}
          </button>
        </div>

        {/* Existing Notes */}
        {invoice.notes && invoice.notes.length > 0 ? (
          <div className="space-y-2">
            {invoice.notes.map((note: string, index: number) => (
              <div
                key={index}
                className="bg-surface-muted rounded-lg p-3 border border-admin-card-border flex justify-between items-start gap-3"
              >
                <p className="text-sm font-mono text-gray-700 flex-1">{note}</p>
                {userRole === "admin" && (
                  <button
                    onClick={() => handleDeleteNote(index)}
                    disabled={isDeletingNote}
                    className="p-1.5 text-error hover:bg-error-bg rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete note"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No notes yet.</p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--background)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-bg rounded-full">
                  <FaExclamationTriangle
                    className="text-warning"
                    size={20}
                  />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Confirm Manual Processing
                </h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
              >
                <FaTimes size={16} className="text-[var(--foreground)]" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-[var(--foreground)] mb-4">
                Are you sure you want to manually process this invoice?
              </p>

              <div className="bg-[color-mix(in_srgb,var(--background),#333_10%)] rounded-lg p-4 mb-4">
                <p className="text-sm text-[var(--foreground)] font-medium mb-2">
                  This action will:
                </p>
                <ul className="text-sm text-[var(--foreground)] space-y-1">
                  <li>• Allocate product codes to the order</li>
                  <li>• Mark the order as paid</li>
                  <li>• Send the completion email to the customer</li>
                </ul>
              </div>

              <p className="text-sm text-error-light font-medium">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-admin-card-border text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmProcessInvoice}
                disabled={isManuallyProcessing}
                className="px-4 py-2 rounded-lg bg-info text-white hover:bg-info-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isManuallyProcessing ? "Processing..." : "Confirm Processing"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--background)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error-bg rounded-full">
                  <FaTrash className="text-error" size={20} />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Delete Invoice
                </h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
              >
                <FaTimes size={16} className="text-[var(--foreground)]" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-[var(--foreground)] mb-4">
                Are you sure you want to permanently delete this invoice?
              </p>

              <div className="bg-[color-mix(in_srgb,var(--background),#333_10%)] rounded-lg p-4 mb-4">
                <p className="text-sm text-[var(--foreground)] font-medium mb-2">
                  This action will:
                </p>
                <ul className="text-sm text-[var(--foreground)] space-y-1">
                  <li>
                    • Permanently delete the invoice #
                    {invoice.id.substring(0, 8)}
                  </li>
                  <li>• Remove all associated order items</li>
                  <li>• Remove all invoice data from the system</li>
                </ul>
              </div>

              <p className="text-sm text-error-light font-medium">
                ⚠️ THIS ACTION CANNOT BE UNDONE. The invoice will be permanently
                lost.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-admin-card-border text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInvoice}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-error text-white hover:bg-error-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Code Modal */}
      {showCodeModal && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--background)] rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info-bg rounded-full">
                  <FaEye className="text-info" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Product Codes
                  </h2>
                  <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                    {selectedItem.product.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setPendingReplaceCode(null);
                }}
                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
              >
                <FaTimes size={16} className="text-[var(--foreground)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-2">
                {selectedItem.codes &&
                  selectedItem.codes.map((code: string, index: number) => (
                    <div
                      key={index}
                      className="bg-[color-mix(in_srgb,var(--background),#333_15%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="bg-[color-mix(in_srgb,var(--background),#333_25%)] rounded-md border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] px-3 py-2 flex-1">
                          <p className="text-sm font-mono text-[var(--foreground)] break-all select-all">
                            {code}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              toast.success("Code copied to clipboard!");
                            }}
                            className="px-3 py-2 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <FaCopy size={12} />
                            Copy
                          </button>
                          <button
                            onClick={() =>
                              handleReplaceCode(selectedItem.id, index, code)
                            }
                            disabled={isReplacingCode}
                            className={`px-3 py-2 text-white text-xs rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 
                            ${
                              pendingReplaceCode &&
                              pendingReplaceCode.itemId === selectedItem.id &&
                              pendingReplaceCode.codeIndex === index &&
                              pendingReplaceCode.oldCode === code
                                ? "bg-error hover:bg-error-text"
                                : "bg-info hover:bg-info-text"
                            }`}
                          >
                            <FaSync
                              className={`${isReplacingCode ? "animate-spin" : ""}`}
                              size={12}
                            />
                            {isReplacingCode
                              ? "Replacing..."
                              : pendingReplaceCode &&
                                  pendingReplaceCode.itemId ===
                                    selectedItem.id &&
                                  pendingReplaceCode.codeIndex === index &&
                                  pendingReplaceCode.oldCode === code
                                ? "Confirm replace"
                                : "Replace"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
              <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                Status:{" "}
                {invoice.status === OrderStatus.DELIVERED
                  ? "Delivered"
                  : "Not Delivered"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
