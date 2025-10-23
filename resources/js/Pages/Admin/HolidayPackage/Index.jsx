import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react'; // Import Link and router
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
  DropdownMenuLabel, // Optional: for header
  DropdownMenuSeparator, // Optional: for separator
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Eye } from 'lucide-react'; // Import icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/Components/ui/alert-dialog" // Import AlertDialog
import Pagination from '@/Components/Pagination'; // Assuming you have a Pagination component
import { useState } from 'react'; // Import useState for AlertDialog

// Helper to format currency
const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

export default function HolidayPackageIndex({ auth, packages }) {
  // State to control which item is being considered for deletion
  const [packageToDelete, setPackageToDelete] = useState(null);

  // Function to handle delete confirmation
  const handleDelete = (pkg) => {
    setPackageToDelete(pkg); // Open dialog by setting the package
  };

  // Function to execute deletion
  const confirmDelete = () => {
    if (packageToDelete) {
      router.delete(route('admin.packages.destroy', packageToDelete.id), {
        preserveScroll: true, // Keep scroll position after delete
        onSuccess: () => setPackageToDelete(null), // Close dialog on success
        onError: () => {
          // Optional: Add error handling (e.g., toast notification)
          console.error("Failed to delete package.");
          setPackageToDelete(null); // Close dialog even on error
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
            {/* Create Button using Link */}
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
                <TableHead>Package Name</TableHead> {/* Use translated name */}
                <TableHead>Duration</TableHead> {/* Use 'duration' */}
                <TableHead>Exclusive Price</TableHead> {/* Use 'price_exclusive' */}
                <TableHead>Category</TableHead> {/* Add Category */}
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.data.length > 0 ? (
                packages.data.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell> {/* Displays translated name */}
                    <TableCell>{pkg.duration} Days</TableCell> {/* Use duration */}
                    <TableCell>{formatCurrency(pkg.price_exclusive)}</TableCell> {/* Use exclusive price */}
                    <TableCell>{pkg.category || 'N/A'}</TableCell> {/* Display category */}
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
                          {/* Optional: Add a View Details link if you have a show route/page */}
                          {/* <DropdownMenuItem asChild>
                                                        <Link href={route('admin.holiday-packages.show', pkg.id)} className="flex items-center cursor-pointer">
                                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                                        </Link>
                                                    </DropdownMenuItem> */}
                          <DropdownMenuItem asChild>
                            <Link href={route('admin.packages.edit', pkg.id)} className="flex items-center cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Trigger AlertDialog instead of direct link */}
                          <DropdownMenuItem
                            onClick={() => handleDelete(pkg)} // Pass package to delete handler
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
                  <TableCell colSpan="5" className="h-24 text-center">
                    No holiday packages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination */}
        {packages.links && packages.meta && packages.meta.last_page > 1 && ( // <-- ADDED 'packages.meta &&'
          <div className="p-4 border-t">
            <Pagination links={packages.links} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  );
}