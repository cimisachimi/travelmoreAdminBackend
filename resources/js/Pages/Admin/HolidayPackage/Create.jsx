import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { ArrowLeft, Upload, Package, Clock, DollarSign, Star, MapPin, Plus, Trash2 } from "lucide-react"; // Added Plus and Trash2
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import React, { useState } from "react";
import { toast } from 'sonner'; // Added toast for feedback

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS ---

// [FIXED] Component for Translation Fields (to match Edit.jsx logic)
const TranslationFields = ({ locale, data, setData, errors }) => {
  const handleChange = (field, value) => {
    // Use dot-notation to set nested state, matching Edit.jsx
    setData(`${field}.${locale}`, value);
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
        {/* Show parent 'name' error on the 'en' tab for visibility */}
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
        {locale === 'en' && errors?.description && <InputError message={errors.description} className="mt-1" />}
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
        {locale === 'en' && errors?.location && <InputError message={errors.location} className="mt-1" />}
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
        {locale === 'en' && errors?.category && <InputError message={errors.category} className="mt-1" />}
      </div>
    </div>
  );
};

// Component for Image Upload section (Unchanged, but still needed)
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
        <CardTitle>Package Images</CardTitle>
        <CardDescription>Upload one or more images. The first image will be set as the thumbnail.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="images">Select Images <span className="text-red-500">*</span></Label>
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
        {Object.keys(errors).filter(key => key.startsWith('images.')).map(key => (
          <InputError key={key} message={errors[key]} className="mt-1" />
        ))}
      </CardContent>
    </Card>
  );
}

// --- [NEW] REPEATER COMPONENTS (Copied from Edit.jsx) ---

// Repeater for Itinerary
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
              <Label htmlFor={`itinerary_${index}_day`}>Day</Label>
              <Input
                id={`itinerary_${index}_day`}
                type="number"
                value={item.day || ''}
                onChange={e => handleItineraryChange(index, 'day', parseInt(e.target.value, 10) || '')}
                className={errors?.[`itinerary.${index}.day`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`itinerary.${index}.day`]} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={`itinerary_${index}_title`}>Title</Label>
              <Input
                id={`itinerary_${index}_title`}
                value={item.title || ''}
                onChange={e => handleItineraryChange(index, 'title', e.target.value)}
                className={errors?.[`itinerary.${index}.title`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`itinerary.${index}.title`]} className="mt-1" />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor={`itinerary_${index}_description`}>Description</Label>
              <Textarea
                id={`itinerary_${index}_description`}
                value={item.description || ''}
                onChange={e => handleItineraryChange(index, 'description', e.target.value)}
                rows={3}
                className={errors?.[`itinerary.${index}.description`] ? 'border-red-500' : ''}
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

// Repeater for Cost (Included/Excluded)
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
              placeholder="e.g., Hotel Accommodation"
              className={errors?.[`cost.included.${index}`] ? 'border-red-500' : ''}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeCostItem('included', index)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <InputError message={errors?.['cost.included']} className="mt-1" />
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
              placeholder="e.g., International Flights"
              className={errors?.[`cost.excluded.${index}`] ? 'border-red-500' : ''}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeCostItem('excluded', index)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <InputError message={errors?.['cost.excluded']} className="mt-1" />
        <Button type="button" variant="outline" size="sm" onClick={() => addCostItem('excluded')}>
          <Plus className="h-4 w-4 mr-1" /> Add Excluded
        </Button>
      </div>
    </div>
  );
};

