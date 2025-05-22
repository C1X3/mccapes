import InvoiceDetailPage from "@/components/admin/InvoiceDetailPage";
import AdminWrapper from "@/components/AdminWrapper";
import { prefetch, trpc } from "@/server/server";

export default async function InvoiceDetailView({ params }: { params: Promise<{ id: string }>}) {
    const id = (await params).id;

    prefetch(trpc.invoices.getById.queryOptions({ orderId: id }));

    return (
        <AdminWrapper currentTab="invoices">
            <InvoiceDetailPage id={id} />
        </AdminWrapper>
    );
} 