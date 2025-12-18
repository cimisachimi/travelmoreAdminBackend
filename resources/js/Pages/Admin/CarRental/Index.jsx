import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/Components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/Components/ui/select";
import InputError from "@/Components/InputError";
import AvailabilityCalendar from "@/Components/AvailabilityCalendar";
import { PlusCircle, Edit, Trash2, Crown, Car } from "lucide-react"; // Added Crown and Car icons
import DangerButton from "@/Components/DangerButton";
import { Badge } from "@/Components/ui/badge";


// Component for Pagination Links
const Pagination = ({ links }) => (
  <div className="mt-4 flex justify-center">
    {links.map((link, key) => (
      link.url ? (
        <Link
          key={key}
          href={link.url}
          className={`px-4 py-2 mx-1 border rounded-md ${link.active ? 'bg-blue-500 text-white' : 'bg-white'}`}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ) : (
        <div
          key={key}
          className="px-4 py-2 mx-1 border rounded-md text-gray-400"
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      )
    ))}
  </div>
);


export default function Index({ auth, carRentals, filters }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(filters.year, filters.month - 1));

  const { data, setData, post, processing, errors, reset } = useForm({
    car_model: "",
    brand: "",
    category: "regular",
    car_type: "",
    transmission: "",
    fuel_type: "",
    capacity: "",
    trunk_size: "",
    price_per_day: "",
    description: "",
    features: "",
    thumbnail: null,
    gallery: [],
  });

  const submitCreate = (e) => {
    e.preventDefault();
    post(route("admin.rentals.store"), {
      onSuccess: () => {
        reset();
        setIsCreateDialogOpen(false);
      },
    });
  };

  const openEditor = (car) => {
    const fullCarData = carRentals.data.find(c => c.id === car.id);
    setSelectedCar(fullCarData);
    setIsEditorOpen(true);
  };

  const openDeleteDialog = (car) => {
    setSelectedCar(car);
    setIsDeleteDialogOpen(true);
  };

  const deleteCar = (e) => {
    e.preventDefault();
    router.delete(route('admin.rentals.destroy', { id: selectedCar.id }), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedCar(null);
      }
    });
  }

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
          {/* --- Create Car Dialog --- */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add a New Car Rental</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Rental Category</Label>
                    <Select onValueChange={(value) => setData("category", value)} defaultValue={data.category}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Rental</SelectItem>
                        <SelectItem value="exclusive">Exclusive Rental</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.category} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" value={data.brand} onChange={(e) => setData("brand", e.target.value)} />
                    <InputError message={errors.brand} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="car_model">Car Model</Label>
                    <Input id="car_model" value={data.car_model} onChange={(e) => setData("car_model", e.target.value)} />
                    <InputError message={errors.car_model} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="car_type">Car Type (e.g., SUV, Sedan)</Label>
                    <Input id="car_type" value={data.car_type} onChange={(e) => setData("car_type", e.target.value)} />
                    <InputError message={errors.car_type} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="transmission">Transmission</Label>
                    <Input id="transmission" value={data.transmission} onChange={(e) => setData("transmission", e.target.value)} />
                    <InputError message={errors.transmission} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="price_per_day">Price Per Day (IDR)</Label>
                    <Input id="price_per_day" type="number" value={data.price_per_day} onChange={(e) => setData("price_per_day", e.target.value)} />
                    <InputError message={errors.price_per_day} className="mt-2" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Input id="fuel_type" value={data.fuel_type} onChange={(e) => setData("fuel_type", e.target.value)} />
                    <InputError message={errors.fuel_type} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" type="number" value={data.capacity} onChange={(e) => setData("capacity", e.target.value)} />
                    <InputError message={errors.capacity} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="trunk_size">Trunk Size</Label>
                    <Input id="trunk_size" type="number" value={data.trunk_size} onChange={(e) => setData("trunk_size", e.target.value)} />
                    <InputError message={errors.trunk_size} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={data.description} onChange={(e) => setData("description", e.target.value)} />
                    <InputError message={errors.description} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="features">Features</Label>
                    <Input id="features" placeholder="e.g., GPS, Bluetooth" value={data.features} onChange={(e) => setData("features", e.target.value)} />
                    <InputError message={errors.features} className="mt-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="thumbnail">Thumbnail</Label>
                      <Input id="thumbnail" type="file" onChange={(e) => setData("thumbnail", e.target.files[0])} />
                    </div>
                    <div>
                      <Label htmlFor="gallery">Gallery</Label>
                      <Input id="gallery" type="file" multiple onChange={(e) => setData("gallery", e.target.files)} />
                    </div>
                  </div>
                </div>
                <DialogFooter className="md:col-span-2">
                  <Button type="submit" disabled={processing}>Create Car</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit Availability for {selectedCar?.brand} {selectedCar?.car_model}</DialogTitle>
              </DialogHeader>
              {selectedCar && (
                <AvailabilityCalendar
                  carRental={selectedCar}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This will permanently delete <strong>{selectedCar?.brand} {selectedCar?.car_model}</strong>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <DangerButton onClick={deleteCar}>Delete</DangerButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Your Fleet</CardTitle>
                  <CardDescription>A list of all cars in your rental fleet.</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Car
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transmission</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carRentals.data.map((carItem) => (
                    <TableRow key={carItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <img
                            src={`/storage/${carItem.images.find(img => img.type === 'thumbnail')?.url}`}
                            alt={carItem.car_model}
                            className="w-16 h-12 object-cover rounded-md"
                          />
                          <div>
                            <p className="font-bold">{carItem.brand} {carItem.car_model}</p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Noticeable Category Column */}
                      <TableCell>
                        <Badge
                          className={`capitalize flex items-center gap-1 w-fit ${
                            carItem.category === 'exclusive'
                              ? 'bg-amber-500 text-white hover:bg-amber-600 border-none shadow-sm'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                          }`}
                        >
                          {carItem.category === 'exclusive' ? <Crown className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                          {carItem.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{carItem.car_type}</Badge>
                      </TableCell>
                      <TableCell>{carItem.transmission}</TableCell>
                      <TableCell>{carItem.capacity} People</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(carItem.price_per_day)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={route('admin.rentals.show', carItem.id)}>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={() => openEditor(carItem)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Availability
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(carItem)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination links={carRentals.links} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
