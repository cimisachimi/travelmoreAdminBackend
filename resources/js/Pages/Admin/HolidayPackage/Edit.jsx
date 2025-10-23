import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { ArrowLeft, Edit, Trash2, Upload, Package, Clock, DollarSign, Star, MapPin } from "lucide-react"; // Relevant icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { router } from "@inertiajs/react"; // Global router for actions
import React, { useEffect, useState } from "react"; // Import useEffect
import { Badge } from "@/Components/ui/badge"; // For displaying tags/category
// Add this line
import { toast } from 'sonner';
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- HELPER COMPONENTS ---
// --- Thumbnail Manager Component ---
const ThumbnailManager = ({ pkg }) => {
  // We don't need useForm here as we use router.post directly on change
  const [processing, setProcessing] = useState(false); // Local processing state
  const [thumbnailError, setThumbnailError] = useState(null); // Local error state

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProcessing(true);
      setThumbnailError(null); // Clear previous error
      router.post(
        route('admin.packages.thumbnail.update', pkg.id),
        { thumbnail: file, _method: 'POST' }, // Send file, ensure _method if needed (POST is default)
        {
          forceFormData: true, // IMPORTANT for file uploads with router.post
          onSuccess: () => {
            setProcessing(false);
            e.target.value = null; // Reset file input
            // Optionally show success toast
          },
          onError: (errors) => {
            setProcessing(false);
            // Extract the thumbnail error message
            setThumbnailError(errors.thumbnail || 'Failed to upload thumbnail.');
            e.target.value = null; // Reset file input
          },
          onFinish: () => {
            setProcessing(false); // Ensure processing is false on finish
          }
        }
      );
    }
  };

  // Function to trigger the hidden file input
  const triggerFileInput = () => document.getElementById('thumbnail-upload-input')?.click();

  // Find the current thumbnail URL
  const currentThumbnail = pkg.images?.find(img => img.type === 'thumbnail');
  const thumbnailUrl = currentThumbnail ? currentThumbnail.full_url : 'https://via.placeholder.com/1280x720/eee/ccc?text=No+Thumbnail'; // Use full_url accessor

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Thumbnail</CardTitle>
        <CardDescription>This image will be used as the primary display image.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative group aspect-video">
          {/* Display current thumbnail */}
          <img
            src={thumbnailUrl}
            alt={`${pkg.name} thumbnail`}
            className="w-full h-full object-cover rounded-lg"
          />
          {/* Overlay with Upload Button */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <Button onClick={triggerFileInput} disabled={processing}>
              <Upload className="mr-2 h-4 w-4" />
              {processing ? 'Uploading...' : 'Upload New Thumbnail'}
            </Button>
            {/* Hidden File Input */}
            <input
              id="thumbnail-upload-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*" // Suggest image files
            />
          </div>
        </div>
        {/* Display Thumbnail Upload Error */}
        {thumbnailError && <InputError message={thumbnailError} className="mt-2" />}
      </CardContent>
    </Card>
  );
};
// Component for Translation Fields
// --- HELPER COMPONENTS ---

