import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { MoreHorizontal, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/Components/ui/tooltip';

export default function OrderIndex({ auth, orders }) {

  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid':
      case 'settlement':
        return 'default'; // Greenish in shadcn/ui
      case 'pending':
        return 'secondary'; // Yellowish
      case 'failed':
      case 'cancelled':
      case 'expire':
        return 'destructive'; // Reddish
      default:
        return 'outline';
    }
  };

  // Helper to get the name of the booked item gracefully
  const getBookableName = (booking) => {
    if (!booking || !booking.bookable) {
      return <span className="text-muted-foreground italic">Booking details missing</span>;
    }
    const { bookable } = booking;
    // Handles different service types
    return bookable.name || `${bookable.brand} ${bookable.car_model}`.trim();
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header="Order Management"
    >
      <Head title="Orders" />
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A complete list of all customer orders and their statuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-sm text-muted-foreground hidden md:block">{order.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getBookableName(order.booking)}</div>
                    {order.booking && (
                      <div className="text-xs text-muted-foreground">
                        Booking ID: {order.booking.id}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Info className="mr-2 h-4 w-4" />
                                <span>View Details (soon)</span>
                              </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Order details page coming soon.</p>
                            </TooltipContent>
                          </Tooltip>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}