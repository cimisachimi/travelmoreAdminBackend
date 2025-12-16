import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { MoreHorizontal, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';

export default function TransactionIndex({ auth, transactions }) {
  // State for the payload viewer dialog
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState(null);

  // State for the active filter tab
  const [statusFilter, setStatusFilter] = useState('all');

  // --- Utility Functions ---
  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --- Memoized Calculations for Performance ---
  const stats = useMemo(() => {
    const totalRevenue = transactions
      .filter(t => t.status === 'settlement' || t.status === 'capture')
      .reduce((sum, t) => sum + parseFloat(t.gross_amount), 0);

    const successfulCount = transactions.filter(t => t.status === 'settlement' || t.status === 'capture').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const failedCount = transactions.filter(t => ['failure', 'cancel', 'expire', 'deny'].includes(t.status)).length;

    return { totalRevenue, successfulCount, pendingCount, failedCount };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') {
      return transactions;
    }
    if (statusFilter === 'settled') {
      return transactions.filter(t => t.status === 'settlement' || t.status === 'capture');
    }
    if (statusFilter === 'failed') {
      return transactions.filter(t => ['failure', 'cancel', 'expire', 'deny'].includes(t.status));
    }
    return transactions.filter(t => t.status === statusFilter);
  }, [transactions, statusFilter]);


  // --- Event Handlers ---
  const viewPayload = (payload) => {
    try {
      setSelectedPayload(JSON.stringify(JSON.parse(payload), null, 2));
    } catch {
      setSelectedPayload(payload);
    }
    setIsPayloadDialogOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'settlement':
      case 'capture':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failure':
      case 'cancel':
      case 'expire':
      case 'deny':
        return 'destructive';
      default:
        return 'outline';
    }
  };


  return (
    <AuthenticatedLayout user={auth.user} header="Transaction Management">
      <Head title="Transactions" />

      {/* --- Overall Stats Section --- */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all successful transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulCount}</div>
            <p className="text-xs text-muted-foreground">Total settled payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Transactions awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed / Canceled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
            <p className="text-xs text-muted-foreground">Expired or failed attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Content: Table and Filters --- */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete list of all payment transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* --- Filter Tabs --- */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="settled">Settled</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            {/* --- Table --- */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">TRX-{transaction.id}</TableCell>
                    <TableCell>
                      {transaction.user ? (
                        <>
                          <div className="font-medium">{transaction.user.name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.user.email}</div>
                        </>
                      ) : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell>{transaction.order ? transaction.order.order_number : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.payment_type ? transaction.payment_type.replace(/_/g, ' ') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(transaction.gross_amount)}</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {transaction.payment_payloads && (
                            <DropdownMenuItem onSelect={() => viewPayload(transaction.payment_payloads)}>
                              View Payload
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>View Order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>

      {/* --- Payload Viewer Dialog --- */}
      <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transaction Payload</DialogTitle>
            <DialogDescription>The raw JSON data received from the Midtrans webhook.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md bg-secondary p-4">
            <pre className="text-sm text-secondary-foreground">{selectedPayload}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayloadDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