// Component for Translation Fields (Corrected)
const TranslationFields = ({ locale, data, setData, errors }) => { // Accept main data and setData
  // Use setData directly to update the correct nested field
  const handleChange = (field, value) => {
    setData(field, {
      ...data[field], // Spread existing locales for this field (e.g., ...data.name)
      [locale]: value // Set the new value for the current locale (e.g., en: 'New Value')
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`name_${locale}`}>Package Name ({locale.toUpperCase()}) <span className="text-red-500">*</span></Label>
        <Input
          id={`name_${locale}`}
          // Access value: data.name['en'] or data.name['id']
          value={data.name?.[locale] || ''}
          // Call the corrected handleChange
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
          // Call the corrected handleChange
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
          // Call the corrected handleChange
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
          // Call the corrected handleChange
          onChange={e => handleChange('category', e.target.value)}
          className={errors?.[`category.${locale}`] ? 'border-red-500' : ''}
        />
        <InputError message={errors?.[`category.${locale}`]} className="mt-1" />
      </div>
    </div>
  );
};

const EditPackageForm = ({ pkg }) => {
  const getTranslation = (locale, field) => pkg.translations?.[locale]?.[field] || '';

  const { data, setData, post, processing, errors, reset } = useForm({
    // Non-translated fields
    duration: pkg.duration || '',
    price_regular: pkg.price_regular || '',
    price_exclusive: pkg.price_exclusive || '',
    price_child: pkg.price_child || '',
    rating: pkg.rating || '',
    map_url: pkg.map_url || '',
    // --- CHANGE: Initialize as arrays (or empty if null) ---
    itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
    cost: pkg.cost || { included: [], excluded: [] }, // Ensure object structure
    faqs: Array.isArray(pkg.faqs) ? pkg.faqs : [],
    trip_info: Array.isArray(pkg.trip_info) ? pkg.trip_info : [],

    // Translations (structure remains same)
    name: { en: getTranslation('en', 'name'), id: getTranslation('id', 'name') },
    description: { en: getTranslation('en', 'description'), id: getTranslation('id', 'description') },
    location: { en: getTranslation('en', 'location'), id: getTranslation('id', 'location') },
    category: { en: getTranslation('en', 'category'), id: getTranslation('id', 'category') },
    _method: 'PUT'
  });

  useEffect(() => {
    reset({
      duration: pkg.duration || '',
      price_regular: pkg.price_regular || '',
      price_exclusive: pkg.price_exclusive || '',
      price_child: pkg.price_child || '',
      rating: pkg.rating || '',
      map_url: pkg.map_url || '',
      // --- CHANGE: Reset with arrays ---
      itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
      cost: pkg.cost || { included: [], excluded: [] },
      faqs: Array.isArray(pkg.faqs) ? pkg.faqs : [],
      trip_info: Array.isArray(pkg.trip_info) ? pkg.trip_info : [],
      // Translations
      name: { en: getTranslation('en', 'name'), id: getTranslation('id', 'name') },
      description: { en: getTranslation('en', 'description'), id: getTranslation('id', 'description') },
      location: { en: getTranslation('en', 'location'), id: getTranslation('id', 'location') },
      category: { en: getTranslation('en', 'category'), id: getTranslation('id', 'category') },
      _method: 'PUT'
    });
  }, [pkg, reset]);

  const handleFieldChange = (field, value) => {
    setData(field, value);
  };

  const handleTranslationChange = (locale, field, value) => {
    setData(field, { ...data[field], [locale]: value });
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.packages.update', pkg.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Package updated successfully!'); // Add toast
      },
      onError: (errors) => {
        console.error("Update errors:", errors);
        toast.error('Failed to update package. Please check errors.'); // Add toast
      }
    });
  };


  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Tabs for different sections */}
      <Tabs defaultValue="core">
        <TabsList className="grid w-full grid-cols-3 mb-4"> {/* Adjusted grid cols */}
          <TabsTrigger value="core">Core Details</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="structured">Structured Data</TabsTrigger> {/* New Tab */}
        </TabsList>

        {/* Core Details Tab */}
        <TabsContent value="core">
          <Card>
            <CardHeader>
              <CardTitle>Core Details (Non-Translatable)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... Input fields for duration, prices, rating, map_url ... */}
              <div><Label htmlFor="duration">Duration (Days) <span className="text-red-500">*</span></Label><Input id="duration" type="number" value={data.duration} onChange={e => handleFieldChange('duration', e.target.value)} required className={errors.duration ? 'border-red-500' : ''} /><InputError message={errors.duration} className="mt-1" /></div>
              <div><Label htmlFor="price_regular">Regular Price (IDR) <span className="text-red-500">*</span></Label><Input id="price_regular" type="number" step="0.01" value={data.price_regular} onChange={e => handleFieldChange('price_regular', e.target.value)} required className={errors.price_regular ? 'border-red-500' : ''} /><InputError message={errors.price_regular} className="mt-1" /></div>
              <div><Label htmlFor="price_exclusive">Exclusive Price (IDR) <span className="text-red-500">*</span></Label><Input id="price_exclusive" type="number" step="0.01" value={data.price_exclusive} onChange={e => handleFieldChange('price_exclusive', e.target.value)} required className={errors.price_exclusive ? 'border-red-500' : ''} /><InputError message={errors.price_exclusive} className="mt-1" /></div>
              <div><Label htmlFor="price_child">Child Price (IDR)</Label><Input id="price_child" type="number" step="0.01" value={data.price_child} onChange={e => handleFieldChange('price_child', e.target.value)} className={errors.price_child ? 'border-red-500' : ''} /><InputError message={errors.price_child} className="mt-1" /></div>
              <div><Label htmlFor="rating">Rating (0-5)</Label><Input id="rating" type="number" step="0.1" min="0" max="5" value={data.rating} onChange={e => handleFieldChange('rating', e.target.value)} className={errors.rating ? 'border-red-500' : ''} /><InputError message={errors.rating} className="mt-1" /></div>
              <div><Label htmlFor="map_url">Map URL</Label><Input id="map_url" type="url" value={data.map_url} onChange={e => handleFieldChange('map_url', e.target.value)} className={errors.map_url ? 'border-red-500' : ''} /><InputError message={errors.map_url} className="mt-1" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translations Tab */}
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

        {/* Structured Data Tab (Using Repeaters) */}
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
      <Button type="submit" disabled={processing} className="mt-6">Save Package Changes</Button>
    </form>
  );
};

