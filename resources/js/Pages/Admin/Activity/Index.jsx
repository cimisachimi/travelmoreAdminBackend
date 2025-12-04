import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/Components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import Pagination from "@/Components/Pagination";
import { FilePlus, Search, MapPin, Edit, Trash2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

export default function Index({ auth, activities, filters }) {
  const [search, setSearch] = useState(filters.search || '');

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

  // Helper to get English name/location for the list view
  const getTranslatedName = (activity) =>
    activity.translations?.find(t => t.locale === "en")?.name || activity.name || "Untitled";

  const getTranslatedLocation = (activity) =>
    activity.translations?.find(t => t.locale === "en")?.location || "N/A";

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

      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Activities</CardTitle>
                    <CardDescription>Manage your activities and their public visibility.</CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search activities..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Create Button */}
                    <Button asChild className="shadow-md">
                        <Link href={route("admin.activities.create")}>
                            <FilePlus className="h-4 w-4 mr-2" /> Create New
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="pl-6">Activity Info</TableHead>
                    <TableHead>Price & Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.data.length > 0 ? (
                    activities.data.map((activity) => (
                      <TableRow key={activity.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-base text-gray-900 dark:text-white">
                                    {getTranslatedName(activity)}
                                </span>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                    {getTranslatedLocation(activity)}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-gray-900 dark:text-emerald-400">
                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(activity.price)}
                                </span>
                                {activity.duration && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {activity.duration}
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                          {/* Status Badge */}
                          {activity.is_active ? (
                             <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px] h-5 px-1.5">
                                 Published
                             </Badge>
                          ) : (
                             <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-gray-500">
                                 Draft
                             </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <Link href={route("admin.activities.edit", activity.id)}><Edit className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan="4" className="text-center h-32 text-gray-500">No activities found matching your criteria.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination Footer */}
              {activities.links && activities.meta && activities.meta.last_page > 1 && (
                <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/20">
                  <Pagination links={activities.links} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

    </AuthenticatedLayout>
  );
}
