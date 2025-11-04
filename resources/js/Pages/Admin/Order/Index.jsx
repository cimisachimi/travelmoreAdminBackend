import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react"; // Added for flash messages
import Pagination from "@/Components/Pagination"; // Added for pagination

// Helper to format currency
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

// Helper to get a colored badge for status
const getStatusBadge = (status) => {
    switch (status) {
        case "pending":
            return <Badge variant="outline">Pending</Badge>;
        case "paid":
        case "settlement": // For transaction
            return <Badge className="bg-green-600 text-white">Paid</Badge>;
        case "partially_paid":
            return <Badge className="bg-yellow-500 text-white">Partial</Badge>;
        case "refund": // Added refund status
            return <Badge className="bg-blue-600 text-white">Refunded</Badge>;
        case "cancelled":
        case "expire": // For transaction
            return <Badge variant="destructive">{status}</Badge>;
        default:
            return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
};

export default function Index({ auth, orders }) {
    // Get flash messages for toast notifications
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            // Fixed: The header prop expects a JSX element
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Orders Management
                </h2>
            }
        >
            <Head title="Orders" />

            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>
                        A list of all orders from customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Items Ordered</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Order Status</TableHead>
                                <TableHead>Payment Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.data.length > 0 ? (
                                orders.data.map((order) => (
                                    <TableRow key={order.id}>
                                        {/* Customer Info */}
                                        <TableCell className="font-medium">
                                            <div>{order.user.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.user.email}
                                            </div>
                                        </TableCell>

                                        {/* Items Info */}
                                        <TableCell>
                                            {/* This will now work because of the controller fix */}
                                            <ul className="list-disc pl-4 text-sm">
                                                {order.order_items.map(
                                                    (item) => (
                                                        <li key={item.id}>
                                                            {item.quantity} x{" "}
                                                            {item.name}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </TableCell>

                                        {/* Total Amount */}
                                        <TableCell className="font-semibold">
                                            {formatCurrency(order.total_amount)}
                                        </TableCell>

                                        {/* Order Status */}
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>

                                        {/* Payment Status */}
                                        <TableCell>
                                            {getStatusBadge(
                                                order.transaction?.status
                                            )}
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell>
                                            {formatDate(order.created_at)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {/* View Button (Now functional) */}
                                                <Link
                                                    href={route(
                                                        "admin.orders.show",
                                                        order.id
                                                    )}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {/* Refund Button (NEW) */}
                                                {order.transaction?.status ===
                                                    "settlement" && (
                                                    <Link
                                                        href={route(
                                                            "admin.orders.refund",
                                                            order.id
                                                        )}
                                                        method="post"
                                                        as="button"
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                                                        onBefore={() =>
                                                            confirm(
                                                                "Are you sure you want to refund this transaction? This action cannot be undone."
                                                            )
                                                        }
                                                    >
                                                        Refund
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan="7"
                                        className="text-center"
                                    >
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {/* Added Pagination */}
                    <Pagination className="mt-6" links={orders.links} />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