// Component for Managing Images
const GalleryManager = ({ pkg }) => {
  // Form for uploading new images
  const { data: imageData, setData: setImageData, post: postImages, processing: imageProcessing, errors: imageErrors, reset: resetImageForm } = useForm({
    images: [], // Expecting an array of files
  });

  const handleFileChange = (e) => {
    setImageData('images', Array.from(e.target.files));
  };

  const submitImages = (e) => {
    e.preventDefault();
    // Post to the store route, similar to CarRental but using 'packages' resource
    postImages(route('admin.packages.images.store', pkg.id), { // Adjust route name if needed
      preserveScroll: true,
      onSuccess: () => resetImageForm('images'), // Clear file input on success
    });
  };

  // Function to delete an image
  const deleteImage = (imageId) => {
    if (confirm('Are you sure you want to delete this image?')) {
      // Use Inertia's router.delete
      router.delete(route('admin.packages.images.destroy', { package: pkg.id, image: imageId }), { // Adjust route name and parameters
        preserveScroll: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Upload New Images</h3>
        <form onSubmit={submitImages} className="mt-2 flex items-center gap-4">
          <Input id="images" type="file" multiple onChange={handleFileChange} />
          <Button type="submit" disabled={imageProcessing || !imageData.images || imageData.images.length === 0}>
            <Upload className="mr-2 h-4 w-4" /> {imageProcessing ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
        {/* Display validation errors for images */}
        {imageErrors.images && <InputError message={imageErrors.images} className="mt-2" />}
        {Object.keys(imageErrors).filter(key => key.startsWith('images.')).map(key => (
          <InputError key={key} message={imageErrors[key]} className="mt-2" />
        ))}
      </div>
      <div>
        <h3 className="text-lg font-medium">Current Gallery</h3>
        {/* ✅ Check pkg.images exists and has items */}
        {pkg.images && pkg.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {pkg.images.map(image => (
              <div key={image.id} className="relative group aspect-square">
                {/* ✅ Use image.full_url generated by the accessor */}
                <img
                  src={image.full_url} // <-- Use the full URL here
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
        ) : <p className="text-muted-foreground mt-4">No images uploaded yet.</p>}
      </div>
    </div>
  );
};

// Repeater for Itinerary
const ItineraryRepeater = ({ items = [], setData, errors }) => {
  const handleItineraryChange = (index, field, value) => {
    const updatedItinerary = [...items];
    updatedItinerary[index] = { ...updatedItinerary[index], [field]: value };
    setData('itinerary', updatedItinerary);
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
                onChange={e => handleItineraryChange(index, 'day', e.target.value)}
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
    const updatedCosts = [...(costData[type] || [])];
    updatedCosts[index] = value;
    setData('cost', { ...costData, [type]: updatedCosts });
  };

  const addCostItem = (type) => {
    setData('cost', { ...costData, [type]: [...(costData[type] || []), ''] });
  };

  const removeCostItem = (type, index) => {
    setData('cost', { ...costData, [type]: (costData[type] || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Included */}
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
      {/* Excluded */}
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
    const updatedFaqs = [...items];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setData('faqs', updatedFaqs);
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
    const updatedInfo = [...items];
    updatedInfo[index] = { ...updatedInfo[index], [field]: value };
    setData('trip_info', updatedInfo);
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
// --- MAIN EDIT/SHOW COMPONENT (Modified Structure) ---
export default function EditHolidayPackage({ auth, package: pkg }) {
  const getCurrentTranslation = (field, fallback = 'N/A') => {
    return pkg.translations?.en?.[field] || pkg.translations?.id?.[field] || fallback;
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
            Edit: {getCurrentTranslation('name', pkg.id)}
          </h2>
        </div>
      }
    >
      <Head title={`Edit Package: ${getCurrentTranslation('name', pkg.id)}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Moved Thumbnail Manager outside tabs for prominence */}
          <ThumbnailManager pkg={pkg} />

          {/* Tabs for Editing Details and Gallery */}
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Package Settings</TabsTrigger>
              <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
            </TabsList>

            {/* Settings Tab (Now contains the EditPackageForm with its internal tabs) */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Package Details</CardTitle>
                  <CardDescription>Update the package information, including core details, translations, and structured data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditPackageForm pkg={pkg} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Gallery</CardTitle>
                  <CardDescription>Upload new images or delete existing ones for this package.</CardDescription>
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