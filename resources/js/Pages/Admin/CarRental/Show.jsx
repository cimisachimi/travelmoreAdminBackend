import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import InputError from "@/Components/InputError";
import { ArrowLeft, Edit, Trash2, Upload, Car, Luggage, Users, Gauge, Fuel } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/Components/ui/tooltip";
import { format, getYear, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, getMonth, isSameMonth } from 'date-fns';
import { router } from "@inertiajs/react"; // Global router for navigation/actions
import React, { useState, useMemo, useEffect } from "react"; // Import useEffect
import AvailabilityCalendar from "@/Components/AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Badge } from "@/Components/ui/badge";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS (DEFINED EXTERNALLY) ---

const YearlyCalendar = ({ availabilities }) => {
  const today = new Date();
  const currentYear = getYear(today);
  const currentMonthIndex = getMonth(today);
  const monthsRemaining = 12 - currentMonthIndex;
  const months = Array.from({ length: monthsRemaining }, (_, i) => new Date(currentYear, currentMonthIndex + i, 1));
  const availabilityMap = new Map(availabilities.map(a => [format(new Date(a.date), 'yyyy-MM-dd'), a.status]));
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
                        <div className={cn("h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium", colorClass, { "ring-2 ring-blue-500 ring-offset-1 ring-offset-background": isToday })}>
                          {format(day, 'd')}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>{format(day, 'MMMM d, yyyy')} - {status === 'default' ? 'Unavailable' : status.charAt(0).toUpperCase() + status.slice(1)}</p></TooltipContent>
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

const TranslationFields = ({ locale, translationsData, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor={`car_type_${locale}`}>Car Type</Label>
      <Input id={`car_type_${locale}`} value={translationsData[locale].car_type} onChange={e => onChange(locale, 'car_type', e.target.value)} />
    </div>
    <div>
      <Label htmlFor={`transmission_${locale}`}>Transmission</Label>
      <Input id={`transmission_${locale}`} value={translationsData[locale].transmission} onChange={e => onChange(locale, 'transmission', e.target.value)} />
    </div>
    <div>
      <Label htmlFor={`fuel_type_${locale}`}>Fuel Type</Label>
      <Input id={`fuel_type_${locale}`} value={translationsData[locale].fuel_type} onChange={e => onChange(locale, 'fuel_type', e.target.value)} />
    </div>
    <div>
      <Label htmlFor={`description_${locale}`}>Description</Label>
      <Textarea id={`description_${locale}`} value={translationsData[locale].description} onChange={e => onChange(locale, 'description', e.target.value)} rows={5} />
    </div>
    <div>
      <Label htmlFor={`features_${locale}`}>Features (comma-separated)</Label>
      <Input id={`features_${locale}`} value={translationsData[locale].features} onChange={e => onChange(locale, 'features', e.target.value)} />
    </div>
  </div>
);

const EditCarForm = ({ carRental }) => {
  const getTranslation = (locale) => carRental.translations?.find(t => t.locale === locale) || {};

  const { data, setData, put, processing, errors } = useForm({
    brand: carRental.brand || '',
    car_model: carRental.car_model || '',
    capacity: carRental.capacity || '',
    trunk_size: carRental.trunk_size || '',
    price_per_day: carRental.price_per_day || '',
    status: carRental.status || 'available',
    translations: {
      en: {
        description: getTranslation('en').description || '',
        car_type: getTranslation('en').car_type || '',
        transmission: getTranslation('en').transmission || '',
        fuel_type: getTranslation('en').fuel_type || '',
        features: (getTranslation('en').features || []).join(', '),
      },
      id: {
        description: getTranslation('id').description || '',
        car_type: getTranslation('id').car_type || '',
        transmission: getTranslation('id').transmission || '',
        fuel_type: getTranslation('id').fuel_type || '',
        features: (getTranslation('id').features || []).join(', '),
      }
    }
  });

  // ✅ FIXED: This useEffect hook listens for changes in the carRental prop.
  // When the prop updates after a save, it forces the form's state to be
  // re-initialized with the new data, ensuring the fields show the saved values.
  useEffect(() => {
    setData({
      brand: carRental.brand || '',
      car_model: carRental.car_model || '',
      capacity: carRental.capacity || '',
      trunk_size: carRental.trunk_size || '',
      price_per_day: carRental.price_per_day || '',
      status: carRental.status || 'available',
      translations: {
        en: {
          description: getTranslation('en').description || '',
          car_type: getTranslation('en').car_type || '',
          transmission: getTranslation('en').transmission || '',
          fuel_type: getTranslation('en').fuel_type || '',
          features: (getTranslation('en').features || []).join(', '),
        },
        id: {
          description: getTranslation('id').description || '',
          car_type: getTranslation('id').car_type || '',
          transmission: getTranslation('id').transmission || '',
          fuel_type: getTranslation('id').fuel_type || '',
          features: (getTranslation('id').features || []).join(', '),
        }
      }
    });
  }, [carRental]); // The dependency array makes this effect run whenever carRental changes

  const handleTranslationChange = (locale, field, value) => {
    setData('translations', {
      ...data.translations,
      [locale]: { ...data.translations[locale], [field]: value }
    });
  };

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.rentals.update', carRental.id), {
      preserveScroll: true,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Core Details (Non-Translatable)</CardTitle>
          <CardDescription>This information is the same for all languages.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label htmlFor="brand">Brand</Label><Input id="brand" value={data.brand} onChange={e => setData('brand', e.target.value)} /></div>
          <div><Label htmlFor="car_model">Car Model</Label><Input id="car_model" value={data.car_model} onChange={e => setData('car_model', e.target.value)} /></div>
          <div><Label htmlFor="capacity">Capacity (People)</Label><Input id="capacity" type="number" value={data.capacity} onChange={e => setData('capacity', e.target.value)} /></div>
          <div><Label htmlFor="trunk_size">Trunk Size (Bags)</Label><Input id="trunk_size" type="number" value={data.trunk_size} onChange={e => setData('trunk_size', e.target.value)} /></div>
          <div><Label htmlFor="price_per_day">Price Per Day (IDR)</Label><Input id="price_per_day" type="number" value={data.price_per_day} onChange={e => setData('price_per_day', e.target.value)} /></div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setData('status', value)} defaultValue={data.status}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Translatable Content</CardTitle>
          <CardDescription>Provide the text for both English and Indonesian.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="en" className="w-full">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="id">Indonesian</TabsTrigger></TabsList>
            <TabsContent value="en" className="mt-4"><TranslationFields locale="en" translationsData={data.translations} onChange={handleTranslationChange} /></TabsContent>
            <TabsContent value="id" className="mt-4"><TranslationFields locale="id" translationsData={data.translations} onChange={handleTranslationChange} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Button type="submit" disabled={processing}>Save All Changes</Button>
    </form>
  );
};

