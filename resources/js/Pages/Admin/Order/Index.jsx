import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react'; // Import Link
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge'; // Import Badge
import { Button } from '@/Components/ui/button'; // Import Button
import { Eye } from 'lucide-react'; // Import an icon

// Helper to format currency
const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

// Helper to format dates
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to get a colored badge for status
const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">{status}</Badge>;
    case 'paid':
    case 'settlement': // For transaction
      return <Badge className="bg-green-600 text-white">{status}</Badge>;
    case 'partially_paid':
      return <Badge className="bg-yellow-500 text-white">{status}</Badge>;
    case 'delivered':
      return <Badge className="bg-blue-600 text-white">{status}</Badge>;
    case 'cancelled':
    case 'expire': // For transaction
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status || 'N/A'}</Badge>;
  }
};

export default function Index({ auth, orders }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header="Orders Management" // Updated header
    >
      <Head title="Orders" />

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all orders from customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items Ordered</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.length > 0 ? (
                orders.data.map((order) => (
                  <TableRow key={order.id}>
                    {/* Customer Info */}
                    <TableCell className="font-medium">
                      <div>{order.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.user.email}
                      </div>
                    </TableCell>

                    {/* Items Info */}
                    <TableCell>
                      <ul className="list-disc pl-4 text-sm">
                        {order.order_items.map((item) => (
                          <li key={item.id}>
                            {item.quantity} x {item.name}
                          </li>
                        ))}
                      </ul>
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell className="font-semibold">
                      {formatCurrency(order.total_amount)}
                    </TableCell>

                    {/* Order Status */}
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell>
                      {getStatusBadge(order.transaction?.status)}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      {formatDate(order.created_at)}
                    </TableCell>

                    {/* Actions (Example: View Details) */}
                    <TableCell>
                      {/* You would create this route in web.php and controller */}
                      {/* <Link href={route('admin.orders.show', order.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link> */}
                      {/* Placeholder until show page exists */}
                      <Button variant="outline" size="sm" disabled>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan="7"
                    className="text-center"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Add Pagination component here if needed */}
      </Card>
    </AuthenticatedLayout>
  );
}