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
import { Edit, Trash, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/Components/ui/input";

export default function Index({ trips, filters }) {
  const [search, setSearch] = useState(filters.search || "");

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("admin.open-trips.index"), { search });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      router.delete(route("admin.open-trips.destroy", id));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Manage Open Trips
        </h2>
      }
    >
      <Head title="Open Trips" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-white p-6 shadow-sm sm:rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search trips..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
              <Button asChild>
                <Link href={route("admin.open-trips.create")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Trip
                </Link>
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price From</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No trips found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trips.data.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.id}</TableCell>
                        <TableCell className="font-medium">{trip.name}</TableCell>
                        <TableCell>{trip.location}</TableCell>
                        <TableCell>{trip.duration} Days</TableCell>
                        <TableCell>{trip.category}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0
                          }).format(trip.starting_from_price)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={route("admin.open-trips.edit", trip.id)}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(trip.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex gap-2 justify-end">
                {trips.links.map((link, i) => (
                    link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            className={`px-3 py-1 border rounded ${link.active ? 'bg-black text-white' : 'bg-white'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span key={i} className="px-3 py-1 border rounded text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                    )
                ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
