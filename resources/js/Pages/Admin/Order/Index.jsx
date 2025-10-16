import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';

export default function OrderIndex({ auth, orders }) {

  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid':
      case 'settlement':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
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
            A complete list of all customer orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-sm text-muted-foreground">{order.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside">
                      {/* Corrected: Use order.order_items instead of order.items */}
                      {order.order_items.map(item => (
                        <li key={item.id} className="text-sm">
                          {/* Ensure orderable exists before trying to access its name */}
                          {item.orderable ? item.orderable.name : 'Item not found'}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Order Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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