// Repeater for FAQs
const FaqsRepeater = ({ items = [], setData, errors }) => {
  const handleFaqChange = (index, field, value) => {
    setData(`faqs.${index}.${field}`, value);
  };

  const addFaq = () => {
    setData('faqs', [...items, { question: '', answer: '' }]);
  };

  const removeFaq = (index) => {
    setData('faqs', items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="p-4 bg-muted/50 dark:bg-muted/30">
          <div className="space-y-3">
            <div>
              <Label htmlFor={`faq_${index}_question`}>Question</Label>
              <Input
                id={`faq_${index}_question`}
                value={item.question || ''}
                onChange={e => handleFaqChange(index, 'question', e.target.value)}
                className={errors?.[`faqs.${index}.question`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`faqs.${index}.question`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`faq_${index}_answer`}>Answer</Label>
              <Textarea
                id={`faq_${index}_answer`}
                value={item.answer || ''}
                onChange={e => handleFaqChange(index, 'answer', e.target.value)}
                rows={3}
                className={errors?.[`faqs.${index}.answer`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`faqs.${index}.answer`]} className="mt-1" />
            </div>
          </div>
          <div className="mt-2 text-right">
            <Button type="button" variant="destructive" size="sm" onClick={() => removeFaq(index)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove FAQ
            </Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addFaq}>
        <Plus className="h-4 w-4 mr-1" /> Add FAQ
      </Button>
    </div>
  );
};

// Repeater for Trip Info
const TripInfoRepeater = ({ items = [], setData, errors }) => {
  const handleInfoChange = (index, field, value) => {
    setData(`trip_info.${index}.${field}`, value);
  };

  const addInfoItem = () => {
    setData('trip_info', [...items, { label: '', value: '', icon: '' }]);
  };

  const removeInfoItem = (index) => {
    setData('trip_info', items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index} className="p-4 bg-muted/50 dark:bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`tripinfo_${index}_label`}>Label</Label>
              <Input
                id={`tripinfo_${index}_label`}
                value={item.label || ''}
                onChange={e => handleInfoChange(index, 'label', e.target.value)}
                className={errors?.[`trip_info.${index}.label`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`trip_info.${index}.label`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`tripinfo_${index}_value`}>Value</Label>
              <Input
                id={`tripinfo_${index}_value`}
                value={item.value || ''}
                onChange={e => handleInfoChange(index, 'value', e.target.value)}
                className={errors?.[`trip_info.${index}.value`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`trip_info.${index}.value`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`tripinfo_${index}_icon`}>Icon (Optional Emoji)</Label>
              <Input
                id={`tripinfo_${index}_icon`}
                value={item.icon || ''}
                onChange={e => handleInfoChange(index, 'icon', e.target.value)}
                placeholder="e.g., 👥"
                className={errors?.[`trip_info.${index}.icon`] ? 'border-red-500' : ''}
              />
              <InputError message={errors?.[`trip_info.${index}.icon`]} className="mt-1" />
            </div>
          </div>
          <div className="mt-2 text-right">
            <Button type="button" variant="destructive" size="sm" onClick={() => removeInfoItem(index)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove Info Item
            </Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addInfoItem}>
        <Plus className="h-4 w-4 mr-1" /> Add Info Item
      </Button>
    </div>
  );
};


// --- MAIN CREATE COMPONENT ---
export default function CreateHolidayPackage({ auth }) {

  const { data, setData, post, processing, errors, reset } = useForm({
    // Non-translated fields
    duration: '',
    price_regular: '',
    price_exclusive: '',
    price_child: '',
    rating: '',
    map_url: '',

    // [FIXED] Initialize JSON fields as objects/arrays, not strings
    itinerary: [],
    cost: { included: [], excluded: [] },
    faqs: [],
    trip_info: [],

    // Initialize translations (this structure was already correct)
    name: { en: '', id: '' },
    description: { en: '', id: '' },
    location: { en: '', id: '' },
    category: { en: '', id: '' },

    // Initialize images field
    images: null, // This will hold the FileList
  });

  // Handle submission
  const submit = (e) => {
    e.preventDefault();
    post(route('admin.packages.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset(); // Reset form fields on successful creation
        toast.success('Package created successfully!');
      },
      onError: (errs) => {
        console.error("Form errors:", errs);
        toast.error('Failed to create package. Please check errors.');
      }
    });
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
                <TabsTrigger value="structured">Structured Data</TabsTrigger> {/* [FIXED] Renamed tab */}
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              {/* Core Details Tab (Unchanged) */}
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
                      <Input id="map_url" type="url" value={data.map_url} onChange={e => setData('map_url', e.target.value)} placeholder="https://..." className={errors.map_url ? 'border-red-500' : ''} />
                      <InputError message={errors.map_url} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Translations Tab (Unchanged, but TranslationFields component is fixed) */}
              <TabsContent value="translations">
                <Card>
                  <CardHeader>
                    <CardTitle>Translatable Content</CardTitle>
                    <CardDescription>Provide details in both English and Indonesian.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="en_trans" className="w-full">
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

              {/* [FIXED] JSON Data Tab -> Structured Data Tab */}
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
                    <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
                    <CardContent><FaqsRepeater items={data.faqs} setData={setData} errors={errors} /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Trip Info Items</CardTitle></CardHeader>
                    <CardContent><TripInfoRepeater items={data.trip_info} setData={setData} errors={errors} /></CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Images Tab (Unchanged) */}
              <TabsContent value="images">
                <ImageUploadManager data={data} setData={setData} errors={errors} />
              </TabsContent>
            </Tabs>

            {/* Submit Button (Unchanged) */}
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