const GalleryManager = ({ carRental }) => {
  const { setData, post, processing, errors } = useForm({ gallery: [] });
  const handleFileChange = (e) => setData('gallery', Array.from(e.target.files));
  const submitImages = (e) => {
    e.preventDefault();
    post(route('admin.rentals.images.store', carRental.id), { onSuccess: () => e.target.reset() });
  };
  const deleteImage = (imageId) => {
    if (confirm('Are you sure you want to delete this image?')) {
      router.delete(route('admin.rentals.images.destroy', { carRental: carRental.id, image: imageId }));
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
                  <Button variant="destructive" size="icon" onClick={() => deleteImage(image.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground mt-4">No gallery images uploaded.</p>}
      </div>
    </div>
  );
};

const ThumbnailManager = ({ carRental }) => {
  const { processing, errors } = useForm({ thumbnail: null });
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      router.post(route('admin.rentals.thumbnail.update', carRental.id), { thumbnail: file }, { forceFormData: true });
    }
  };
  const triggerFileInput = () => document.getElementById('thumbnail-upload-input').click();
  const thumbnailUrl = carRental.images.find(img => img.type === 'thumbnail')?.url ? `/storage/${carRental.images.find(img => img.type === 'thumbnail').url}` : 'https://via.placeholder.com/1280x720';
  return (
    <div className="relative group aspect-video">
      <img src={thumbnailUrl} alt={carRental.car_model} className="w-full h-full object-cover rounded-lg" />
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
        <Button onClick={triggerFileInput} disabled={processing}><Upload className="mr-2 h-4 w-4" />{processing ? 'Uploading...' : 'Upload New Thumbnail'}</Button>
        <input id="thumbnail-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
      </div>
      <InputError message={errors.thumbnail} className="mt-2" />
    </div>
  );
};

// --- MAIN SHOW COMPONENT ---
export default function Show({ auth, carRental }) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const carRentalForEditor = useMemo(() => {
    if (!carRental) return null;
    return { ...carRental, availabilities: carRental.availabilities.filter(a => isSameMonth(new Date(a.date), currentMonth)) };
  }, [carRental, currentMonth]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'maintenance': return 'warning';
      default: return 'destructive';
    }
  };

  const description = carRental.translations?.find(t => t.locale === 'en')?.description || carRental.description;

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.rentals.index')}><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">{carRental.brand} {carRental.car_model}</h2>
        </div>
      }
    >
      <Head title={`Details for ${carRental.brand} ${carRental.car_model}`} />
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Edit Monthly Availability</DialogTitle></DialogHeader>
          {carRentalForEditor && <AvailabilityCalendar carRental={carRentalForEditor} month={currentMonth} onMonthChange={setCurrentMonth} />}
        </DialogContent>
      </Dialog>
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{carRental.brand} {carRental.car_model}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <CardDescription>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(carRental.price_per_day)} / day</CardDescription>
                  <Badge variant={getStatusVariant(carRental.status)} className="capitalize">{carRental.status}</Badge>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditorOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Availability</Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <ThumbnailManager carRental={carRental} />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-muted-foreground" /> <span>{carRental.car_type}</span></div>
                    <div className="flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /> <span>{carRental.capacity} People</span></div>
                    <div className="flex items-center gap-2"><Luggage className="h-5 w-5 text-muted-foreground" /> <span>{carRental.trunk_size} Bags</span></div>
                    <div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-muted-foreground" /> <span>{carRental.transmission}</span></div>
                    <div className="flex items-center gap-2"><Fuel className="h-5 w-5 text-muted-foreground" /> <span>{carRental.fuel_type}</span></div>
                  </div>
                  <div><h3 className="font-semibold mb-2">Description</h3><p className="text-muted-foreground text-sm">{description}</p></div>
                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <div className="flex flex-wrap gap-2">{carRental.features?.map((feature, index) => (<Badge key={index} variant="outline">{feature}</Badge>))}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="availability">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="availability">Availability</TabsTrigger><TabsTrigger value="bookings">Bookings</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
            <TabsContent value="availability">
              <Card>
                <CardHeader><CardTitle>Remaining Year Availability</CardTitle><CardDescription>An overview of this car's schedule for the rest of the year.</CardDescription></CardHeader>
                <CardContent><YearlyCalendar availabilities={carRental.availabilities} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bookings">
              <Card>
                <CardHeader><CardTitle>Recent Bookings</CardTitle><CardDescription>All bookings associated with this car rental.</CardDescription></CardHeader>
                <CardContent><p className="text-muted-foreground">No recent bookings to display.</p></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <div className="grid gap-6">
                <Card>
                  <CardHeader><CardTitle>Edit Details</CardTitle><CardDescription>Update the car's information. Click save when you're done.</CardDescription></CardHeader>
                  <CardContent><EditCarForm carRental={carRental} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Manage Gallery</CardTitle><CardDescription>Upload or delete gallery images for this car.</CardDescription></CardHeader>
                  <CardContent><GalleryManager carRental={carRental} /></CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}