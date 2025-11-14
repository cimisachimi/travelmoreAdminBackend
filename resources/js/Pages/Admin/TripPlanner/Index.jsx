import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, Users, MapPin, Calendar, Wallet } from 'lucide-react'; // Added icons
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination'; // Include Pagination

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

// Helper function for status badges
const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved':
            return 'bg-green-500 hover:bg-green-500';
        case 'Rejected':
            return 'bg-red-500 hover:bg-red-500';
        case 'Pending':
        default:
            return 'bg-yellow-500 hover:bg-yellow-500';
    }
};

// Helper function to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// This prop is a Paginator object
export default function TripPlannerIndex({ auth, planners }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Trip Planner Submissions</h2>}
    >
      <Head title="Trip Planners" />
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
                <TableHead>Trip Info</TableHead> {/* ✅ UPDATED "Good Info" Column */}
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ✅ FIX 1: Map over planners.data */}
              {planners.data.map((planner) => {
                const totalPax = (planner.adults || 0) + (planner.children || 0) + (planner.infants || 0);
                return (
                  <TableRow key={planner.id}>
                    <TableCell>
                      <div className="font-medium">{planner.full_name || planner.company_name}</div>
                      <div className="text-sm text-muted-foreground">{planner.email}</div>
                    </TableCell>

                    {/* ✅ UPDATED "Good Info" Cell */}
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
                          {/* ✅ FIX 2: Use the correct route name 'admin.planners.edit' */}
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

          {/* ✅ FIX 3: Add Pagination back in */}
          <Pagination links={planners.links} className="mt-6" />

        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
