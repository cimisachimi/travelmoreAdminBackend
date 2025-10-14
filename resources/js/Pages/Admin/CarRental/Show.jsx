import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import InputError from "@/Components/InputError";
import { ArrowLeft, Edit, Trash2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/Components/ui/tooltip";
// ✅ FIXED: Added isSameMonth to the import
import { format, getYear, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, getMonth, isSameMonth } from 'date-fns';
import { router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import AvailabilityCalendar from "@/Components/AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Badge } from "@/Components/ui/badge";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Yearly Calendar Component ---
const YearlyCalendar = ({ availabilities }) => {
  const today = new Date();
  const currentYear = getYear(today);
  const currentMonthIndex = getMonth(today);

  const monthsRemaining = 12 - currentMonthIndex;
  const months = Array.from({ length: monthsRemaining }, (_, i) => new Date(currentYear, currentMonthIndex + i, 1));

  const availabilityMap = new Map(
    availabilities.map(a => [format(new Date(a.date), 'yyyy-MM-dd'), a.status])
  );

  const statusColors = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    booked: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
      {months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const daysInMonthGrid = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startingDayIndex = getDay(monthStart);

        return (
          <div key={format(month, 'yyyy-MM')}>
            <h3 className="font-semibold text-center mb-3">{format(month, 'MMMM')}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`} className="font-bold text-muted-foreground">{day}</div>)}
              {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
              {daysInMonthGrid.map(day => {
                const dateString = format(day, 'yyyy-MM-dd');
                const status = availabilityMap.get(dateString) || 'default';
                const colorClass = statusColors[status];
                const isToday = isSameDay(day, new Date());

                return (
                  <TooltipProvider key={dateString} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium",
                          colorClass,
                          { "ring-2 ring-blue-500 ring-offset-1 ring-offset-background": isToday }
                        )}>
                          {format(day, 'd')}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(day, 'MMMM d, yyyy')} - {status === 'default' ? 'Unavailable' : status.charAt(0).toUpperCase() + status.slice(1)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Edit Form Component ---
const EditCarForm = ({ carRental }) => {
  const { data, setData, put, processing, errors } = useForm({
    brand: carRental.brand || '',
    car_model: carRental.car_model || '',
    price_per_day: carRental.price_per_day || '',
    description: carRental.description || '',
    availability: carRental.availability || 0,
    status: carRental.status || 'unavailable',
  });

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.rentals.update', carRental.id));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" value={data.brand} onChange={e => setData('brand', e.target.value)} />
          <InputError message={errors.brand} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="car_model">Car Model</Label>
          <Input id="car_model" value={data.car_model} onChange={e => setData('car_model', e.target.value)} />
          <InputError message={errors.car_model} className="mt-2" />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={data.description} onChange={e => setData('description', e.target.value)} rows={5} />
        <InputError message={errors.description} className="mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price_per_day">Price Per Day (IDR)</Label>
          <Input id="price_per_day" type="number" value={data.price_per_day} onChange={e => setData('price_per_day', e.target.value)} />
          <InputError message={errors.price_per_day} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="availability">Availability (Units)</Label>
          <Input id="availability" type="number" value={data.availability} onChange={e => setData('availability', e.target.value)} />
          <InputError message={errors.availability} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => setData('status', value)} defaultValue={data.status}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <InputError message={errors.status} className="mt-2" />
        </div>
      </div>
      <Button type="submit" disabled={processing}>Save Changes</Button>
    </form>
  );
};

// --- Gallery Management Component ---
const GalleryManager = ({ carRental }) => {
  const { setData, post, processing, errors } = useForm({
    gallery: [],
  });

  const handleFileChange = (e) => {
    setData('gallery', Array.from(e.target.files));
  };

  const submitImages = (e) => {
    e.preventDefault();
    post(route('admin.rentals.images.store', carRental.id), {
      onSuccess: () => e.target.reset()
    });
  };

  const deleteImage = (imageId) => {
    if (confirm('Are you sure you want to delete this image?')) {
      router.delete(route('admin.rentals.images.destroy', { carRentalId: carRental.id, imageId }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Upload New Images</h3>
        <form onSubmit={submitImages} className="mt-2 flex items-center gap-4">
          <Input id="gallery" type="file" multiple onChange={handleFileChange} />
          <Button type="submit" disabled={processing}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
        </form>
        <InputError message={errors.gallery} className="mt-2" />
      </div>
      <div>
        <h3 className="text-lg font-medium">Current Gallery</h3>
        {carRental.images.filter(img => img.type === 'gallery').length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {carRental.images.filter(img => img.type === 'gallery').map(image => (
              <div key={image.id} className="relative group">
                <img src={`/storage/${image.url}`} className="w-full h-auto object-cover rounded-lg aspect-square" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="destructive" size="icon" onClick={() => deleteImage(image.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-4">No gallery images uploaded.</p>
        )}
      </div>
    </div>
  );
};

// --- Main Show Component ---
export default function Show({ auth, carRental }) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const carRentalForEditor = useMemo(() => {
    if (!carRental) return null;
    return {
      ...carRental,
      availabilities: carRental.availabilities.filter(a =>
        isSameMonth(new Date(a.date), currentMonth)
      ),
    };
  }, [carRental, currentMonth]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'maintenance': return 'warning';
      default: return 'destructive';
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.rentals.index')}>
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {carRental.brand} {carRental.car_model}
          </h2>
        </div>
      }
    >
      <Head title={`Details for ${carRental.brand} ${carRental.car_model}`} />

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Monthly Availability</DialogTitle>
          </DialogHeader>
          {carRentalForEditor && (
            <AvailabilityCalendar
              carRental={carRentalForEditor}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{carRental.brand} {carRental.car_model}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <CardDescription>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(carRental.price_per_day)} / day
                  </CardDescription>
                  <Badge variant={getStatusVariant(carRental.status)} className="capitalize">{carRental.status}</Badge>
                  <span className="text-sm text-muted-foreground">{carRental.availability} units available</span>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditorOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Availability
              </Button>
            </CardHeader>
            <CardContent>
              <img
                src={carRental.images.find(img => img.type === 'thumbnail')?.url ? `/storage/${carRental.images.find(img => img.type === 'thumbnail').url}` : 'https://via.placeholder.com/1280x720'}
                alt={carRental.car_model}
                className="w-full h-auto object-cover rounded-lg aspect-video"
              />
            </CardContent>
          </Card>

          <Tabs defaultValue="availability">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Remaining Year Availability</CardTitle>
                  <CardDescription>An overview of this car's schedule for the rest of the year.</CardDescription>
                </CardHeader>
                <CardContent>
                  <YearlyCalendar availabilities={carRental.availabilities} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>All bookings associated with this car rental.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* TODO: Add booking data when available */}
                  <p className="text-muted-foreground">No recent bookings to display.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Details</CardTitle>
                    <CardDescription>Update the car's information. Click save when you're done.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EditCarForm carRental={carRental} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Gallery</CardTitle>
                    <CardDescription>Upload or delete gallery images for this car.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GalleryManager carRental={carRental} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}