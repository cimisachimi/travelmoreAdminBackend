import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Users, Package, BaggageClaim, DollarSign, Truck, LineChart, BarChart } from 'lucide-react'; // Added Truck, LineChart, BarChart

export default function Dashboard({ auth, stats }) {

    // Helper to format currency safely
    const formatCurrency = (amount) => {
        const numericAmount = Number(amount) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numericAmount); //
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Dashboard Overview" // Updated header text
        >
            <Head title="Dashboard" />

            {/* Stats Cards Section */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5"> {/* Changed grid to 5 cols */}
                {/* Total Revenue Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div> {/* */}
                        <p className="text-xs text-muted-foreground">From settled transactions</p>
                    </CardContent>
                </Card>

                {/* Total Users Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle> {/* Changed Title */}
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div> {/* */}
                        <p className="text-xs text-muted-foreground">Registered client accounts</p>
                    </CardContent>
                </Card>

                {/* Total Bookings Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <BaggageClaim className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.bookings}</div> {/* */}
                        <p className="text-xs text-muted-foreground">Across all services</p>
                    </CardContent>
                </Card>

                {/* Holiday Packages Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Packages/Services</CardTitle> {/* Changed Title */}
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* Assuming stats.packages is just one type, add others if available */}
                        <div className="text-2xl font-bold">{stats.packages}</div> {/* */}
                        <p className="text-xs text-muted-foreground">Total available services</p>
                    </CardContent>
                </Card>

                {/* Needs Delivery Card - NEW */}
                <Card className="border-orange-500 hover:shadow-lg transition-shadow"> {/* Added orange border */}
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600">Needs Delivery</CardTitle> {/* Orange text */}
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.needs_delivery}</div>
                        <p className="text-xs text-muted-foreground">Paid orders awaiting fulfillment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section - Placeholder */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-muted-foreground" /> Revenue Over Time
                        </CardTitle>
                        <CardDescription>Placeholder for a line chart showing revenue trends.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder Content - Replace with actual chart component */}
                        <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
                            <p className="text-muted-foreground">Revenue Chart Coming Soon...</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-muted-foreground" /> Booking Sources
                        </CardTitle>
                        <CardDescription>Placeholder for a chart showing booking types (Car, Package, etc.).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder Content - Replace with actual chart component */}
                        <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
                            <p className="text-muted-foreground">Bookings Chart Coming Soon...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Potentially add more sections like Recent Activity, etc. */}

        </AuthenticatedLayout>
    );
}