import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/Components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import InputError from "@/Components/InputError";
import { Calendar as CalendarIcon } from "lucide-react";
import AvailabilityCalendar from "@/Components/AvailabilityCalendar";

export default function Index({ auth, carRentals, filters }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(filters.year, filters.month - 1));

  const { data, setData, post, processing, errors, reset } = useForm({
    car_model: "",
    brand: "",
    price_per_day: "",
    thumbnail: null,
    gallery: [],
  });

  // Reset month when the calendar dialog is closed to ensure it opens with the default month next time.
  useEffect(() => {
    if (!isCalendarOpen) {
      setCurrentMonth(new Date(filters.year, filters.month - 1));
    }
  }, [isCalendarOpen]);

  // This is the core Inertia logic for updating the calendar data.
  // It makes a partial request to the server, only asking for the props that have changed.
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
    router.get(route('admin.rentals.index'), {
      month: newMonth.getMonth() + 1,
      year: newMonth.getFullYear(),
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['carRentals', 'filters'], // This is the key to efficient updates
    });
  };

  const submit = (e) => {
    e.preventDefault();
    post(route("admin.rentals.store"), {
      onSuccess: () => {
        reset();
        setIsCreateDialogOpen(false);
      },
    });
  };

  const openCalendar = (car) => {
    // Find the specific car rental data from the main prop to ensure the calendar gets the latest availability info
    const carWithAvailability = carRentals.data.find(c => c.id === car.id);
    setSelectedCar(carWithAvailability);
    setIsCalendarOpen(true);
  };

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
        <div className="max-w-7xl mx-auto sm:px-6 lg-px-8">
          {/* --- Create Car Rental Dialog --- */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a New Car Rental</DialogTitle>
                <DialogDescription>
                  Fill out the form to add a new car to your rental fleet.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="car_model">Car Model</Label>
                  <Input id="car_model" value={data.car_model} onChange={(e) => setData("car_model", e.target.value)} />
                  <InputError message={errors.car_model} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={data.brand} onChange={(e) => setData("brand", e.target.value)} />
                  <InputError message={errors.brand} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="price_per_day">Price Per Day (IDR)</Label>
                  <Input id="price_per_day" type="number" value={data.price_per_day} onChange={(e) => setData("price_per_day", e.target.value)} />
                  <InputError message={errors.price_per_day} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="thumbnail">Thumbnail</Label>
                  <Input id="thumbnail" type="file" onChange={(e) => setData("thumbnail", e.target.files[0])} />
                  <InputError message={errors.thumbnail} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="gallery">Gallery Images</Label>
                  <Input id="gallery" type="file" multiple onChange={(e) => setData("gallery", e.target.files)} />
                  <InputError message={errors.gallery} className="mt-2" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={processing}>
                    Create Car Rental
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* --- Availability Calendar Dialog --- */}
          <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Availability for {selectedCar?.car_model}</DialogTitle>
              </DialogHeader>
              {selectedCar && (
                <AvailabilityCalendar
                  carRental={selectedCar}
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                />
              )}
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Car Rentals</CardTitle>
                  <CardDescription>A list of all the car rentals in your fleet.</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Create Car Rental</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Car Model</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price Per Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carRentals.data.map((carRental) => (
                    <TableRow key={carRental.id}>
                      <TableCell>
                        <img
                          src={`/storage/${carRental.images.find(img => img.type === 'thumbnail')?.url}`}
                          alt={carRental.car_model}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{carRental.car_model}</TableCell>
                      <TableCell>{carRental.brand}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(carRental.price_per_day)}
                      </TableCell>
                      <TableCell>
                        <Badge>{carRental.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => openCalendar(carRental)}>
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
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