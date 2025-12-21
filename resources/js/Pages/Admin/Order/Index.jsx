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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Eye,
    Car,
    Map,
    Briefcase,
    Ticket,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Compass,
    Copy,
    Clock,
    Wallet,
    TrendingUp,
    FilterX,
    CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
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
    } else if (type?.includes("OpenTrip")) {
        label = "Open Trip";
        icon = Compass;
        className = "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200";
    }

    const Icon = icon;

    return (
        <Badge variant="outline" className={`gap-1.5 py-1 font-medium ${className}`}>
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

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        paid: "bg-green-100 text-green-800 border-green-200",
        settlement: "bg-green-100 text-green-800 border-green-200",
        partially_paid: "bg-orange-100 text-orange-800 border-orange-200",
        refund: "bg-blue-100 text-blue-800 border-blue-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
        expire: "bg-gray-100 text-gray-800 border-gray-200",
        failure: "bg-red-100 text-red-800 border-red-200",
    };

    let label = status;
    if (status === 'settlement') label = 'Paid';
    if (status === 'partially_paid') label = 'Partially Paid';

    return <Badge variant="outline" className={`${styles[status] || "bg-gray-100"} capitalize px-2.5 py-0.5`}>{label || "N/A"}</Badge>;
};

const SortableHeader = ({ label, sortKey, currentSort, currentDirection, onSort }) => {
    const isActive = currentSort === sortKey;
    return (
        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => onSort(sortKey)}>
            <div className="flex items-center gap-2">
                {label}
                {isActive ? (currentDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />}
            </div>
        </TableHead>
    );
};

// --- MAIN COMPONENT ---

export default function Index({ auth, orders, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [serviceFilter, setServiceFilter] = useState(filters.service || "all");
    const [dateFilter, setDateFilter] = useState(filters.date_filter || "all");
    const [sortConfig, setSortConfig] = useState({
        key: filters?.sort || 'created_at',
        direction: filters?.direction || 'desc'
    });

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    // Calculate Summary Stats from current view
    const stats = useMemo(() => {
        const totalRevenue = orders.data.reduce((acc, order) => {
            return acc + (['paid', 'settlement', 'partially_paid'].includes(order.status) ? Number(order.transaction?.gross_amount || 0) : 0);
        }, 0);
        const pendingCount = orders.data.filter(o => o.status === 'pending').length;
        return { totalRevenue, pendingCount, totalOrders: orders.total };
    }, [orders]);

    const applyFilters = (newFilters) => {
        const params = {
            search,
            service: serviceFilter,
            date_filter: dateFilter,
            sort: sortConfig.key,
            direction: sortConfig.direction,
            ...newFilters
        };

        if (params.service === 'all') delete params.service;
        if (params.date_filter === 'all') delete params.date_filter;
        if (!params.search) delete params.search;

        router.get(route('admin.orders.index'), params, {
            preserveState: true,
            replace: true
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleServiceChange = (value) => {
        setServiceFilter(value);
        applyFilters({ service: value });
    };

    const handleDateChange = (value) => {
        setDateFilter(value);
        applyFilters({ date_filter: value });
    };

    const handleSort = (key) => {
        let direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        applyFilters({ sort: key, direction });
    };

    const resetFilters = () => {
        setSearch("");
        setServiceFilter("all");
        setDateFilter("all");
        router.get(route('admin.orders.index'));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Order ID copied to clipboard");
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200">Orders Management</h2>}>
            <Head title="Orders" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

                {/* 1. Dashboard Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div><p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Bookings</p><p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p></div>
                                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div><p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Revenue (Paid)</p><p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalRevenue)}</p></div>
                                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><Wallet className="w-5 h-5" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center">
                                <div><p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Orders</p><p className="text-2xl font-bold text-amber-900">{stats.pendingCount}</p></div>
                                <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Orders Table with Multi-Filter Header */}
                <Card>
                    <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b">
                        <div className="flex-1">
                            <CardTitle>Booking Records</CardTitle>
                            <CardDescription>Comprehensive list of all customer transactions and reservations.</CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* DATE RANGE FILTER */}
                            <Select value={dateFilter} onValueChange={handleDateChange}>
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="last_week">Last 7 Days</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* SERVICE TYPE FILTER */}
                            <Select value={serviceFilter} onValueChange={handleServiceChange}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="All Services" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    <SelectItem value="Activity">Activities</SelectItem>
                                    <SelectItem value="CarRental">Car Rental</SelectItem>
                                    <SelectItem value="HolidayPackage">Holiday Packages</SelectItem>
                                    <SelectItem value="OpenTrip">Open Trips</SelectItem>
                                    <SelectItem value="TripPlanner">Trip Planner</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* SEARCH BOX */}
                            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search Customer or ID..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
                            </form>

                            {/* RESET BUTTON */}
                            {(search || serviceFilter !== 'all' || dateFilter !== 'all') && (
                                <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground hover:text-red-600 h-10 px-3">
                                    <FilterX className="w-4 h-4 mr-2" /> Reset
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <SortableHeader label="Order ID" sortKey="order_number" currentSort={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} />
                                    <TableHead>Type & Product</TableHead>
                                    <SortableHeader label="Customer" sortKey="user.name" currentSort={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} />
                                    <SortableHeader label="Total Amount" sortKey="total_amount" currentSort={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} />
                                    <SortableHeader label="Status" sortKey="status" currentSort={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} />
                                    <SortableHeader label="Date" sortKey="created_at" currentSort={sortConfig.key} currentDirection={sortConfig.direction} onSort={handleSort} />
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length > 0 ? (
                                    orders.data.map((order, index) => {
                                        const serviceType = order.order_items?.[0]?.orderable_type || "Unknown";
                                        const itemName = order.order_items?.[0]?.orderable?.name || order.order_items?.[0]?.name || "Item Details";

                                        const transactionAmount = Number(order.transaction?.gross_amount) || 0;
                                        const totalAmount = Number(order.total_amount) || 0;
                                        const isSettled = ['settlement', 'capture', 'paid'].includes(order.status) || order.transaction?.status === 'settlement';
                                        const isDownPayment = isSettled && transactionAmount > 0 && transactionAmount < totalAmount;
                                        const displayStatus = isDownPayment ? 'partially_paid' : order.status;

                                        return (
                                            <TableRow key={order.id} className="group transition-colors hover:bg-slate-50/50">
                                                <TableCell className="text-muted-foreground text-xs">{(orders.from || 1) + index}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[11px] text-muted-foreground">#{order.order_number}</span>
                                                        <button onClick={() => copyToClipboard(order.order_number)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"><Copy className="w-3 h-3 text-slate-400" /></button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <ServiceBadge type={serviceType} />
                                                    <div className="text-xs font-bold text-gray-700 mt-1 truncate max-w-[180px]">{itemName}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm text-gray-900">{order.user?.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{order.user?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-sm">{formatCurrency(totalAmount)}</div>
                                                    {isDownPayment && <div className="text-[9px] text-orange-600 font-extrabold uppercase mt-0.5">DP: {formatCurrency(transactionAmount)}</div>}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(displayStatus)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={route("admin.orders.show", order.id)}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"><Eye className="h-4 w-4" /></Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan="8" className="text-center h-32 text-muted-foreground italic">No booking records found matching your current filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <Pagination className="mt-6" links={orders.links} />
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
