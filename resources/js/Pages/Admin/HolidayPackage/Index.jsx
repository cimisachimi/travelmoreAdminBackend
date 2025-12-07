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
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Star, Search, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { Badge } from '@/Components/ui/badge';

// Helper to format currency
const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

// Helper component to render stars
const StarRating = ({ rating }) => {
  const numericRating = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full w-fit">
      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
      <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{numericRating.toFixed(1)}</span>
    </div>
  );
};

// Helper to get the starting price
const getStartingPrice = (tiers) => {
  if (tiers && Array.isArray(tiers) && tiers.length > 0) {
    return tiers[0].price;
  }
  return null;
};

export default function HolidayPackageIndex({ auth, packages, filters }) {
  const [packageToDelete, setPackageToDelete] = useState(null);

  // SEARCH LOGIC
  const [search, setSearch] = useState(filters.search || '');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get(
          route('admin.packages.index'),
          { search: search },
          { preserveState: true, preserveScroll: true }
        );
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

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
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Holiday Packages</h2>}
    >
      <Head title="Holiday Packages" />

      {/* Alert Dialog */}
      <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "<span className="font-semibold text-gray-900 dark:text-gray-100">{packageToDelete?.name}</span>" and all its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPackageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm border-gray-200 dark:border-gray-800">
          <CardHeader className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between pb-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">Package Management</CardTitle>
              <CardDescription>
                Create, update, and manage your travel itineraries.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
               {/* SEARCH BAR */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search packages..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Link href={route('admin.packages.create')}>
                <Button className="w-full sm:w-auto shadow-md">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Package
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead className="w-[400px] pl-6">Package Info</TableHead>
                  <TableHead>Trip Details</TableHead>
                  <TableHead>Starting Price</TableHead>
                  <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.data.length > 0 ? (
                  packages.data.map((pkg) => {
                    const startingPrice = getStartingPrice(pkg.price_tiers);
                    return (
                      <TableRow key={pkg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">

                        {/* COLUMN 1: Image + Title + Meta + Status */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex gap-4">
                            {/* Thumbnail */}
                            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100">
                                {pkg.thumbnail_url ? (
                                    <img
                                    src={pkg.thumbnail_url}
                                    alt={pkg.name}
                                    className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                                        <ImageIcon className="h-8 w-8" />
                                    </div>
                                )}
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col justify-center gap-1">
                                <div className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                                    {pkg.name}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]">{pkg.location || 'Unknown Location'}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                     {/* ✅ STATUS BADGE */}
                                     {pkg.is_active ? (
                                         <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-5 px-1.5">
                                             Published
                                         </Badge>
                                     ) : (
                                         <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-gray-500">
                                             Draft
                                         </Badge>
                                     )}
                                     {pkg.category && <Badge variant="outline" className="text-[10px] h-5 px-1.5">{pkg.category}</Badge>}
                                </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* COLUMN 2: Stats (Duration & Rating) */}
                        <TableCell>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {pkg.duration} Days
                                </div>
                                <StarRating rating={pkg.rating} />
                            </div>
                        </TableCell>

                        {/* COLUMN 3: Price */}
                        <TableCell>
                          {startingPrice !== null ? (
                              <div className="flex flex-col">
                                  <span className="text-xs text-gray-400 uppercase font-semibold">From</span>
                                  <span className="font-bold text-gray-900 dark:text-emerald-400 text-lg">
                                      {formatCurrency(startingPrice)}
                                  </span>
                                  <span className="text-xs text-gray-500">per pax</span>
                              </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">Not Set</Badge>
                          )}
                        </TableCell>

                        {/* COLUMN 4: Actions */}
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Manage Package</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={route('admin.packages.edit', pkg.id)} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/public/packages/${pkg.id}`} className="cursor-pointer" target="_blank">
                                    <Search className="mr-2 h-4 w-4" /> Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(pkg)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan="4" className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <p>No holiday packages found matching your criteria.</p>
                        {search && (
                             <Button variant="link" onClick={() => setSearch('')} className="text-blue-500">
                                 Clear Search
                             </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* ✅ FIXED PAGINATION: Uses standard 'links' directly, just like OpenTrip/Index.jsx */}
            <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/20">
                <Pagination links={packages.links} />
            </div>

          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
