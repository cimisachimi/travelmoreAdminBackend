import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import Checkbox from "@/Components/Checkbox";
import {
  ArrowLeft, Upload, Trash2, Plus, Save,
  MapPin, Clock, Languages, Layers,
  Image as ImageIcon, ListChecks, DollarSign, Tag, CheckCircle2, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import React, { useState } from "react";
import { toast } from 'sonner';
import AddonsRepeater from "@/Pages/Admin/Components/AddonsRepeater";

// --- UTILS ---
const safeParseJson = (jsonData, defaultValue) => {
  if (typeof jsonData === 'object' && jsonData !== null) return jsonData;
  try {
    return JSON.parse(jsonData) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

// ✅ FIXED: Access 'en' or 'id' directly because translations is an Object on the Edit page
const getCurrentTranslation = (activity, field, fallback = '') => {
  return activity?.translations?.en?.[field] ||
         activity?.translations?.id?.[field] ||
         activity?.[field] ||
         fallback;
};

// --- SUB-COMPONENTS ---

// 1. Thumbnail Manager
const ThumbnailManager = ({ activity }) => {
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProcessing(true);
      router.post(
        route('admin.activities.thumbnail.update', activity.id),
        { thumbnail: file, _method: 'POST' },
        {
          forceFormData: true,
          onSuccess: () => {
            setProcessing(false);
            toast.success('Thumbnail updated successfully!');
            e.target.value = null;
          },
          onError: (errors) => {
            setProcessing(false);
            toast.error(errors.thumbnail || 'Failed to upload thumbnail.');
            e.target.value = null;
          }
        }
      );
    }
  };

  const thumbnailUrl = activity.thumbnail_url || 'https://via.placeholder.com/1280x720/eee/ccc?text=No+Thumbnail';

  return (
    <div className="group relative rounded-xl overflow-hidden border border-border shadow-sm bg-muted/20">
      <div className="aspect-video w-full relative">
        <img
          src={thumbnailUrl}
          alt="Thumbnail"
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <Button variant="secondary" className="cursor-pointer relative overflow-hidden" disabled={processing}>
                 <Upload className="w-4 h-4 mr-2" />
                 {processing ? 'Uploading...' : 'Change Thumbnail'}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
            </Button>
        </div>
      </div>
      <div className="p-3 bg-card border-t flex justify-between items-center">
          <div className="flex flex-col">
              <span className="text-sm font-semibold">Main Thumbnail</span>
              <span className="text-xs text-muted-foreground">Used on listing cards</span>
          </div>
          <Badge variant="outline">16:9 Aspect</Badge>
      </div>
    </div>
  );
};

// 2. Translatable Field Group
const TranslatableField = ({ label, id, valueEn, valueId, onChange, errorEn, errorId, required = false, type = 'input', rows = 3 }) => {
    return (
        <div className="space-y-3 p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <Label className="font-semibold text-base">{label} {required && <span className="text-red-500">*</span>}</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}_en`} className="text-xs text-muted-foreground uppercase font-bold tracking-wider">English (EN)</Label>
                    {type === 'textarea' ? (
                        <Textarea id={`${id}_en`} value={valueEn} onChange={e => onChange('en', e.target.value)} rows={rows} className={errorEn ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Enter ${label} in English...`} />
                    ) : (
                        <Input id={`${id}_en`} value={valueEn} onChange={e => onChange('en', e.target.value)} className={errorEn ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Enter ${label} in English...`} />
                    )}
                    {errorEn && <p className="text-xs text-red-500 font-medium">{errorEn}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}_id`} className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Indonesian (ID)</Label>
                    {type === 'textarea' ? (
                        <Textarea id={`${id}_id`} value={valueId} onChange={e => onChange('id', e.target.value)} rows={rows} className={errorId ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Masukkan ${label} dalam Bahasa Indonesia...`} />
                    ) : (
                        <Input id={`${id}_id`} value={valueId} onChange={e => onChange('id', e.target.value)} className={errorId ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Masukkan ${label} dalam Bahasa Indonesia...`} />
                    )}
                    {errorId && <p className="text-xs text-red-500 font-medium">{errorId}</p>}
                </div>
            </div>
        </div>
    );
};

// --- MAIN FORM ---
const EditActivityForm = ({ activity }) => {
  const getTrans = (locale, field) => activity.translations?.[locale]?.[field] || '';

  const { data, setData, put, processing, errors, isDirty } = useForm({
    is_active: Boolean(activity.is_active),
    price: activity.price || 0,
    status: activity.status || "active",
    duration: activity.duration || "",
    google_map_url: activity.google_map_url || "",
    includes: safeParseJson(activity.includes, { included: [], excluded: [] }),
    addons: safeParseJson(activity.addons, []),

    // Translations structure specifically for ActivityController
    translations: {
        en: {
            name: activity.translations?.en?.name || "",
            description: activity.translations?.en?.description || "",
            location: activity.translations?.en?.location || "",
            category: activity.translations?.en?.category || "",
            itinerary: activity.translations?.en?.itinerary || "",
            notes: activity.translations?.en?.notes || ""
        },
        id: {
            name: activity.translations?.id?.name || "",
            description: activity.translations?.id?.description || "",
            location: activity.translations?.id?.location || "",
            category: activity.translations?.id?.category || "",
            itinerary: activity.translations?.id?.itinerary || "",
            notes: activity.translations?.id?.notes || ""
        }
    }
  });

  const handleTransChange = (locale, field, value) => {
    setData('translations', {
        ...data.translations,
        [locale]: {
            ...data.translations[locale],
            [field]: value
        }
    });
  };

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.activities.update', activity.id), {
      preserveScroll: true,
      onSuccess: () => toast.success('Activity updated successfully!'),
      onError: (err) => {
        console.error(err);
        toast.error('Failed to update activity. Please check form errors.');
      }
    });
  };

  // Handle Includes/Excludes (Same logic as HolidayPackage)
  const handleIncludes = (type, action, index, value) => {
      const currentList = data.includes[type] || [];
      if (action === 'add') {
          setData('includes', { ...data.includes, [type]: [...currentList, ''] });
      } else if (action === 'remove') {
          setData('includes', { ...data.includes, [type]: currentList.filter((_, i) => i !== index) });
      } else if (action === 'update') {
          const newList = [...currentList];
          newList[index] = value;
          setData('includes', { ...data.includes, [type]: newList });
      }
  };

  const scrollToSection = (id) => {
      const element = document.getElementById(id);
      if(element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form onSubmit={submit} className="flex flex-col lg:flex-row gap-8 items-start relative">

        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="hidden lg:block w-64 sticky top-6 space-y-6 shrink-0">
            <Card className="shadow-sm border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Contents</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 p-2">
                    {[
                        { id: 'section-core', icon: Layers, label: 'Core Details' },
                        { id: 'section-trans', icon: Languages, label: 'Translations' },
                        { id: 'section-includes', icon: ListChecks, label: 'Inclusions' },
                        { id: 'section-addons', icon: Tag, label: 'Add-ons' },
                    ].map(item => (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className="justify-start font-normal w-full"
                            type="button"
                            onClick={() => scrollToSection(item.id)}
                        >
                            <item.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                            {item.label}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 space-y-8 w-full pb-24">

            {/* Publish / Draft Toggle Card */}
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
                    <p className="text-sm text-gray-500 mt-1 ml-6">
                        If unchecked, this activity will be saved as a <strong>Draft</strong> and will not be visible to customers.
                    </p>
                </CardContent>
            </Card>

            {/* 1. CORE DETAILS */}
            <section id="section-core" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Layers className="text-primary" />
                    <h3 className="text-xl font-bold">Core Information</h3>
                </div>
                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <Label>Price (IDR)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">Rp</span>
                                <Input type="number" className="pl-9" value={data.price} onChange={e => setData('price', e.target.value)} />
                            </div>
                            <InputError message={errors.price} />
                         </div>
                         <div className="space-y-2">
                            <Label>Duration</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" value={data.duration} onChange={e => setData('duration', e.target.value)} placeholder="e.g. 2 Hours, Full Day" />
                            </div>
                            <InputError message={errors.duration} />
                         </div>
                         <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <Label>Google Map URL</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="url" className="pl-9" placeholder="https://maps.google.com/..." value={data.google_map_url} onChange={e => setData('google_map_url', e.target.value)} />
                            </div>
                             <InputError message={errors.google_map_url} />
                         </div>
                    </CardContent>
                </Card>
            </section>

            {/* 2. TRANSLATIONS */}
            <section id="section-trans" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Languages className="text-primary" />
                    <h3 className="text-xl font-bold">Translations</h3>
                </div>
                <div className="space-y-4">
                    <TranslatableField
                        label="Activity Name" id="name" required
                        valueEn={data.translations.en.name} valueId={data.translations.id.name}
                        onChange={(l, v) => handleTransChange(l, 'name', v)}
                        errorEn={errors['translations.en.name']} errorId={errors['translations.id.name']}
                    />
                    <TranslatableField
                        label="Description" id="desc" type="textarea"
                        valueEn={data.translations.en.description} valueId={data.translations.id.description}
                        onChange={(l, v) => handleTransChange(l, 'description', v)}
                        errorEn={errors['translations.en.description']} errorId={errors['translations.id.description']}
                    />
                    <TranslatableField
                        label="Location" id="loc"
                        valueEn={data.translations.en.location} valueId={data.translations.id.location}
                        onChange={(l, v) => handleTransChange(l, 'location', v)}
                        errorEn={errors['translations.en.location']} errorId={errors['translations.id.location']}
                    />
                    <TranslatableField
                        label="Category" id="cat"
                        valueEn={data.translations.en.category} valueId={data.translations.id.category}
                        onChange={(l, v) => handleTransChange(l, 'category', v)}
                        errorEn={errors['translations.en.category']} errorId={errors['translations.id.category']}
                    />
                    {/* Activity Specific: Itinerary Text & Notes */}
                    <TranslatableField
                        label="Itinerary Details" id="itinerary" type="textarea" rows={5}
                        valueEn={data.translations.en.itinerary} valueId={data.translations.id.itinerary}
                        onChange={(l, v) => handleTransChange(l, 'itinerary', v)}
                        errorEn={errors['translations.en.itinerary']} errorId={errors['translations.id.itinerary']}
                    />
                    <TranslatableField
                        label="Important Notes" id="notes" type="textarea"
                        valueEn={data.translations.en.notes} valueId={data.translations.id.notes}
                        onChange={(l, v) => handleTransChange(l, 'notes', v)}
                        errorEn={errors['translations.en.notes']} errorId={errors['translations.id.notes']}
                    />
                </div>
            </section>

            {/* 3. INCLUSIONS & EXCLUSIONS */}
            <section id="section-includes" className="space-y-4 scroll-mt-24">
                 <div className="flex items-center gap-2 pb-2 border-b">
                    <ListChecks className="text-primary" />
                    <h3 className="text-xl font-bold">Inclusions & Exclusions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* INCLUDED */}
                    <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3"><CardTitle className="text-base text-green-700 dark:text-green-400">✅ What's Included</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {data.includes?.included?.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input value={item} onChange={e => handleIncludes('included', 'update', idx, e.target.value)} className="bg-white dark:bg-card" />
                                    <Button type="button" variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleIncludes('included', 'remove', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleIncludes('included', 'add')}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </CardContent>
                    </Card>
                    {/* EXCLUDED */}
                    <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <CardHeader className="pb-3"><CardTitle className="text-base text-red-700 dark:text-red-400">❌ What's Excluded</CardTitle></CardHeader>
                         <CardContent className="space-y-2">
                            {data.includes?.excluded?.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input value={item} onChange={e => handleIncludes('excluded', 'update', idx, e.target.value)} className="bg-white dark:bg-card" />
                                    <Button type="button" variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleIncludes('excluded', 'remove', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleIncludes('excluded', 'add')}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* 4. ADD-ONS */}
            <section id="section-addons" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Tag className="text-primary" />
                    <h3 className="text-xl font-bold">Add-ons</h3>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <AddonsRepeater
                            items={data.addons}
                            setData={setData}
                            errors={errors}
                        />
                    </CardContent>
                </Card>
            </section>

        </div>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md p-4 shadow-2xl">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    {isDirty ? (
                        <Badge variant="destructive" className="animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" /> Unsaved Changes
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> All Saved
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                    <Button type="submit" size="lg" className="min-w-[150px] shadow-md" disabled={processing}>
                        {processing ? (
                            <>
                                <span className="animate-spin mr-2 text-lg">⟳</span> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    </form>
  );
};

// --- GALLERY MANAGER ---
const GalleryManager = ({ activity }) => {
  const { data, setData, post, processing, reset } = useForm({ gallery: [] });
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setData('gallery', files);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const submitImages = (e) => {
    e.preventDefault();
    if (data.gallery.length === 0) return;
    post(route('admin.activities.gallery.store', activity.id), {
      preserveScroll: true,
      onSuccess: () => { reset('gallery'); setPreviews([]); toast.success('Gallery updated!'); },
      onError: () => toast.error('Upload failed.')
    });
  };

  const deleteImage = (imageId) => {
    if (confirm('Delete this image?')) {
      router.delete(route('admin.activities.images.destroy', { activity: activity.id, image: imageId }), {
        preserveScroll: true,
        onSuccess: () => toast.success('Image deleted.'),
      });
    }
  };

  const galleryImages = activity.images_url.filter(img => img.type === 'gallery');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="md:col-span-1 space-y-4">
             <Card className="border-dashed border-2">
                 <CardHeader><CardTitle className="text-base">Upload New Images</CardTitle></CardHeader>
                 <CardContent>
                     <form onSubmit={submitImages} className="space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer relative">
                             <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                             <span className="text-sm text-muted-foreground font-medium">Click to select files</span>
                             <input type="file" multiple onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {previews.map((src, i) => <img key={i} src={src} className="h-16 w-full object-cover rounded shadow-sm" />)}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={processing || data.gallery.length === 0}>
                            {processing ? 'Uploading...' : 'Upload Selected'}
                        </Button>
                     </form>
                 </CardContent>
             </Card>
        </div>
        <div className="md:col-span-2">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                     <ImageIcon className="w-5 h-5 text-primary" /> Gallery ({galleryImages.length})
                 </h3>
             </div>
             {galleryImages.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((img) => (
                        <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border shadow-sm">
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="destructive" size="icon" onClick={() => deleteImage(img.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-48 bg-muted/10 rounded-lg border border-dashed">
                     <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                     <p className="text-muted-foreground">No gallery images found.</p>
                 </div>
             )}
        </div>
    </div>
  );
};


// --- PAGE COMPONENT ---
export default function Edit({ auth, activity }) {
  const currentName = getCurrentTranslation(activity, 'name', `Activity #${activity.id}`);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
                <Link href={route('admin.activities.index')}>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="font-bold text-xl text-foreground leading-tight">{currentName}</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {activity.id}</p>
                </div>
           </div>
           {/* Optional: Add "Delete Activity" button here if strictly needed, or keep in index */}
        </div>
      }
    >
      <Head title={`Edit: ${currentName}`} />

      <div className="py-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* TOP SECTION: THUMBNAIL & QUICK STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                 <ThumbnailManager activity={activity} />
              </div>
              <div className="lg:col-span-3">
                 <Card className="h-full flex flex-col justify-center border-none shadow-none bg-transparent">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-card border rounded-lg shadow-sm">
                            <div className="text-muted-foreground text-xs uppercase font-bold">Duration</div>
                            <div className="text-2xl font-bold">{activity.duration || '-'}</div>
                        </div>
                         <div className="p-4 bg-card border rounded-lg shadow-sm">
                             <div className="text-muted-foreground text-xs uppercase font-bold">Gallery</div>
                             <div className="text-2xl font-bold">{activity.images_url?.length - 1 || 0} <span className="text-sm font-normal text-muted-foreground">Photos</span></div>
                        </div>
                        <div className="p-4 bg-card border rounded-lg shadow-sm">
                            <div className="text-muted-foreground text-xs uppercase font-bold">Status</div>
                            <div className="text-2xl font-bold capitalize">{activity.is_active ? 'Active' : 'Draft'}</div>
                        </div>
                     </div>
                 </Card>
              </div>
          </div>

          <Separator />

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all">
                    Details & Content
                </TabsTrigger>
                <TabsTrigger value="gallery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all">
                    Media Gallery
                </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
                 <EditActivityForm activity={activity} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
                 <GalleryManager activity={activity} />
            </TabsContent>
          </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
