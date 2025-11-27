import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
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
    Eye,
    Car,
    Map,
    Briefcase,
    Ticket,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Pagination from "@/Components/Pagination";

// --- HELPER COMPONENTS ---

const ServiceBadge = ({ type }) => {
    let label = "Service";
    let icon = Package;
    let className = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";

    if (type?.includes("CarRental")) {
        label = "Car Rental";
        icon = Car;
        className = "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
    } else if (type?.includes("TripPlanner")) {
        label = "Trip Planner";
        icon = Map;
        className = "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200";
    } else if (type?.includes("HolidayPackage")) {
        label = "Holiday Package";
        icon = Briefcase;
        className = "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
    } else if (type?.includes("Activity")) {
        label = "Activity";
        icon = Ticket;
        className = "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
    }

    const Icon = icon;

    return (
        <Badge variant="outline" className={`gap-1.5 py-1 ${className}`}>
            <Icon className="w-3 h-3" />
            {label}
        </Badge>
    );
};

const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

// Date & Time Formatter
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
        case "pending": return <Badge variant="outline">Pending</Badge>;
        case "paid":
        case "settlement": return <Badge className="bg-green-600 text-white hover:bg-green-700">Paid</Badge>;
        case "partially_paid": return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Partial</Badge>;
        case "refund": return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Refunded</Badge>;
        case "cancelled":
        case "expire":
        case "failure": return <Badge variant="destructive">{status}</Badge>;
        default: return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
};

// --- SORTABLE HEADER COMPONENT ---
const SortableHeader = ({ label, sortKey, currentSort, currentDirection, onSort }) => {
    const isActive = currentSort === sortKey;

    return (
        <TableHead
            className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                {isActive ? (
                    currentDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                ) : (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    );
};

export default function Index({ auth, orders, filters }) {
    const { flash } = usePage().props;

    // Sorting state initialized from server props
    const [sortConfig, setSortConfig] = useState({
        key: filters?.sort || 'created_at',
        direction: filters?.direction || 'desc'
    });

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    // Helper to calculate row number across pages
    const getRowNumber = (index) => (orders.from || 1) + index;

    const handleSort = (key) => {
        let direction = 'asc';

        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });

        router.get(route('admin.orders.index'), {
            sort: key,
            direction: direction
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // ✅ FIXED: Safe way to display the sort label
    const getSortLabel = (key) => {
        if (!key) return "";
        // Convert to string explicitly, then replace dots and underscores
        return String(key).replace(/[._]/g, ' ');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Orders Management
                </h2>
            }
        >
            <Head title="Orders" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Orders</CardTitle>
                            <CardDescription>
                                Manage and view customer orders. Sorted by <span className="font-medium capitalize">{getSortLabel(sortConfig.key)}</span> ({sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">No.</TableHead>

                                        <SortableHeader
                                            label="Order ID"
                                            sortKey="order_number"
                                            currentSort={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        />

                                        <TableHead>Service Type</TableHead>

                                        <SortableHeader
                                            label="Customer"
                                            sortKey="user.name"
                                            currentSort={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        />

                                        <SortableHeader
                                            label="Total Amount"
                                            sortKey="total_amount"
                                            currentSort={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        />

                                        <SortableHeader
                                            label="Status"
                                            sortKey="status"
                                            currentSort={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        />

                                        <SortableHeader
                                            label="Date & Time"
                                            sortKey="created_at"
                                            currentSort={sortConfig.key}
                                            currentDirection={sortConfig.direction}
                                            onSort={handleSort}
                                        />

                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.data.length > 0 ? (
                                        orders.data.map((order, index) => {
                                            const serviceType = order.order_items?.[0]?.orderable_type || "Unknown";

                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium text-muted-foreground">
                                                        {getRowNumber(index)}
                                                    </TableCell>

                                                    <TableCell className="font-medium text-xs text-muted-foreground">
                                                        #{order.order_number}
                                                    </TableCell>

                                                    <TableCell>
                                                        <ServiceBadge type={serviceType} />
                                                        <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                                                            {order.order_items?.[0]?.name}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="font-medium">{order.user?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {order.user?.email}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="font-bold">
                                                        {formatCurrency(order.total_amount)}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase text-muted-foreground">Order</span>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="whitespace-nowrap">
                                                        {formatDate(order.created_at)}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route("admin.orders.show", order.id)}>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="8" className="text-center h-24 text-muted-foreground">
                                                No orders found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Pagination className="mt-6" links={orders.links} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
