import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import Checkbox from "@/Components/Checkbox";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import React, { useState } from "react";
import { toast } from 'sonner';

// Import Reusable Components
// Note: Adjust the import path for PriceTiersRepeater if you moved it to a shared folder
import { PriceTiersRepeater } from '@/Pages/Admin/HolidayPackage/PriceTiersRepeater';
import AddonsRepeater from "@/Pages/Admin/Components/AddonsRepeater";

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS (Local) ---

const TranslationFields = ({ locale, data, setData, errors }) => {
  const handleChange = (field, value) => {
    setData(`${field}.${locale}`, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`name_${locale}`}>Trip Name ({locale.toUpperCase()}) <span className="text-red-500">*</span></Label>
        <Input
          id={`name_${locale}`}
          value={data.name?.[locale] || ''}
          onChange={e => handleChange('name', e.target.value)}
          required
          className={errors?.[`name.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`name.${locale}`]} className="mt-1" />
        {locale === 'en' && errors?.name && <InputError message={errors.name} className="mt-1" />}
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

const ImageUploadManager = ({ data, setData, errors }) => {
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setData('images', files);

    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  React.useEffect(() => {
    return () => imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Images</CardTitle>
        <CardDescription>Upload one or more images. The first image will be set as the thumbnail.</CardDescription>
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
        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
            {imagePreviews.map((previewUrl, index) => (
              <img key={index} src={previewUrl} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover rounded" />
            ))}
          </div>
        )}
        <InputError message={errors.images} className="mt-1" />
      </CardContent>
    </Card>
  );
}

const ItineraryRepeater = ({ items = [], setData, errors }) => {
  const handleItineraryChange = (index, field, value) => {
    setData(`itinerary.${index}.${field}`, value);
  };

  const addItineraryDay = () => {
    setData('itinerary', [...items, { day: items.length + 1, title: '', description: '' }]);
  };

  const removeItineraryDay = (index) => {
    setData('itinerary', items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="p-4 bg-muted/50 dark:bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label>Day</Label>
              <Input
                type="number"
                value={item.day || ''}
                onChange={e => handleItineraryChange(index, 'day', parseInt(e.target.value, 10) || '')}
              />
              <InputError message={errors?.[`itinerary.${index}.day`]} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input
                value={item.title || ''}
                onChange={e => handleItineraryChange(index, 'title', e.target.value)}
              />
              <InputError message={errors?.[`itinerary.${index}.title`]} className="mt-1" />
            </div>
            <div className="md:col-span-3">
              <Label>Description</Label>
              <Textarea
                value={item.description || ''}
                onChange={e => handleItineraryChange(index, 'description', e.target.value)}
                rows={3}
              />
              <InputError message={errors?.[`itinerary.${index}.description`]} className="mt-1" />
            </div>
          </div>
          <div className="mt-2 text-right">
            <Button type="button" variant="destructive" size="sm" onClick={() => removeItineraryDay(index)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove Day
            </Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addItineraryDay}>
        <Plus className="h-4 w-4 mr-1" /> Add Itinerary Day
      </Button>
    </div>
  );
};

const CostRepeater = ({ costData = { included: [], excluded: [] }, setData, errors }) => {
  const handleCostChange = (type, index, value) => {
    setData(`cost.${type}.${index}`, value);
  };

  const addCostItem = (type) => {
    const currentItems = costData[type] || [];
    setData(`cost.${type}`, [...currentItems, '']);
  };

  const removeCostItem = (type, index) => {
    const currentItems = costData[type] || [];
    setData(`cost.${type}`, currentItems.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h4 className="font-medium text-lg">Included Items</h4>
        {(costData.included || []).map((item, index) => (
          <div key={`inc-${index}`} className="flex items-center gap-2">
            <Input
              value={item || ''}
              onChange={e => handleCostChange('included', index, e.target.value)}
              placeholder="e.g., Transport"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeCostItem('included', index)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addCostItem('included')}>
          <Plus className="h-4 w-4 mr-1" /> Add Included
        </Button>
      </div>
      <div className="space-y-3">
        <h4 className="font-medium text-lg">Excluded Items</h4>
        {(costData.excluded || []).map((item, index) => (
          <div key={`exc-${index}`} className="flex items-center gap-2">
            <Input
              value={item || ''}
              onChange={e => handleCostChange('excluded', index, e.target.value)}
              placeholder="e.g., Personal Expense"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeCostItem('excluded', index)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addCostItem('excluded')}>
          <Plus className="h-4 w-4 mr-1" /> Add Excluded
        </Button>
      </div>
    </div>
  );
};

const MeetingPointsRepeater = ({ items = [], setData, errors }) => {
  const handleChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setData('meeting_points', newItems);
  };

  const addItem = () => {
    setData('meeting_points', [...items, '']);
  };

  const removeItem = (index) => {
    setData('meeting_points', items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
            <MapPin className="text-gray-400" size={16} />
            <Input
              value={item || ''}
              onChange={e => handleChange(index, e.target.value)}
              placeholder="e.g., Stasiun Gambir - 06:00 WIB"
              className={errors?.[`meeting_points.${index}`] ? 'border-red-500' : ''}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      ))}
      <InputError message={errors?.meeting_points} className="mb-2" />
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Add Meeting Point
      </Button>
    </div>
  );
};

// --- MAIN CREATE COMPONENT ---

export default function CreateOpenTrip({ auth }) {

  const { data, setData, post, processing, errors, reset } = useForm({
    is_active: false,
    duration: '',
    rating: '',
    map_url: '',

    // Complex structures
    price_tiers: [],
    itinerary: [],
    cost: { included: [], excluded: [] },
    meeting_points: [],
    addons: [], // ✅ NEW: Addons Field

    // Translations
    name: { en: '', id: '' },
    description: { en: '', id: '' },
    location: { en: '', id: '' },
    category: { en: '', id: '' },

    images: null,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.open-trips.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        toast.success('Open Trip created successfully!');
      },
      onError: (errs) => {
        console.error("Form errors:", errs);
        toast.error('Failed to create Open Trip. Please check errors.');
      }
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.open-trips.index')}>
            <Button variant="outline" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Create New Open Trip
          </h2>
        </div>
      }
    >
      <Head title="Create Open Trip" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={submit} className="space-y-6">

            {/* Publish Toggle */}
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                        />
                        <Label htmlFor="is_active" className="font-semibold cursor-pointer">
                            Publish to Frontend?
                        </Label>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="core">Core Details</TabsTrigger>
                <TabsTrigger value="translations">Translations</TabsTrigger>
                <TabsTrigger value="structured">Structured</TabsTrigger>
                <TabsTrigger value="addons">Add-ons</TabsTrigger> {/* ✅ NEW TAB */}
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              {/* Core Details */}
              <TabsContent value="core">
                <Card>
                  <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (Days) <span className="text-red-500">*</span></Label>
                      <Input id="duration" type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} required />
                      <InputError message={errors.duration} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating (0-5)</Label>
                      <Input id="rating" type="number" step="0.1" max="5" value={data.rating} onChange={e => setData('rating', e.target.value)} />
                      <InputError message={errors.rating} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="map_url">Map URL</Label>
                      <Input id="map_url" value={data.map_url} onChange={e => setData('map_url', e.target.value)} placeholder="https://..." />
                      <InputError message={errors.map_url} className="mt-1" />
                    </div>
                    <div className="col-span-2 mt-4">
                      <h3 className="font-medium mb-2">Price Tiers</h3>
                      <PriceTiersRepeater items={data.price_tiers} setData={setData} errors={errors} />
                      <InputError message={errors.price_tiers} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Translations */}
              <TabsContent value="translations">
                <Card>
                  <CardHeader><CardTitle>Translations</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="en">
                      <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="id">Indonesian</TabsTrigger></TabsList>
                      <TabsContent value="en" className="mt-4"><TranslationFields locale="en" data={data} setData={setData} errors={errors} /></TabsContent>
                      <TabsContent value="id" className="mt-4"><TranslationFields locale="id" data={data} setData={setData} errors={errors} /></TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Structured Data */}
              <TabsContent value="structured">
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
                    <CardContent><ItineraryRepeater items={data.itinerary} setData={setData} errors={errors} /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Cost Details</CardTitle></CardHeader>
                    <CardContent><CostRepeater costData={data.cost} setData={setData} errors={errors} /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Meeting Points</CardTitle></CardHeader>
                    <CardContent><MeetingPointsRepeater items={data.meeting_points} setData={setData} errors={errors} /></CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ✅ NEW: Add-ons Tab */}
              <TabsContent value="addons">
                <Card>
                    <CardHeader>
                        <CardTitle>Optional Add-ons</CardTitle>
                        <CardDescription>Configure extra services customers can select.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddonsRepeater
                            items={data.addons}
                            setData={setData}
                            errors={errors}
                        />
                    </CardContent>
                </Card>
              </TabsContent>

              {/* Images */}
              <TabsContent value="images">
                <ImageUploadManager data={data} setData={setData} errors={errors} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Open Trip'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
