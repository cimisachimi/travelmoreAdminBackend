import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs'; // Imported Tabs
import {
    Users,
    CreditCard,
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Truck, // Imported Truck icon
    AlertCircle // Imported Alert icon
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

export default function Dashboard({ auth, stats, charts, recent_orders, delivery_orders, filters }) { // Added delivery_orders prop

    const currentRange = filters?.range || 'month';

    const onRangeChange = (value) => {
        // Ensure this points to admin dashboard
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

    // Reusable Component for Order List
    const OrderList = ({ orders, emptyMessage }) => (
        <div className="space-y-4">
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{emptyMessage}</p>
                </div>
            ) : (
                orders.map((order) => (
                    <Link
                        href={route('admin.orders.show', order.id)}
                        key={order.id}
                        className="block group cursor-pointer"
                    >
                        <div className="flex items-center justify-between border-b pb-4 group-hover:bg-slate-50 transition-colors p-2 rounded-md -mx-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 group-hover:bg-white transition-colors">
                                    <CreditCard className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none group-hover:text-blue-600 transition-colors">
                                        {order.customer}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{order.email}</p>
                                </div>
                            </div>
                            <div className="hidden md:block text-sm text-muted-foreground capitalize">
                                {order.service}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(order.amount)}</p>
                                    <p className="text-xs text-muted-foreground">{order.date}</p>
                                </div>
                                <Badge variant={
                                    order.status === 'paid' ? 'default' :
                                    order.status === 'settlement' ? 'success' : 'secondary'
                                }>
                                    {order.status}
                                </Badge>
                            </div>
                        </div>
                    </Link>
                ))
            )}
        </div>
    );

    return (
        <AuthenticatedLayout user={auth.user} header="Overview">
            <Head title="Dashboard" />

            <div className="py-6 space-y-6">

                {/* HEADER & FILTERS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Dashboard Stats
                    </h2>
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
                            <p className="text-xs text-muted-foreground">
                                +{safeStats.new_clients || 0} new in period
                            </p>
                        </CardContent>
                    </Card>

                    {/* Action Items (Clickable) */}
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
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
                                            />
                                            <Tooltip
                                                cursor={{fill: 'transparent'}}
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No revenue data available
                                    </div>
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
                                            <Pie
                                                data={safeCharts.categories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {safeCharts.categories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No sales in this period
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. ORDER ACTIVITY SECTION (TABS) */}
                <Tabs defaultValue="recent" className="w-full">
                    <div className="flex items-center justify-between mb-2">
                        <TabsList>
                            <TabsTrigger value="recent">Recent Orders</TabsTrigger>
                            <TabsTrigger value="delivery" className="relative">
                                Needs Delivery
                                {safeDeliveryOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.orders.index')}>View All Orders</Link>
                        </Button>
                    </div>

                    {/* Tab: Recent Orders */}
                    <TabsContent value="recent">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                                <CardDescription>Latest transactions from your customers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <OrderList orders={safeOrders} emptyMessage="No recent orders found." />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab: Needs Delivery */}
                    <TabsContent value="delivery">
                        <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-orange-600" />
                                    <CardTitle>Pending Delivery</CardTitle>
                                </div>
                                <CardDescription>Orders that have been paid but not yet completed.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <OrderList orders={safeDeliveryOrders} emptyMessage="No orders currently need delivery. Good job!" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
