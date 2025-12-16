import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import Pagination from "@/Components/Pagination";
import {
  PlusCircle,
  Search,
  MapPin,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  Image as ImageIcon
} from "lucide-react";
import { useState, useEffect } from "react";

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

export default function Index({ auth, activities, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [activityToDelete, setActivityToDelete] = useState(null);

  // Search Debounce Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get(
          route('admin.activities.index'),
          { search: search },
          { preserveState: true, preserveScroll: true }
        );
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Helpers to get translated fields safely
  const getTranslatedName = (activity) =>
    activity.translations?.find(t => t.locale === "en")?.name || activity.name || "Untitled";

  const getTranslatedLocation = (activity) =>
    activity.translations?.find(t => t.locale === "en")?.location || "Unknown Location";

  const getTranslatedCategory = (activity) =>
    activity.translations?.find(t => t.locale === "en")?.category;

  // Delete Handlers
  const handleDelete = (activity) => {
    setActivityToDelete(activity);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      router.delete(route('admin.activities.destroy', activityToDelete.id), {
        preserveScroll: true,
        onSuccess: () => setActivityToDelete(null),
        onError: () => {
          console.error("Failed to delete activity.");
          setActivityToDelete(null);
        }
      });
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Manage Activities
        </h2>
      }
    >
      <Head title="Activities" />

      {/* Alert Dialog for Deletion */}
      <AlertDialog open={!!activityToDelete} onOpenChange={() => setActivityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "<span className="font-semibold text-gray-900 dark:text-gray-100">{activityToDelete && getTranslatedName(activityToDelete)}</span>" and all its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActivityToDelete(null)}>Cancel</AlertDialogCancel>
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
                    <CardTitle className="text-2xl font-bold">Activities</CardTitle>
                    <CardDescription>Manage your activities, pricing, and public visibility.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search activities..."
                            className="pl-9 w-full sm:w-[250px]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Create Button */}
                    <Link href={route("admin.activities.create")}>
                        <Button className="w-full sm:w-auto shadow-md">
                            <PlusCircle className="mr-2 h-4 w-4" /> New Activity
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="w-[400px] pl-6">Activity Info</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.data.length > 0 ? (
                    activities.data.map((activity) => {
                        const name = getTranslatedName(activity);
                        const location = getTranslatedLocation(activity);
                        const category = getTranslatedCategory(activity);

                        return (
                          <TableRow key={activity.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">

                            {/* COLUMN 1: Image + Title + Meta + Status */}
                            <TableCell className="pl-6 py-4">
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100">
                                        {activity.thumbnail_url ? (
                                            <img
                                                src={activity.thumbnail_url}
                                                alt={name}
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
                                            {name}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="truncate max-w-[150px]">{location}</span>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            {/* Status Badge */}
                                            {activity.is_active ? (
                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-5 px-1.5">
                                                    Published
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-gray-500">
                                                    Draft
                                                </Badge>
                                            )}
                                            {/* Category Badge */}
                                            {category && (
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>

                            {/* COLUMN 2: Duration */}
                            <TableCell>
                                {activity.duration ? (
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {activity.duration}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                            </TableCell>

                            {/* COLUMN 3: Price */}
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 uppercase font-semibold">From</span>
                                    <span className="font-bold text-gray-900 dark:text-emerald-400 text-lg">
                                        {formatCurrency(activity.price)}
                                    </span>
                                    <span className="text-xs text-gray-500">per person</span>
                                </div>
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
                                        <DropdownMenuLabel>Manage Activity</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={route("admin.activities.edit", activity.id)} className="cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                                            </Link>
                                        </DropdownMenuItem>
                                        {/* Optional Preview Link - adjust route as needed */}
                                        {/* <DropdownMenuItem asChild>
                                            <Link href={`/activities/${activity.id}`} className="cursor-pointer" target="_blank">
                                                <Search className="mr-2 h-4 w-4" /> Preview
                                            </Link>
                                        </DropdownMenuItem>
                                        */}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(activity)}
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
                                <p>No activities found matching your criteria.</p>
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

              {/* Pagination */}
              <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/20">
                  {activities.links && <Pagination links={activities.links} />}
              </div>
            </CardContent>
          </Card>
      </div>
    </AuthenticatedLayout>
  );
}
