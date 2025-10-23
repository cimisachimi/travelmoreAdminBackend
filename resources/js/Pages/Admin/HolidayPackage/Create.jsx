// resources/js/Pages/Admin/HolidayPackage/Create.jsx

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { ArrowLeft, Upload, Package, Clock, DollarSign, Star, MapPin } from "lucide-react"; // Relevant icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import React, { useState } from "react"; // Import useState for file preview

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS ---

// Component for Translation Fields
const TranslationFields = ({ locale, data, setData, errors }) => {
  const handleChange = (field, value) => {
    setData(field, {
      ...data[field],
      [locale]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`name_${locale}`}>Package Name ({locale.toUpperCase()}) <span className="text-red-500">*</span></Label>
        <Input
          id={`name_${locale}`}
          value={data.name?.[locale] || ''}
          onChange={e => handleChange('name', e.target.value)}
          required
          className={errors?.[`name.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`name.${locale}`]} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={`description_${locale}`}>Description ({locale.toUpperCase()})</Label>
        <Textarea
          id={`description_${locale}`}
          value={data.description?.[locale] || ''}
          onChange={e => handleChange('description', e.target.value)}
          rows={5}
          className={errors?.[`description.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`description.${locale}`]} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={`location_${locale}`}>Location ({locale.toUpperCase()})</Label>
        <Input
          id={`location_${locale}`}
          value={data.location?.[locale] || ''}
          onChange={e => handleChange('location', e.target.value)}
          className={errors?.[`location.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`location.${locale}`]} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={`category_${locale}`}>Category ({locale.toUpperCase()})</Label>
        <Input
          id={`category_${locale}`}
          value={data.category?.[locale] || ''}
          onChange={e => handleChange('category', e.target.value)}
          className={errors?.[`category.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`category.${locale}`]} className="mt-1" />
      </div>
    </div>
  );
};

// Component for Image Upload section
const ImageUploadManager = ({ data, setData, errors }) => {
  // State for image previews
  const [imagePreviews, setImagePreviews] = useState([]);

  // Handle file input change and update previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setData('images', files); // Store file objects in form data

    // Generate previews & clean up old ones
    imagePreviews.forEach(url => URL.revokeObjectURL(url)); // Clean up previous previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Clean up object URLs on component unmount
  React.useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviews]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Images</CardTitle>
        <CardDescription>Upload one or more images for the package gallery.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="images">Select Images</Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className={cn("mt-1", errors.images || Object.keys(errors).some(k => k.startsWith('images.')) ? 'border-red-500' : '')}
        />
        {/* Display image previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
            {imagePreviews.map((previewUrl, index) => (
              <img key={index} src={previewUrl} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover rounded" />
            ))}
          </div>
        )}
        <InputError message={errors.images} className="mt-1" />
        {/* Show errors for individual files if validation fails */}
        {Object.keys(errors).filter(key => key.startsWith('images.')).map(key => (
          <InputError key={key} message={errors[key]} className="mt-1" />
        ))}
      </CardContent>
    </Card>
  );
}

