import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
  Card,
  CardContent,
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
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import Pagination from "@/Components/Pagination";
import { FilePlus } from "lucide-react";

export default function Index({ auth, activities }) {
  // Helper to get translated name (defaults to 'en' or the fallback name)
  const getTranslatedName = (activity) => {
    const translation = activity.translations?.find(
      (t) => t.locale === "en"
    );
    return translation ? translation.name : activity.name;
  };

  const getTranslatedLocation = (activity) => {
    const translation = activity.translations?.find(
      (t) => t.locale === "en"
    );
    return translation ? translation.location : "N/A";
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

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Activities</CardTitle>
                <Button asChild>
                  <Link
                    href={route("admin.activities.create")}
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    Create New
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.data.length > 0 ? (
                    activities.data.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {getTranslatedName(activity)}
                        </TableCell>
                        <TableCell>
                          {getTranslatedLocation(
                            activity
                          )}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat(
                            "id-ID",
                            {
                              style: "currency",
                              currency: "IDR",
                            }
                          ).format(activity.price)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              activity.status ===
                                "active"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={route(
                                "admin.activities.edit",
                                activity.id
                              )}
                            >
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan="5"
                        className="text-center"
                      >
                        No activities found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                className="mt-6"
                links={activities.links}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}