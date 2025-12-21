import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
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
    Receipt,
    Car,
    Map,
    Briefcase,
    Ticket,
    ChevronRight,
    Calendar
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
import { useEffect } from 'react'; // Ensure this is imported

export default function Dashboard({ auth, stats, charts, upcoming_schedule, recent_orders, delivery_orders, active_planners, filters }) {
    // ✅ ADD THIS HOOK:
    useEffect(() => {
        // Refresh data every 30 seconds
        const interval = setInterval(() => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
                only: ['stats', 'upcoming_schedule', 'recent_orders', 'delivery_orders']
            });
        }, 30000); // 30000ms = 30 seconds

        return () => clearInterval(interval); // Cleanup when admin leaves dashboard
    }, []);

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
    const safeUpcoming = upcoming_schedule || [];

    // --- Badge Helpers ---
    const getOrderStatusBadge = (status) => {
        switch(status) {
            case 'paid': return <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none">Paid</Badge>;
            case 'settlement': return <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none">Settled</Badge>;
            case 'partially_paid': return <Badge className="bg-orange-500 hover:bg-orange-600 border-none">Partial</Badge>;
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

    const ServiceIcon = ({ type }) => {
        const config = {
            CarRental: { icon: Car, color: "text-blue-600 bg-blue-50" },
            Activity: { icon: Ticket, color: "text-orange-600 bg-orange-50" },
            HolidayPackage: { icon: Briefcase, color: "text-emerald-600 bg-emerald-50" },
            OpenTrip: { icon: Map, color: "text-cyan-600 bg-cyan-50" },
            TripPlanner: { icon: Clock, color: "text-purple-600 bg-purple-50" },
        };
        const item = config[type] || { icon: Calendar, color: "text-slate-600 bg-slate-50" };
        const Icon = item.icon;
        return (
            <div className={`p-2 rounded-md ${item.color}`}>
                <Icon className="w-4 h-4" />
            </div>
        );
    };

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
                                <TableCell className="font-medium text-xs text-muted-foreground">
                                    #{order.order_number}
                                </TableCell>
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
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium capitalize truncate max-w-[150px]">{order.service}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CreditCard size={10} /> {order.payment_method}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getOrderStatusBadge(order.status)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900">
                                    {formatCurrency(order.amount)}
                                </TableCell>
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

            <div className="py-6 space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Schedule</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStats.upcoming_deliveries_count || 0}</div>
                            <p className="text-xs text-muted-foreground">Confirmed services</p>
                        </CardContent>
                    </Card>

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

                <div className="grid gap-4 md:grid-cols-7">
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

                <Card className="shadow-lg border-none overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-cyan-400" />
                                    SERVICE DELIVERY SCHEDULE
                                </CardTitle>
                                <CardDescription className="text-slate-400 font-medium">Confirmed logistics and upcoming fulfillments</CardDescription>
                            </div>
                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 uppercase tracking-widest px-3">
                                {safeUpcoming.length} Tasks Scheduled
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="pl-6 py-4 font-black text-slate-500 uppercase text-[10px]">Date</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px]">Service / Product</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px]">Customer</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px]">Payment</TableHead>
                                    <TableHead className="text-right pr-6 font-black text-slate-500 uppercase text-[10px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeUpcoming.length > 0 ? (
                                    safeUpcoming.map((item) => (
                                        <TableRow key={item.id} className={`group hover:bg-slate-50 transition-colors ${item.is_today ? 'bg-rose-50/30' : ''}`}>
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-black text-sm ${item.is_today ? 'text-rose-600' : 'text-gray-900'}`}>
                                                        {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {item.is_today && (
                                                        <span className="text-[9px] bg-rose-600 text-white w-fit px-1.5 py-0.5 rounded-sm font-black mt-0.5 animate-pulse uppercase">Execute Today</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <ServiceIcon type={item.service_type} />
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{item.service_name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{item.service_type}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-700">{item.customer}</TableCell>
                                            <TableCell>{getOrderStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Link href={route('admin.orders.show', item.id)}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 group-hover:bg-primary group-hover:text-white rounded-full">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="h-32 text-center text-muted-foreground italic font-medium">No upcoming deliveries found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

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
                        </Card> {/* ✅ FIXED: Added this closing tag */}
                    </TabsContent>

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
                                <div className="space-y-4 px-6 pb-6 pt-2">
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
