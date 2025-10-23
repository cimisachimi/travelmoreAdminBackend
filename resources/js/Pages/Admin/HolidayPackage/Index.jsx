import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button'; // Corrected import
import { MoreHorizontal, PlusCircle, Trash2, Edit, Star } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Badge } from '@/Components/ui/badge';

// Helper to format currency
const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

// Helper component to render stars
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.max(0, Math.min(totalStars, Math.round(rating || 0)));

  return (
    <div className="flex items-center gap-1">
      {[...Array(totalStars)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filledStars
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
            }`}
        />
      ))}
    </div>
  );
};

export default function HolidayPackageIndex({ auth, packages }) {
  const [packageToDelete, setPackageToDelete] = useState(null);

  const handleDelete = (pkg) => {
    setPackageToDelete(pkg);
  };

  const confirmDelete = () => {
    if (packageToDelete) {
      router.delete(route('admin.packages.destroy', packageToDelete.id), {
        preserveScroll: true,
        onSuccess: () => setPackageToDelete(null),
        onError: () => {
          console.error("Failed to delete package.");
          setPackageToDelete(null);
        },
      });
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header="Holiday Packages"
    >
      <Head title="Holiday Packages" />

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package
              "<span className="font-semibold">{packageToDelete?.name}</span>"
              and all associated data (including images).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPackageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Yes, delete package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Holiday Packages</CardTitle>
              <CardDescription>Manage your travel packages here.</CardDescription>
            </div>
            <Link href={route('admin.packages.create')}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Package
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Package Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price (Exclusive)</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.data.length > 0 ? (
                packages.data.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <img
                        // [FIXED] This URL is now correct
                        src={pkg.thumbnail_url || 'https://placehold.co/100x75/eee/ccc?text=No+Image'}
                        alt={pkg.name}
                        className="h-12 w-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {pkg.name}
                      {pkg.category && <Badge variant="outline" className="ml-2">{pkg.category}</Badge>}
                    </TableCell>
                    <TableCell>{pkg.location || 'N/A'}</TableCell>
                    <TableCell>{pkg.duration} Days</TableCell>
                    <TableCell>{formatCurrency(pkg.price_exclusive)}</TableCell>
                    <TableCell>
                      <StarRating rating={pkg.rating} />
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
                            <Link href={route('admin.packages.edit', pkg.id)} className="flex items-center cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(pkg)}
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
                  <TableCell colSpan="7" className="h-24 text-center">
                    No holiday packages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {packages.links && packages.meta && packages.meta.last_page > 1 && (
          <div className="p-4 border-t">
            <Pagination links={packages.links} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}