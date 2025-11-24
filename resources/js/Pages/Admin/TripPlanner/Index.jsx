import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, Users, MapPin, Calendar, Clock, CreditCard } from 'lucide-react'; // Added icons
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import InputError from '@/Components/InputError';

// Helper: Format Currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

// Helper: Admin Status Badge (Approved/Pending/Rejected)
const getAdminStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-600 hover:bg-green-700';
        case 'Rejected': return 'bg-red-600 hover:bg-red-700';
        default: return 'bg-blue-600 hover:bg-blue-700';
    }
};

// Helper: Payment Status Badge (Paid/Unpaid)
const getPaymentStatusBadge = (bookings) => {
    if (!bookings || bookings.length === 0) {
        return <Badge variant="outline" className="text-gray-500 border-gray-300">Not Booked</Badge>;
    }

    // 1. Sort bookings by ID descending (Newest first)
    const sortedBookings = [...bookings].sort((a, b) => b.id - a.id);

    // 2. Ideally, we want to show the 'paid' one if it exists, otherwise the latest one
    // Find a successful booking
    let booking = sortedBookings.find(b => b.payment_status === 'paid' || b.payment_status === 'partial');

    // 3. If no paid booking found, just take the latest attempt
    if (!booking) {
        booking = sortedBookings[0];
    }

    switch (booking.payment_status) {
        case 'paid':
            return <Badge className="bg-emerald-500 hover:bg-emerald-600">Paid</Badge>;
        case 'partial':
             return <Badge className="bg-blue-500 hover:bg-blue-600">Partial</Badge>;
        case 'unpaid':
            return <Badge className="bg-orange-500 hover:bg-orange-600">Unpaid</Badge>;
        case 'cancelled':
             return <Badge variant="destructive">Cancelled</Badge>;
        default:
            return <Badge variant="secondary">{booking.payment_status}</Badge>;
    }
};

// Helper: Format Date
const formatDate = (dateString) => {
    if (!dateString) return <span className="text-gray-400 italic">TBD</span>;
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TripPlannerIndex({ auth, planners, tripPlannerPrice }) {
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    trip_planner_price: tripPlannerPrice || 0,
  });

  const submitGeneralPrice = (e) => {
    e.preventDefault();
    put(route('admin.planners.update-price'), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Trip Planner Submissions</h2>}
    >
      <Head title="Trip Planners" />

      <div className="py-12 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* 1. General Settings Card */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Global Pricing Setting
            </CardTitle>
            <CardDescription>
              Set the default consultation fee charged for new trip plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitGeneralPrice} className="flex items-start gap-4 max-w-2xl">
              <div className="flex-1">
                <Label htmlFor="trip_planner_price">Fee Amount (IDR)</Label>
                <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-500">Rp</span>
                    <Input
                    id="trip_planner_price"
                    type="number"
                    value={data.trip_planner_price}
                    onChange={(e) => setData('trip_planner_price', e.target.value)}
                    className="pl-10 block w-full"
                    />
                </div>
                <InputError message={errors.trip_planner_price} className="mt-2" />
              </div>
              <div className="mt-7">
                <Button disabled={processing}>
                  {processing ? 'Saving...' : 'Update Price'}
                </Button>
                {recentlySuccessful && (
                  <span className="ml-3 text-sm text-green-600 font-medium animate-pulse">Saved!</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. Submissions Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Trip Requests</CardTitle>
            <CardDescription>
              Manage incoming custom trip itinerary requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Traveler</TableHead>
                  <TableHead className="w-[250px]">Destination & Style</TableHead>
                  <TableHead className="w-[200px]">Timing</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planners.data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No trip requests found.
                        </TableCell>
                    </TableRow>
                ) : (
                    planners.data.map((planner) => {
                        // Calculate total pax safely
                        const totalPax = (parseInt(planner.pax_adults) || 0) +
                                         (parseInt(planner.pax_teens) || 0) +
                                         (parseInt(planner.pax_kids) || 0) +
                                         (parseInt(planner.pax_seniors) || 0);

                        // Format Destination
                        const destination = [planner.city, planner.province].filter(Boolean).join(', ') || "Unspecified";

                        return (
                        <TableRow key={planner.id}>
                            {/* Traveler Info */}
                            <TableCell>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                    {planner.full_name || planner.company_name || "Guest"}
                                </div>
                                <div className="text-xs text-muted-foreground">{planner.email}</div>
                                <div className="text-xs text-muted-foreground">{planner.phone}</div>
                            </TableCell>

                            {/* Destination & Style */}
                            <TableCell>
                                <div className="flex items-center gap-1.5 font-medium text-sm">
                                    <MapPin size={14} className="text-blue-500" />
                                    {destination}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                    <Users size={12} />
                                    <span>{totalPax} Pax ({planner.pax_adults || 0}A / {planner.pax_kids || 0}C)</span>
                                </div>
                                <div className="mt-0.5 text-xs bg-gray-100 dark:bg-gray-800 w-fit px-1.5 py-0.5 rounded">
                                    {planner.trip_type || 'General'}
                                </div>
                            </TableCell>

                            {/* Timing */}
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Calendar size={14} className="text-gray-400" />
                                    {formatDate(planner.departure_date)}
                                </div>
                                {planner.duration && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <Clock size={12} />
                                        {planner.duration}
                                    </div>
                                )}
                            </TableCell>

                            {/* Admin Review Status */}
                            <TableCell>
                                <Badge className={`capitalize text-white shadow-none ${getAdminStatusBadge(planner.status)}`}>
                                    {planner.status}
                                </Badge>
                                <div className="mt-1 text-xs font-medium text-gray-500">
                                    {formatCurrency(planner.price)}
                                </div>
                            </TableCell>

                            {/* Payment Status (from Relationship) */}
                            <TableCell>
                                {getPaymentStatusBadge(planner.bookings)}
                            </TableCell>

                            {/* Submitted Date */}
                            <TableCell className="text-right text-xs text-muted-foreground">
                                {new Date(planner.created_at).toLocaleDateString()}
                                <br />
                                {new Date(planner.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={route("admin.planners.edit", planner.id)} className="cursor-pointer font-medium">
                                            Manage & Recommend
                                        </Link>
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        );
                    })
                )}
              </TableBody>
            </Table>

            <Pagination links={planners.links} className="mt-6" />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
