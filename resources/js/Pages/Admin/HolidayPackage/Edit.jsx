import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { ArrowLeft, Edit, Trash2, Upload, Package, Clock, DollarSign, Star, MapPin, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { router } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { Badge } from "@/Components/ui/badge";
import { toast } from 'sonner';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS ---

// --- Thumbnail Manager Component ---
// (This component is unchanged from the previous answer)
const ThumbnailManager = ({ pkg }) => {
  const [processing, setProcessing] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProcessing(true);
      setThumbnailError(null);
      router.post(
        route('admin.packages.thumbnail.update', pkg.id),
        { thumbnail: file, _method: 'POST' },
        {
          forceFormData: true,
          onSuccess: () => {
            setProcessing(false);
            e.target.value = null;
            toast.success('Thumbnail updated successfully!');
          },
          onError: (errors) => {
            setProcessing(false);
            const errorMsg = errors.thumbnail || 'Failed to upload thumbnail.';
            setThumbnailError(errorMsg);
            toast.error(errorMsg);
            e.target.value = null;
          },
          onFinish: () => {
            setProcessing(false);
          }
        }
      );
    }
  };

  const triggerFileInput = () => document.getElementById('thumbnail-upload-input')?.click();

  const currentThumbnail = pkg.images?.find(img => img.type === 'thumbnail');
  const thumbnailUrl = currentThumbnail?.full_url || 'https://via.placeholder.com/1280x720/eee/ccc?text=No+Thumbnail';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Thumbnail</CardTitle>
        <CardDescription>Primary display image.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative group aspect-video">
          <img
            src={thumbnailUrl}
            alt={`${getCurrentTranslation(pkg, 'name', pkg.id)} thumbnail`}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <Button onClick={triggerFileInput} disabled={processing}>
              <Upload className="mr-2 h-4 w-4" />
              {processing ? 'Uploading...' : 'Upload New Thumbnail'}
            </Button>
            <input
              id="thumbnail-upload-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </div>
        </div>
        {thumbnailError && <InputError message={thumbnailError} className="mt-2" />}
      </CardContent>
    </Card>
  );
};


// --- Helper function to get translation safely ---
// (This component is unchanged from the previous answer)
const getCurrentTranslation = (pkg, field, fallback = '') => {
  return pkg?.translations?.en?.[field] || pkg?.translations?.id?.[field] || fallback;
};


