import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import Pagination from "@/Components/Pagination";
import { Edit, Trash2, Plus, Search, MapPin, Calendar, Layers } from "lucide-react";
import { useState, useEffect } from "react";

export default function Index({ auth, trips, filters }) {
  const [search, setSearch] = useState(filters.search || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== (filters.search || '')) {
        router.get(
          route('admin.open-trips.index'),
          { search: search },
          { preserveState: true, preserveScroll: true }
        );
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      router.delete(route("admin.open-trips.destroy", id));
    }
  };

  return (
    <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Open Trips</h2>}>
      <Head title="Open Trips" />

      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-sm border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Trip Management</CardTitle>
                    <CardDescription>Manage open trip packages and schedules.</CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search trips..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button asChild className="shadow-md">
                        <Link href={route("admin.open-trips.create")}><Plus className="mr-2 h-4 w-4" /> Create Trip</Link>
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="pl-6">Trip Info</TableHead>
                    <TableHead>Price & Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.data.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No trips found.</TableCell></TableRow>
                  ) : (
                    trips.data.map((trip) => (
                      <TableRow key={trip.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-base">{trip.name}</span>
                                <div className="flex items-center text-sm text-gray-500 mt-1 gap-3">
                                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> {trip.location}</span>
                                    <span className="flex items-center"><Layers className="h-3 w-3 mr-1"/> {trip.category}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-emerald-600">
                                    From {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(trip.starting_from_price)}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {trip.duration} Days
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                          {/* ✅ Status Badge */}
                          {trip.is_active ? (
                             <Badge className="bg-emerald-600 hover:bg-emerald-700">Published</Badge>
                          ) : (
                             <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                          <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100 rounded-full">
                            <Link href={route("admin.open-trips.edit", trip.id)}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full" onClick={() => handleDelete(trip.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t bg-gray-50/50">
                  <Pagination links={trips.links} />
              </div>
            </CardContent>
          </Card>
        </div>

    </AuthenticatedLayout>
  );
}
