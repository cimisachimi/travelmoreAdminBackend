import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react'; // ✅ 1. Import useForm
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, Users, MapPin, Calendar, Wallet } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';
import { Label } from '@/Components/ui/label'; // ✅ 2. Import components
import { Input } from '@/Components/ui/input';
import InputError from '@/Components/InputError';

// ... (Helper functions: formatCurrency, getStatusBadge, formatDate)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};
const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-500 hover:bg-green-500';
        case 'Rejected': return 'bg-red-500 hover:bg-red-500';
        case 'Pending': default: return 'bg-yellow-500 hover:bg-yellow-500';
    }
};
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ✅ 3. Get 'tripPlannerPrice' from props
export default function TripPlannerIndex({ auth, planners, tripPlannerPrice }) {

  // ✅ 4. Set up 'useForm' for the new price form
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    trip_planner_price: tripPlannerPrice || 0,
  });

  const submitGeneralPrice = (e) => {
    e.preventDefault();
    put(route('admin.planners.update-price'), { // Submit to the new route
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Trip Planner Submissions</h2>}
    >
      <Head title="Trip Planners" />

      {/* ✅ 5. ADD THIS NEW CARD FOR THE GENERAL PRICE */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>General Trip Planner Price</CardTitle>
            <CardDescription>
              This is the general consultation fee charged for all new trip plan submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitGeneralPrice} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="trip_planner_price">Price (IDR)</Label>
                <Input
                  id="trip_planner_price"
                  type="number"
                  value={data.trip_planner_price}
                  onChange={(e) => setData('trip_planner_price', e.target.value)}
                  className="mt-1 block w-full"
                />
                <InputError message={errors.trip_planner_price} className="mt-2" />
              </div>
              <div className="flex items-center gap-4">
                <Button disabled={processing}>
                  {processing ? 'Saving...' : 'Save General Price'}
                </Button>
                {recentlySuccessful && (
                  <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* This is your existing card for the list */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            A complete list of all custom trip planner requests submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Trip Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price (Quoted)</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planners.data.map((planner) => {
                const totalPax = (planner.adults || 0) + (planner.children || 0) + (planner.infants || 0);
                return (
                  <TableRow key={planner.id}>
                    <TableCell>
                      <div className="font-medium">{planner.full_name || planner.company_name}</div>
                      <div className="text-sm text-muted-foreground">{planner.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                            <MapPin size={14} className="text-muted-foreground" />
                            {planner.destination}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                            <Calendar size={14} />
                            {formatDate(planner.departure_date)} - {formatDate(planner.return_date)}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                            <Users size={14} />
                            {totalPax} Pax ({planner.adults}A, {planner.children}C, {planner.infants}I)
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                            <Wallet size={14} />
                            Budget: {planner.budget_pack}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize text-white ${getStatusBadge(planner.status)}`}>
                          {planner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(planner.price)}
                    </TableCell>
                    <TableCell>{formatDate(planner.created_at)}</TableCell>
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
                              <Link href={route("admin.planners.edit", planner.id)}>
                                  View / Edit
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Mark as Contacted</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination links={planners.links} className="mt-6" />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
