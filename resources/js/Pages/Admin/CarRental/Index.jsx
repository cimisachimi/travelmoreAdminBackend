import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
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
import { Badge } from "@/Components/ui/badge";

export default function Index({ auth, carRentals }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Car Rentals
        </h2>
      }
    >
      <Head title="Car Rentals" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Car Rentals</CardTitle>
              <CardDescription>
                A list of all the car rentals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car Model</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price Per Day</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carRentals.data.map((carRental) => (
                    <TableRow key={carRental.id}>
                      <TableCell className="font-medium">
                        {carRental.car_model}
                      </TableCell>
                      <TableCell>
                        {carRental.brand}
                      </TableCell>
                      <TableCell>
                        {carRental.price_per_day}
                      </TableCell>
                      <TableCell>
                        {carRental.availability
                          ? "Available"
                          : "Not Available"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge>
                          {carRental.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}