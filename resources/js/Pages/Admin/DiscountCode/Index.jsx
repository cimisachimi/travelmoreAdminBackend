import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/Components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/Components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Percent, Package } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function DiscountCodeIndex({ auth, discountCodes }) {
  const deleteCode = (code) => {
    if (confirm('Are you sure you want to delete this discount code?')) {
      router.delete(route('admin.discount-codes.destroy', code.id), {
        preserveScroll: true,
      });
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header="Discount Codes"
    >
      <Head title="Discount Codes" />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manage Discount Codes</CardTitle>
              <CardDescription>Create and manage promotional codes.</CardDescription>
            </div>
            <Link href={route('admin.discount-codes.create')}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Code
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountCodes.data.length > 0 ? (
                discountCodes.data.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="text-base">
                        <Package className="mr-2 h-4 w-4" />
                        {code.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{code.type}</TableCell>
                    <TableCell>
                      {code.type === 'percent' ? `${code.value}%` : formatCurrency(code.value)}
                    </TableCell>
                    <TableCell>
                      {code.uses} / {code.max_uses || '∞'}
                    </TableCell>
                    <TableCell>
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString('en-GB') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={route('admin.discount-codes.edit', code.id)} className="flex items-center cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteCode(code)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="6" className="h-24 text-center">
                    No discount codes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {discountCodes.links && discountCodes.meta && discountCodes.meta.last_page > 1 && (
          <div className="p-4 border-t">
            <Pagination links={discountCodes.links} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}