// --- [FIXED] Component for Translation Fields ---
// This now reads/writes to data.name.en, data.description.en, etc.
const TranslationFields = ({ locale, data, setData, errors }) => {
  // Update the correct "field-first" nested structure
  const handleChange = (field, value) => {
    // Sets `name.en`, `description.en`, etc.
    setData(`${field}.${locale}`, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`name_${locale}`}>Package Name ({locale.toUpperCase()}) <span className="text-red-500">*</span></Label>
        <Input
          id={`name_${locale}`}
          // Access: data.name.en or data.name.id
          value={data.name?.[locale] || ''}
          onChange={e => handleChange('name', e.target.value)}
          required
          // Error key is `name.en` or `name.id`
          className={errors?.[`name.${locale}`] ? 'border-red-500' : ''}
        />
        {/* Show locale-specific error */}
        <InputError message={errors?.[`name.${locale}`]} className="mt-1" />
        {/* Show parent 'name' error on the 'en' tab for visibility */}
        {locale === 'en' && errors?.name && <InputError message={errors.name} className="mt-1" />}
      </div>

      <div>
        <Label htmlFor={`description_${locale}`}>Description ({locale.toUpperCase()})</Label>
        <Textarea
          id={`description_${locale}`}
          // Access: data.description.en
          value={data.description?.[locale] || ''}
          onChange={e => handleChange('description', e.target.value)}
          rows={5}
          // Error key is `description.en`
          className={errors?.[`description.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`description.${locale}`]} className="mt-1" />
        {locale === 'en' && errors?.description && <InputError message={errors.description} className="mt-1" />}
      </div>

      <div>
        <Label htmlFor={`location_${locale}`}>Location ({locale.toUpperCase()})</Label>
        <Input
          id={`location_${locale}`}
          // Access: data.location.en
          value={data.location?.[locale] || ''}
          onChange={e => handleChange('location', e.target.value)}
          // Error key is `location.en`
          className={errors?.[`location.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`location.${locale}`]} className="mt-1" />
        {locale === 'en' && errors?.location && <InputError message={errors.location} className="mt-1" />}
      </div>

      <div>
        <Label htmlFor={`category_${locale}`}>Category ({locale.toUpperCase()})</Label>
        <Input
          id={`category_${locale}`}
          // Access: data.category.en
          value={data.category?.[locale] || ''}
          onChange={e => handleChange('category', e.target.value)}
          // Error key is `category.en`
          className={errors?.[`category.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`category.${locale}`]} className="mt-1" />
        {locale === 'en' && errors?.category && <InputError message={errors.category} className="mt-1" />}
      </div>
    </div>
  );
};


// --- Repeater Components (Itinerary, Cost, Faqs, TripInfo) ---
// (These components are unchanged from the previous answer)
// ...
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
              <Input id={`itinerary_${index}_day`} type="number" value={item.day || ''} onChange={e => handleItineraryChange(index, 'day', parseInt(e.target.value, 10) || '')} className={errors?.[`itinerary.${index}.day`] ? 'border-red-500' : ''} />
              <InputError message={errors?.[`itinerary.${index}.day`]} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={`itinerary_${index}_title`}>Title</Label>
              <Input id={`itinerary_${index}_title`} value={item.title || ''} onChange={e => handleItineraryChange(index, 'title', e.target.value)} className={errors?.[`itinerary.${index}.title`] ? 'border-red-500' : ''} />
              <InputError message={errors?.[`itinerary.${index}.title`]} className="mt-1" />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor={`itinerary_${index}_description`}>Description</Label>
              <Textarea id={`itinerary_${index}_description`} value={item.description || ''} onChange={e => handleItineraryChange(index, 'description', e.target.value)} rows={3} className={errors?.[`itinerary.${index}.description`] ? 'border-red-500' : ''} />
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
// Cost Repeater
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
            <Input value={item || ''} onChange={e => handleCostChange('included', index, e.target.value)} placeholder="e.g., Hotel Accommodation" className={errors?.[`cost.included.${index}`] ? 'border-red-500' : ''} />
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
            <Input value={item || ''} onChange={e => handleCostChange('excluded', index, e.target.value)} placeholder="e.g., International Flights" className={errors?.[`cost.excluded.${index}`] ? 'border-red-500' : ''} />
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
// FAQs Repeater
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
              <Input id={`faq_${index}_question`} value={item.question || ''} onChange={e => handleFaqChange(index, 'question', e.target.value)} className={errors?.[`faqs.${index}.question`] ? 'border-red-500' : ''} />
              <InputError message={errors?.[`faqs.${index}.question`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`faq_${index}_answer`}>Answer</Label>
              <Textarea id={`faq_${index}_answer`} value={item.answer || ''} onChange={e => handleFaqChange(index, 'answer', e.target.value)} rows={3} className={errors?.[`faqs.${index}.answer`] ? 'border-red-500' : ''} />
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
// Trip Info Repeater
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
              <Input id={`tripinfo_${index}_label`} value={item.label || ''} onChange={e => handleInfoChange(index, 'label', e.target.value)} className={errors?.[`trip_info.${index}.label`] ? 'border-red-500' : ''} />
              <InputError message={errors?.[`trip_info.${index}.label`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`tripinfo_${index}_value`}>Value</Label>
              <Input id={`tripinfo_${index}_value`} value={item.value || ''} onChange={e => handleInfoChange(index, 'value', e.target.value)} className={errors?.[`trip_info.${index}.value`] ? 'border-red-500' : ''} />
              <InputError message={errors?.[`trip_info.${index}.value`]} className="mt-1" />
            </div>
            <div>
              <Label htmlFor={`tripinfo_${index}_icon`}>Icon (Optional Emoji)</Label>
              <Input id={`tripinfo_${index}_icon`} value={item.icon || ''} onChange={e => handleInfoChange(index, 'icon', e.target.value)} placeholder="e.g., 👥" className={errors?.[`trip_info.${index}.icon`] ? 'border-red-500' : ''} />
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
// ...
// --- End of Repeater Components ---

const safeParseJson = (jsonData, defaultValue) => {
  // If it's already a valid object/array (and not null), return it
  if (typeof jsonData === 'object' && jsonData !== null) {
    // Specifically check for cost structure if defaultValue indicates it
    if (Array.isArray(defaultValue) && Array.isArray(jsonData)) return jsonData;
    if (!Array.isArray(defaultValue) && !Array.isArray(jsonData)) {
      // Basic check for cost structure
      if (jsonData.hasOwnProperty('included') && jsonData.hasOwnProperty('excluded')) return jsonData;
      // If defaultValue is cost structure but jsonData isn't, return default
      if (defaultValue.hasOwnProperty('included') && defaultValue.hasOwnProperty('excluded')) return defaultValue;
      return jsonData; // Return other non-array objects
    }
    // Mismatch between array/object type, return default
    return defaultValue;
  }
  // If it's not a string or an empty string, return default
  if (typeof jsonData !== 'string' || !jsonData.trim()) {
    return defaultValue;
  }
  // Try parsing the string
  try {
    const parsed = JSON.parse(jsonData);
    // Ensure the parsed type matches the defaultValue type (array vs object)
    if (Array.isArray(defaultValue) && Array.isArray(parsed)) return parsed;
    if (!Array.isArray(defaultValue) && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      // Basic check for cost structure if needed
      if (defaultValue.hasOwnProperty('included') && defaultValue.hasOwnProperty('excluded')) {
        return (parsed.hasOwnProperty('included') && parsed.hasOwnProperty('excluded')) ? parsed : defaultValue;
      }
      return parsed; // Return other parsed objects
    }
    // Parsed type mismatch, return default
    return defaultValue;
  } catch (e) {
    console.error("Failed to parse JSON prop:", jsonData, e);
    return defaultValue; // Return default on parsing error
  }
};
// --- END OF MOVE ---
// --- [UPDATED] Main Edit Form Component ---
const EditPackageForm = ({ pkg }) => {
  // Helper to safely get translation data for initialization
  const getTranslationData = (locale, field) => pkg.translations?.[locale]?.[field] || '';

  const { data, setData, post, processing, errors, reset, isDirty } = useForm({
    // Non-translated fields
    duration: pkg.duration || '',
    price_regular: pkg.price_regular || '',
    price_exclusive: pkg.price_exclusive || '',
    price_child: pkg.price_child || '',
    rating: pkg.rating || '',
    map_url: pkg.map_url || '',

    // [FIXED] Initialize JSON fields robustly using safeParseJson
    itinerary: safeParseJson(pkg.itinerary, []),
    cost: safeParseJson(pkg.cost, { included: [], excluded: [] }),
    faqs: safeParseJson(pkg.faqs, []),
    trip_info: safeParseJson(pkg.trip_info, []),

    // Translatable fields
    name: {
      en: getTranslationData('en', 'name'),
      id: getTranslationData('id', 'name')
    },
    description: {
      en: getTranslationData('en', 'description'),
      id: getTranslationData('id', 'description')
    },
    location: {
      en: getTranslationData('en', 'location'),
      id: getTranslationData('id', 'location')
    },
    category: {
      en: getTranslationData('en', 'category'),
      id: getTranslationData('id', 'category')
    },

    _method: 'PUT'
  });
  // --- [NEW] Helper function to safely parse JSON or return default ---

  // Reset form if the package data prop changes
  useEffect(() => {
    reset({
      // Non-translated fields
      duration: pkg.duration || '',
      price_regular: pkg.price_regular || '',
      price_exclusive: pkg.price_exclusive || '',
      price_child: pkg.price_child || '',
      rating: pkg.rating || '',
      map_url: pkg.map_url || '',

      // [FIXED] Reset JSON fields robustly using safeParseJson
      itinerary: safeParseJson(pkg.itinerary, []),
      cost: safeParseJson(pkg.cost, { included: [], excluded: [] }),
      faqs: safeParseJson(pkg.faqs, []),
      trip_info: safeParseJson(pkg.trip_info, []),

      // Translatable fields
      name: {
        en: getTranslationData('en', 'name'),
        id: getTranslationData('id', 'name')
      },
      description: {
        en: getTranslationData('en', 'description'),
        id: getTranslationData('id', 'description')
      },
      location: {
        en: getTranslationData('en', 'location'),
        id: getTranslationData('id', 'location')
      },
      category: {
        en: getTranslationData('en', 'category'),
        id: getTranslationData('id', 'category')
      },

      _method: 'PUT'
    });
  }, [pkg, reset]);


  const submit = (e) => {
    e.preventDefault();
    post(route('admin.packages.update', pkg.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Package updated successfully!');
      },
      onError: (errs) => {
        console.error("Update errors:", errs);
        toast.error('Failed to update package. Please check errors.');
      }
    });
  };


  return (
    <form onSubmit={submit} className="space-y-6">
      <Tabs defaultValue="core">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="core">Core Details</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="structured">Structured Data</TabsTrigger>
        </TabsList>

        {/* Core Details Tab (Unchanged) */}
        <TabsContent value="core">
          <Card>
            <CardHeader>
              <CardTitle>Core Details (Non-Translatable)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="duration">Duration (Days) <span className="text-red-500">*</span></Label><Input id="duration" type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} required className={errors.duration ? 'border-red-500' : ''} /><InputError message={errors.duration} className="mt-1" /></div>
              <div><Label htmlFor="price_regular">Regular Price (IDR) <span className="text-red-500">*</span></Label><Input id="price_regular" type="number" step="0.01" value={data.price_regular} onChange={e => setData('price_regular', e.target.value)} required className={errors.price_regular ? 'border-red-500' : ''} /><InputError message={errors.price_regular} className="mt-1" /></div>
              <div><Label htmlFor="price_exclusive">Exclusive Price (IDR) <span className="text-red-500">*</span></Label><Input id="price_exclusive" type="number" step="0.01" value={data.price_exclusive} onChange={e => setData('price_exclusive', e.target.value)} required className={errors.price_exclusive ? 'border-red-500' : ''} /><InputError message={errors.price_exclusive} className="mt-1" /></div>
              <div><Label htmlFor="price_child">Child Price (IDR)</Label><Input id="price_child" type="number" step="0.01" value={data.price_child} onChange={e => setData('price_child', e.target.value)} className={errors.price_child ? 'border-red-500' : ''} /><InputError message={errors.price_child} className="mt-1" /></div>
              <div><Label htmlFor="rating">Rating (0-5)</Label><Input id="rating" type="number" step="0.1" min="0" max="5" value={data.rating} onChange={e => setData('rating', e.target.value)} className={errors.rating ? 'border-red-500' : ''} /><InputError message={errors.rating} className="mt-1" /></div>
              <div><Label htmlFor="map_url">Map URL</Label><Input id="map_url" type="url" value={data.map_url} onChange={e => setData('map_url', e.target.value)} className={errors.map_url ? 'border-red-500' : ''} /><InputError message={errors.map_url} className="mt-1" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translations Tab (Unchanged) */}
        <TabsContent value="translations">
          <Card>
            <CardHeader>
              <CardTitle>Translatable Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="en_trans">
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

        {/* Structured Data Tab (Repeaters - Unchanged) */}
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

      </Tabs>
      <Button type="submit" disabled={processing || !isDirty} className="mt-6">
        {processing ? 'Saving...' : 'Save Package Changes'}
      </Button>
    </form>
  );
};

// Component for Managing Images (Gallery)
// (This component is unchanged from the previous answer)
const GalleryManager = ({ pkg }) => {
  const { data: imageData, setData: setImageData, post: postImages, processing: imageProcessing, errors: imageErrors, reset: resetImageForm } = useForm({
    images: [],
  });
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageData('images', files);
    previews.forEach(URL.revokeObjectURL);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  const submitImages = (e) => {
    e.preventDefault();
    if (imageData.images.length === 0) return;
    postImages(route('admin.packages.images.store', pkg.id), {
      preserveScroll: true,
      onSuccess: () => {
        resetImageForm('images');
        setPreviews([]);
        toast.success('Images uploaded successfully!');
      },
      onError: (errs) => {
        console.error("Image upload errors:", errs);
        toast.error('Image upload failed. Check errors.');
      }
    });
  };

  const deleteImage = (imageId) => {
    if (confirm('Are you sure you want to delete this image?')) {
      router.delete(route('admin.packages.images.destroy', { package: pkg.id, image: imageId }), {
        preserveScroll: true,
        onSuccess: () => toast.success('Image deleted successfully!'),
        onError: () => toast.error('Failed to delete image.'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Upload New Gallery Images</h3>
        <form onSubmit={submitImages} className="mt-2 flex items-center gap-4">
          <Input id="images" type="file" multiple onChange={handleFileChange} accept="image/*" />
          <Button type="submit" disabled={imageProcessing || imageData.images.length === 0}>
            <Upload className="mr-2 h-4 w-4" /> {imageProcessing ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
            {previews.map((previewUrl, index) => (
              <img key={index} src={previewUrl} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover rounded" />
            ))}
          </div>
        )}
        {imageErrors.images && <InputError message={imageErrors.images} className="mt-2" />}
        {Object.keys(imageErrors).filter(key => key.startsWith('images.')).map(key => (
          <InputError key={key} message={imageErrors[key]} className="mt-2" />
        ))}
      </div>
      <div>
        <h3 className="text-lg font-medium">Current Gallery</h3>
        {pkg.images?.filter(img => img.type === 'gallery').length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {pkg.images.filter(img => img.type === 'gallery').map(image => (
              <div key={image.id} className="relative group aspect-square">
                <img
                  src={image.full_url}
                  alt="Package gallery image"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <Button variant="destructive" size="icon" onClick={() => deleteImage(image.id)} title="Delete Image">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground mt-4">No gallery images uploaded yet.</p>}
      </div>
    </div>
  );
};

// --- MAIN EDIT PAGE COMPONENT ---
// (This component is unchanged from the previous answer)
export default function EditHolidayPackage({ auth, package: pkg }) {
  const currentName = getCurrentTranslation(pkg, 'name', `Package #${pkg.id}`);

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
            Edit: {currentName}
          </h2>
        </div>
      }
    >
      <Head title={`Edit Package: ${currentName}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <ThumbnailManager pkg={pkg} />

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Package Settings</TabsTrigger>
              <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Package Details</CardTitle>
                  <CardDescription>Update package info, translations, and structured data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditPackageForm pkg={pkg} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Gallery Images</CardTitle>
                  <CardDescription>Upload new images or delete existing ones.</CardDescription>
                </CardHeader>
                <CardContent>
                  <GalleryManager pkg={pkg} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}