// --- MAIN CREATE COMPONENT ---
export default function CreateHolidayPackage({ auth }) {

  const { data, setData, post, processing, errors, reset } = useForm({
    // Initialize non-translated fields
    duration: '',
    price_regular: '',
    price_exclusive: '',
    price_child: '',
    rating: '',
    map_url: '',
    itinerary: '[]',
    cost: '{\n  "included": [],\n  "excluded": []\n}',
    faqs: '[]',
    trip_info: '[]',

    // Initialize translations
    name: { en: '', id: '' },
    description: { en: '', id: '' },
    location: { en: '', id: '' },
    category: { en: '', id: '' },

    // Initialize images field
    images: null,
  });

  // Handle submission
  const submit = (e) => {
    e.preventDefault();
    post(route('admin.packages.store'), {
      preserveScroll: true,
      onSuccess: () => reset(), // Reset form fields on successful creation
      onError: (errs) => {
        console.error("Form errors:", errs); // Log errors for debugging
        // Optional: Show a toast notification for errors
      }
    });
  };

  // Helper to check if a JSON field is valid
  const isJsonValid = (field) => {
    if (!data[field]) return true;
    try {
      JSON.parse(data[field]);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.packages.index')}>
            <Button variant="outline" size="icon" aria-label="Back to Packages">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Create New Holiday Package
          </h2>
        </div>
      }
    >
      <Head title="Create Holiday Package" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={submit} className="space-y-6">
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="core">Core Details</TabsTrigger>
                <TabsTrigger value="translations">Translations</TabsTrigger>
                <TabsTrigger value="json">JSON Data</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              {/* Core Details Tab */}
              <TabsContent value="core">
                <Card>
                  <CardHeader>
                    <CardTitle>Core Details (Non-Translatable)</CardTitle>
                    <CardDescription>Enter the main details for the package.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (Days) <span className="text-red-500">*</span></Label>
                      <Input id="duration" type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} required className={errors.duration ? 'border-red-500' : ''} />
                      <InputError message={errors.duration} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="price_regular">Regular Price (IDR) <span className="text-red-500">*</span></Label>
                      <Input id="price_regular" type="number" step="0.01" value={data.price_regular} onChange={e => setData('price_regular', e.target.value)} required className={errors.price_regular ? 'border-red-500' : ''} />
                      <InputError message={errors.price_regular} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="price_exclusive">Exclusive Price (IDR) <span className="text-red-500">*</span></Label>
                      <Input id="price_exclusive" type="number" step="0.01" value={data.price_exclusive} onChange={e => setData('price_exclusive', e.target.value)} required className={errors.price_exclusive ? 'border-red-500' : ''} />
                      <InputError message={errors.price_exclusive} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="price_child">Child Price (IDR)</Label>
                      <Input id="price_child" type="number" step="0.01" value={data.price_child} onChange={e => setData('price_child', e.target.value)} className={errors.price_child ? 'border-red-500' : ''} />
                      <InputError message={errors.price_child} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating (0-5)</Label>
                      <Input id="rating" type="number" step="0.1" min="0" max="5" value={data.rating} onChange={e => setData('rating', e.target.value)} className={errors.rating ? 'border-red-500' : ''} />
                      <InputError message={errors.rating} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="map_url">Map URL</Label>
                      <Input id="map_url" type="url" value={data.map_url} onChange={e => setData('map_url', e.target.value)} placeholder="https://maps.google.com/..." className={errors.map_url ? 'border-red-500' : ''} />
                      <InputError message={errors.map_url} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Translations Tab */}
              <TabsContent value="translations">
                <Card>
                  <CardHeader>
                    <CardTitle>Translatable Content</CardTitle>
                    <CardDescription>Provide details in both English and Indonesian.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="en_trans" className="w-full"> {/* Use different defaultValue to avoid conflict */}
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="en_trans">English</TabsTrigger>
                        <TabsTrigger value="id_trans">Indonesian</TabsTrigger>
                      </TabsList>
                      <TabsContent value="en_trans" className="mt-4">
                        <TranslationFields locale="en" data={data} setData={setData} errors={errors} />
                      </TabsContent>
                      <TabsContent value="id_trans" className="mt-4">
                        <TranslationFields locale="id" data={data} setData={setData} errors={errors} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JSON Data Tab */}
              <TabsContent value="json">
                <Card>
                  <CardHeader>
                    <CardTitle>Structured Data (JSON)</CardTitle>
                    <CardDescription>Enter details as valid JSON. Use online validators if unsure.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="itinerary">Itinerary (JSON)</Label>
                      <Textarea id="itinerary" value={data.itinerary} onChange={e => setData('itinerary', e.target.value)} rows={8} placeholder='[{"day": 1, "title": "...", "description": "..."}, ...]' className={errors.itinerary || !isJsonValid('itinerary') ? 'border-red-500' : ''} />
                      {!isJsonValid('itinerary') && <p className="text-sm text-red-600 mt-1">Invalid JSON format.</p>}
                      <InputError message={errors.itinerary} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost (JSON)</Label>
                      <Textarea id="cost" value={data.cost} onChange={e => setData('cost', e.target.value)} rows={5} placeholder='{"included": ["...", "..."], "excluded": ["...", "..."]}' className={errors.cost || !isJsonValid('cost') ? 'border-red-500' : ''} />
                      {!isJsonValid('cost') && <p className="text-sm text-red-600 mt-1">Invalid JSON format.</p>}
                      <InputError message={errors.cost} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="faqs">FAQs (JSON)</Label>
                      <Textarea id="faqs" value={data.faqs} onChange={e => setData('faqs', e.target.value)} rows={5} placeholder='[{"question": "...", "answer": "..."}, ...]' className={errors.faqs || !isJsonValid('faqs') ? 'border-red-500' : ''} />
                      {!isJsonValid('faqs') && <p className="text-sm text-red-600 mt-1">Invalid JSON format.</p>}
                      <InputError message={errors.faqs} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="trip_info">Trip Info (JSON)</Label>
                      <Textarea id="trip_info" value={data.trip_info} onChange={e => setData('trip_info', e.target.value)} rows={5} placeholder='[{"label": "...", "value": "...", "icon": "..."}, ...]' className={errors.trip_info || !isJsonValid('trip_info') ? 'border-red-500' : ''} />
                      {!isJsonValid('trip_info') && <p className="text-sm text-red-600 mt-1">Invalid JSON format.</p>}
                      <InputError message={errors.trip_info} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images">
                <ImageUploadManager data={data} setData={setData} errors={errors} />
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Create Package'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}