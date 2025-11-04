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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// --- Re-using the helper functions from Index.jsx ---

const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusBadge = (status) => {
    switch (status) {
        case "pending":
            return <Badge variant="outline">Pending</Badge>;
        case "paid":
        case "settlement":
            return <Badge className="bg-green-600 text-white">Paid</Badge>;
        case "partially_paid":
            return <Badge className="bg-yellow-500 text-white">Partial</Badge>;
        case "refund":
            return <Badge className="bg-blue-600 text-white">Refunded</Badge>;
        case "cancelled":
        case "expire":
            return <Badge variant="destructive">{status}</Badge>;
        default:
            return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
};
// --- End Helper Functions ---

export default function Show({ auth, order }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    // Find the 'settlement' transaction for the refund button
    const paidTransaction = order.transaction; // This is the 'settlement' one from the controller
    const isRefundable = paidTransaction && paidTransaction.status === "settlement";

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route("admin.orders.index")}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Order Details
                    </h2>
                </div>
            }
        >
            <Head title={`Order ${order.order_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>
                                        Order #{order.order_number}
                                    </CardTitle>
                                    <CardDescription>
                                        {`Placed on ${formatDate(
                                            order.created_at
                                        )}`}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(order.status)}
                            </CardHeader>
                            <CardContent>
                                <h3 className="font-semibold mb-2">
                                    Items Ordered
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead className="text-right">
                                                Price
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                    <div className="text-xs text-muted-foreground">
                                                        {`Booking: ${formatDate(
                                                            item.start_date
                                                        )} - ${formatDate(
                                                            item.end_date
                                                        )}`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        item.price
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Price Summary */}
                                <div className="mt-6 w-full max-w-sm ml-auto space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Subtotal
                                        </span>
                                        <span>
                                            {formatCurrency(order.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Discount
                                        </span>
                                        <span className="text-red-500">
                                            -
                                            {formatCurrency(
                                                order.discount_amount
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total</span>
                                        <span>
                                            {formatCurrency(order.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-medium">
                                    {order.user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {order.user.email}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.transaction ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Status
                                            </span>
                                            {getStatusBadge(
                                                order.transaction.status
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Method
                                            </span>
                                            <span className="font-medium capitalize">
                                                {order.transaction.payment_type.replace(
                                                    /_/g,
                                                    " "
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Amount
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    order.transaction.gross_amount
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Txn Code
                                            </span>
                                            <span className="font-medium">
                                                {
                                                    order.transaction
                                                        .transaction_code
                                                }
                                            </span>
                                        </div>

                                        {/* Refund Button */}
                                        {isRefundable && (
                                            <div className="border-t pt-4 mt-4">
                                                <Link
                                                    href={route(
                                                        "admin.orders.refund",
                                                        order.id
                                                    )}
                                                    method="post"
                                                    as="button"
                                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                                                    onBefore={() =>
                                                        confirm(
                                                            "Are you sure you want to refund this transaction? This action cannot be undone."
                                                        )
                                                    }
                                                >
                                                    Issue Refund
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No payment transaction found.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
