import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/Components/ui/dropdown-menu";
import { Eye, CheckCircle, XCircle, FileText, MoreHorizontal, ArrowRight } from "lucide-react";
import Pagination from "@/Components/Pagination";
import { toast } from "sonner";

// --- Helper Components ---

const StatusBadge = ({ status }) => {
    switch (status) {
        case "pending":
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
        case "approved":
            return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
        case "rejected":
            return <Badge variant="destructive">Rejected</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
};

export default function RefundIndex({ auth, refunds }) {
    const [processingId, setProcessingId] = useState(null);

    const handleAction = (refundId, newStatus) => {
        if (confirm(`Are you sure you want to ${newStatus} this request?`)) {
            setProcessingId(refundId);
            router.put(route('admin.refunds.update', refundId), {
                status: newStatus
            }, {
                onSuccess: () => {
                    toast.success(`Refund request ${newStatus} successfully.`);
                    setProcessingId(null);
                },
                onError: () => {
                    toast.error("Failed to update status.");
                    setProcessingId(null);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Refund Management</h2>}
        >
            <Head title="Refunds" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Refund Requests</CardTitle>
                            <CardDescription>
                                Review and process refund requests submitted by users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Order Context</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {refunds.data.length > 0 ? (
                                        refunds.data.map((refund) => (
                                            <TableRow key={refund.id}>
                                                <TableCell className="font-medium">#{refund.id}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(refund.created_at).toLocaleDateString()}
                                                    <br />
                                                    {new Date(refund.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{refund.user?.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{refund.user?.email}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {refund.order ? (
                                                        <Link
                                                            href={route('admin.orders.show', refund.order.id)}
                                                            className="group flex flex-col gap-1 p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                                                        >
                                                            <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:underline">
                                                                #{refund.order.order_number} <ArrowRight className="w-3 h-3" />
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Amount: {formatCurrency(refund.order.total_amount)}
                                                            </div>
                                                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                                                Current: {refund.order.status}
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-sm">Order Deleted</span>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-foreground">
                                                                <FileText className="h-3 w-3" />
                                                                Read Reason
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Refund Request Details</DialogTitle>
                                                                <DialogDescription>
                                                                    Submitted by <strong>{refund.user?.name}</strong> on {new Date(refund.created_at).toLocaleDateString()}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="mt-4 space-y-2">
                                                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Reason Given:</p>
                                                                <div className="p-4 bg-muted/50 rounded-md text-sm leading-relaxed whitespace-pre-wrap text-foreground border">
                                                                    {refund.reason}
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => document.querySelector('[data-state="open"]').click()}>Close</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>

                                                <TableCell>
                                                    <StatusBadge status={refund.status} />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {refund.status === 'pending' ? (
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                                onClick={() => handleAction(refund.id, 'approved')}
                                                                disabled={processingId === refund.id}
                                                                title="Approve Refund"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => handleAction(refund.id, 'rejected')}
                                                                disabled={processingId === refund.id}
                                                                title="Reject Refund"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Processed</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="7" className="text-center h-32 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="w-8 h-8 opacity-20" />
                                                    No refund requests found.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="mt-4">
                                <Pagination links={refunds.links} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
