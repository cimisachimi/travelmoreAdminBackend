import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table'; // ✅ Imported Table Components
import {
    Users,
    CreditCard,
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Truck,
    AlertCircle,
    PenTool,
    Send,
    RotateCcw,
    CheckCircle,
    Clock,
    MapPin,
    Eye,
    Receipt
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function Dashboard({ auth, stats, charts, recent_orders, delivery_orders, active_planners, filters }) {

    const currentRange = filters?.range || 'month';

    const onRangeChange = (value) => {
        router.get(route('admin.dashboard'), { range: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getRangeLabel = (range) => {
        switch(range) {
            case 'today': return 'yesterday';
            case 'week': return 'last week';
            case 'year': return 'last year';
            default: return 'last month';
        }
    }

    const formatCurrency = (amount) => {
        const value = Number(amount) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#8b5cf6'];

    const GrowthIndicator = ({ value }) => {
        const numValue = Number(value) || 0;
        const isPositive = numValue >= 0;
        return (
            <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(numValue)}% from {getRangeLabel(currentRange)}
            </div>
        );
    };

    const safeStats = stats || {};
    const safeCharts = charts || { revenue: [], categories: [] };
    const safeOrders = recent_orders || [];
    const safeDeliveryOrders = delivery_orders || [];
    const safePlanners = active_planners || [];

    // --- Badge Helpers ---
    const getOrderStatusBadge = (status) => {
        switch(status) {
            case 'paid': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Paid</Badge>;
            case 'settlement': return <Badge className="bg-emerald-600 hover:bg-emerald-700">Settled</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
            case 'cancelled':
            case 'expire':
            case 'deny': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
        }
    };

    const getPlannerStatusBadge = (status) => {
        const s = status ? status.toLowerCase() : 'pending';
        switch (s) {
            case 'completed': return <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1"><CheckCircle size={10}/> Done</Badge>;
            case 'drafting': return <Badge className="bg-blue-600 hover:bg-blue-700 gap-1"><PenTool size={10}/> Crafting</Badge>;
            case 'sent_to_client': return <Badge className="bg-purple-600 hover:bg-purple-700 gap-1"><Send size={10}/> Sent</Badge>;
            case 'revision': return <Badge className="bg-orange-500 hover:bg-orange-600 gap-1"><RotateCcw size={10}/> Revision</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary" className="text-gray-500 gap-1"><Clock size={10}/> Pending</Badge>;
        }
    };

    // --- ✅ NEW: Advanced Table Component ---
    const OrderTable = ({ orders, emptyMessage }) => {
        if (orders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-md bg-slate-50">
                    <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Order</TableHead>
                            <TableHead className="w-[200px]">Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="group hover:bg-slate-50/50">
                                {/* Order ID */}
                                <TableCell className="font-medium text-xs text-muted-foreground">
                                    #{order.order_number}
                                </TableCell>

                                {/* Customer */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                            {order.customer_initials}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium leading-none text-gray-900">{order.customer}</p>
                                            <p className="text-xs text-muted-foreground">{order.date_relative}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Service & Payment */}
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium capitalize truncate max-w-[150px]">{order.service}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CreditCard size={10} /> {order.payment_method}
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell>
                                    {getOrderStatusBadge(order.status)}
                                </TableCell>

                                {/* Amount */}
                                <TableCell className="text-right font-bold text-gray-900">
                                    {formatCurrency(order.amount)}
                                </TableCell>

                                {/* Action */}
                                <TableCell>
                                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={route('admin.orders.show', order.id)}>
                                            <Eye className="h-4 w-4 text-blue-600" />
                                            <span className="sr-only">View</span>
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Overview">
            <Head title="Dashboard" />

            <div className="py-6 space-y-6">

                {/* HEADER & FILTERS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard Stats</h2>
                    <div className="w-[180px]">
                        <Select defaultValue={currentRange} onValueChange={onRangeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="month">Last 30 Days</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 1. KEY METRICS ROW */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(safeStats.total_revenue)}</div>
                            <GrowthIndicator value={safeStats.revenue_growth} />
                        </CardContent>
                    </Card>

                    {/* Orders */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStats.total_orders || 0}</div>
                            <p className="text-xs text-muted-foreground capitalize">In selected period</p>
                        </CardContent>
                    </Card>

                    {/* Clients */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStats.total_clients || 0}</div>
                            <p className="text-xs text-muted-foreground">+{safeStats.new_clients || 0} new in period</p>
                        </CardContent>
                    </Card>

                    {/* Action Items */}
                    <Link href={route('admin.orders.index')}>
                        <Card className="border-l-4 border-l-orange-500 hover:bg-slate-50 transition-colors cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Action Required</CardTitle>
                                <Activity className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-muted-foreground">Needs Delivery</span>
                                    <span className="font-bold text-orange-600">{safeStats.needs_delivery || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Pending Refunds</span>
                                    <span className="font-bold text-red-600">{safeStats.pending_refunds || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid gap-4 md:grid-cols-7">
                    {/* Revenue Bar Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription className="capitalize">Breakdown for {currentRange === 'month' ? 'last 30 days' : currentRange}</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                {safeCharts.revenue && safeCharts.revenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={safeCharts.revenue}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`} />
                                            <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No revenue data available</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Pie Chart */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                            <CardDescription>Distribution in selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {safeCharts.categories && safeCharts.categories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={safeCharts.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {safeCharts.categories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No sales in this period</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. ORDER & TRIP ACTIVITY SECTION (TABS) */}
                <Tabs defaultValue="recent" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="recent">Recent Orders</TabsTrigger>
                            <TabsTrigger value="delivery" className="relative">
                                Needs Delivery
                                {safeDeliveryOrders.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white"></span>}
                            </TabsTrigger>
                            <TabsTrigger value="planning" className="relative">
                                Trip Planning
                                {safePlanners.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border border-white"></span>}
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.planners.index')}>All Trips</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.orders.index')}>All Orders</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Tab: Recent Orders */}
                    <TabsContent value="recent">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle>Recent Orders</CardTitle>
                                <CardDescription>Latest transactions from your customers.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <OrderTable orders={safeOrders} emptyMessage="No recent orders found." />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Needs Delivery */}
                    <TabsContent value="delivery">
                        <Card className="border-orange-200 bg-orange-50/10 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-orange-600" />
                                    <CardTitle>Pending Delivery</CardTitle>
                                </div>
                                <CardDescription>Orders that have been paid but not yet completed.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <OrderTable orders={safeDeliveryOrders} emptyMessage="No orders currently need delivery. Good job!" />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Trip Planning */}
                    <TabsContent value="planning">
                        <Card className="border-blue-200 bg-blue-50/10 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <PenTool className="h-5 w-5 text-blue-600" />
                                    <CardTitle>Active Trip Requests</CardTitle>
                                </div>
                                <CardDescription>Custom trip plans currently being worked on.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 px-6 pb-6">
                                    {safePlanners.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                            <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">No active trips. All caught up!</p>
                                        </div>
                                    ) : (
                                        safePlanners.map((planner) => (
                                            <Link
                                                href={route('admin.planners.edit', planner.id)}
                                                key={planner.id}
                                                className="block group cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between border-b border-blue-100 pb-4 group-hover:bg-white transition-colors p-3 rounded-md -mx-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full transition-colors ${planner.is_paid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            {planner.is_paid ? <DollarSign className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium leading-none group-hover:text-blue-600 transition-colors">
                                                                {planner.customer}
                                                            </p>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <MapPin size={10} /> {planner.destination}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            {getPlannerStatusBadge(planner.status)}
                                                            <p className="text-xs text-muted-foreground mt-1">{planner.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
