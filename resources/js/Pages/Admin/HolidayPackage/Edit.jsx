import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import Checkbox from "@/Components/Checkbox"; // ✅ Added Checkbox Import
import {
  ArrowLeft, Upload, Trash2, Plus, Save,
  MapPin, Clock, Star, Languages, Layers,
  Image as ImageIcon, ListChecks, DollarSign, HelpCircle, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import { ScrollArea } from "@/Components/ui/scroll-area";
import React, { useEffect, useState } from "react";
import { toast } from 'sonner';
import { PriceTiersRepeater } from '@/Pages/Admin/HolidayPackage/PriceTiersRepeater';

// --- UTILS ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

const safeParseJson = (jsonData, defaultValue) => {
  if (typeof jsonData === 'object' && jsonData !== null) {
    if (Array.isArray(defaultValue) && Array.isArray(jsonData)) return jsonData;
    if (!Array.isArray(defaultValue) && !Array.isArray(jsonData)) {
       if (defaultValue.hasOwnProperty('included') && defaultValue.hasOwnProperty('excluded')) {
        return (jsonData.hasOwnProperty('included') && jsonData.hasOwnProperty('excluded')) ? jsonData : defaultValue;
      }
      return jsonData;
    }
    return defaultValue;
  }
  if (typeof jsonData !== 'string' || !jsonData.trim()) return defaultValue;
  try {
    const parsed = JSON.parse(jsonData);
    if (Array.isArray(defaultValue) && Array.isArray(parsed)) return parsed;
    if (!Array.isArray(defaultValue) && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      if (defaultValue.hasOwnProperty('included') && defaultValue.hasOwnProperty('excluded')) {
        return (parsed.hasOwnProperty('included') && parsed.hasOwnProperty('excluded')) ? parsed : defaultValue;
      }
      return parsed;
    }
    return defaultValue;
  } catch (e) {
    console.error("Failed to parse JSON prop:", jsonData, e);
    return defaultValue;
  }
};

const getCurrentTranslation = (pkg, field, fallback = '') => {
  return pkg?.translations?.en?.[field] || pkg?.translations?.id?.[field] || fallback;
};

// --- SUB-COMPONENTS ---

// 1. Thumbnail Manager
const ThumbnailManager = ({ pkg }) => {
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProcessing(true);
      router.post(
        route('admin.packages.thumbnail.update', pkg.id),
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

  const currentThumbnail = pkg.images?.find(img => img.type === 'thumbnail');
  const thumbnailUrl = currentThumbnail?.full_url || 'https://via.placeholder.com/1280x720/eee/ccc?text=No+Thumbnail';

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
const TranslatableField = ({ label, id, valueEn, valueId, onChange, errorEn, errorId, required = false, type = 'input' }) => {
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
                        <Textarea id={`${id}_en`} value={valueEn} onChange={e => onChange('en', e.target.value)} rows={4} className={errorEn ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Enter ${label} in English...`} />
                    ) : (
                        <Input id={`${id}_en`} value={valueEn} onChange={e => onChange('en', e.target.value)} className={errorEn ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Enter ${label} in English...`} />
                    )}
                    {errorEn && <p className="text-xs text-red-500 font-medium">{errorEn}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`${id}_id`} className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Indonesian (ID)</Label>
                    {type === 'textarea' ? (
                        <Textarea id={`${id}_id`} value={valueId} onChange={e => onChange('id', e.target.value)} rows={4} className={errorId ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Masukkan ${label} dalam Bahasa Indonesia...`} />
                    ) : (
                        <Input id={`${id}_id`} value={valueId} onChange={e => onChange('id', e.target.value)} className={errorId ? 'border-red-500 focus-visible:ring-red-500' : ''} placeholder={`Masukkan ${label} dalam Bahasa Indonesia...`} />
                    )}
                    {errorId && <p className="text-xs text-red-500 font-medium">{errorId}</p>}
                </div>
            </div>
        </div>
    );
};

// 3. Compact Repeater Item Wrapper
const RepeaterItem = ({ title, children, onDelete, index }) => (
    <div className="relative border rounded-lg bg-card p-4 shadow-sm group hover:border-primary/50 transition-colors">
        <div className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={onDelete} type="button">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
        {title && <div className="mb-3 pr-8"><h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title} #{index + 1}</h4></div>}
        {children}
    </div>
);

// --- MAIN FORM ---
const EditPackageForm = ({ pkg }) => {
  const getTrans = (locale, field) => pkg.translations?.[locale]?.[field] || '';

  const { data, setData, post, processing, errors, isDirty } = useForm({
    // ✅ Include is_active in useForm
    is_active: Boolean(pkg.is_active),

    duration: pkg.duration || '',
    price_tiers: pkg.price_tiers || [],
    rating: pkg.rating || '',
    map_url: pkg.map_url || '',
    itinerary: safeParseJson(pkg.itinerary, []),
    cost: safeParseJson(pkg.cost, { included: [], excluded: [] }),
    faqs: safeParseJson(pkg.faqs, []),
    trip_info: safeParseJson(pkg.trip_info, []),
    name: { en: getTrans('en', 'name'), id: getTrans('id', 'name') },
    description: { en: getTrans('en', 'description'), id: getTrans('id', 'description') },
    location: { en: getTrans('en', 'location'), id: getTrans('id', 'location') },
    category: { en: getTrans('en', 'category'), id: getTrans('id', 'category') },
    _method: 'PUT'
  });

  const handleTransChange = (field, locale, value) => {
    setData(prev => ({ ...prev, [field]: { ...prev[field], [locale]: value } }));
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.packages.update', pkg.id), {
      preserveScroll: true,
      onSuccess: () => toast.success('Package updated successfully!'),
      onError: (err) => {
        console.error(err);
        toast.error('Failed to update package. Please check form errors.');
      }
    });
  };

  // --- REPEATER LOGIC ---
  const handleRepeater = (key, action, index, field, value) => {
      if (action === 'add') {
        const templates = {
            itinerary: { day: (data.itinerary.length + 1), title: '', description: '' },
            faqs: { question: '', answer: '' },
            trip_info: { label: '', value: '', icon: '' }
        };
        setData(key, [...data[key], templates[key]]);
      } else if (action === 'remove') {
          setData(key, data[key].filter((_, i) => i !== index));
      } else if (action === 'update') {
          const newItems = [...data[key]];
          newItems[index][field] = value;
          setData(key, newItems);
      }
  };

  const handleCost = (type, action, index, value) => {
      const currentList = data.cost[type];
      if (action === 'add') {
          setData('cost', { ...data.cost, [type]: [...currentList, ''] });
      } else if (action === 'remove') {
          setData('cost', { ...data.cost, [type]: currentList.filter((_, i) => i !== index) });
      } else if (action === 'update') {
          const newList = [...currentList];
          newList[index] = value;
          setData('cost', { ...data.cost, [type]: newList });
      }
  };

  // --- SECTION SCROLL NAVIGATION ---
  const scrollToSection = (id) => {
      const element = document.getElementById(id);
      if(element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form onSubmit={submit} className="flex flex-col lg:flex-row gap-8 items-start relative">

        {/* LEFT SIDEBAR NAVIGATION (Desktop Only) */}
        <div className="hidden lg:block w-64 sticky top-6 space-y-6 shrink-0">
            <Card className="shadow-sm border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Contents</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 p-2">
                    {[
                        { id: 'section-core', icon: Layers, label: 'Core Details' },
                        { id: 'section-trans', icon: Languages, label: 'Translations' },
                        { id: 'section-pricing', icon: DollarSign, label: 'Pricing Tiers' },
                        { id: 'section-itinerary', icon: MapPin, label: 'Itinerary' },
                        { id: 'section-cost', icon: ListChecks, label: 'Inclusions' },
                        { id: 'section-faq', icon: HelpCircle, label: 'FAQs' },
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
        <div className="flex-1 space-y-8 w-full pb-24"> {/* Added pb-24 for footer space */}

            {/* ✅ Publish / Draft Toggle Card */}
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
                        If unchecked, this package will be saved as a <strong>Draft</strong> and will not be visible to customers.
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
                            <Label>Duration (Days)</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" className="pl-9" value={data.duration} onChange={e => setData('duration', e.target.value)} />
                            </div>
                            <InputError message={errors.duration} />
                         </div>
                         <div className="space-y-2">
                            <Label>Rating (0-5)</Label>
                            <div className="relative">
                                <Star className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.1" min="0" max="5" className="pl-9" value={data.rating} onChange={e => setData('rating', e.target.value)} />
                            </div>
                         </div>
                         <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <Label>Map URL</Label>
                            <Input type="url" placeholder="http://maps.google.com/..." value={data.map_url} onChange={e => setData('map_url', e.target.value)} />
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
                        label="Package Name" id="name" required
                        valueEn={data.name.en} valueId={data.name.id}
                        onChange={(l, v) => handleTransChange('name', l, v)}
                        errorEn={errors['name.en']} errorId={errors['name.id']}
                    />
                    <TranslatableField
                        label="Description" id="desc" type="textarea"
                        valueEn={data.description.en} valueId={data.description.id}
                        onChange={(l, v) => handleTransChange('description', l, v)}
                        errorEn={errors['description.en']} errorId={errors['description.id']}
                    />
                    <TranslatableField
                        label="Location" id="loc"
                        valueEn={data.location.en} valueId={data.location.id}
                        onChange={(l, v) => handleTransChange('location', l, v)}
                        errorEn={errors['location.en']} errorId={errors['location.id']}
                    />
                     <TranslatableField
                        label="Category" id="cat"
                        valueEn={data.category.en} valueId={data.category.id}
                        onChange={(l, v) => handleTransChange('category', l, v)}
                        errorEn={errors['category.en']} errorId={errors['category.id']}
                    />
                </div>
            </section>

            {/* 3. PRICING TIERS */}
            <section id="section-pricing" className="space-y-4 scroll-mt-24">
                 <div className="flex items-center gap-2 pb-2 border-b">
                    <DollarSign className="text-primary" />
                    <h3 className="text-xl font-bold">Pricing Tiers</h3>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <PriceTiersRepeater items={data.price_tiers} setData={setData} errors={errors} />
                    </CardContent>
                </Card>
            </section>

            {/* 4. ITINERARY */}
            <section id="section-itinerary" className="space-y-4 scroll-mt-24">
                <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-primary" />
                        <h3 className="text-xl font-bold">Itinerary</h3>
                    </div>
                    <Button type="button" size="sm" onClick={() => handleRepeater('itinerary', 'add')}>
                        <Plus className="w-4 h-4 mr-1" /> Add Day
                    </Button>
                </div>
                <div className="space-y-3">
                    {data.itinerary.map((item, idx) => (
                        <RepeaterItem key={idx} index={idx} title="Day" onDelete={() => handleRepeater('itinerary', 'remove', idx)}>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Day #</Label>
                                    <Input type="number" value={item.day} onChange={e => handleRepeater('itinerary', 'update', idx, 'day', parseInt(e.target.value) || '')} />
                                </div>
                                <div className="md:col-span-10">
                                    <Label>Activity Title</Label>
                                    <Input value={item.title} onChange={e => handleRepeater('itinerary', 'update', idx, 'title', e.target.value)} placeholder="e.g. Arrival in Bali" />
                                </div>
                                <div className="md:col-span-12">
                                    <Label>Description</Label>
                                    <Textarea value={item.description} onChange={e => handleRepeater('itinerary', 'update', idx, 'description', e.target.value)} rows={2} placeholder="Brief details about the day..." />
                                </div>
                            </div>
                        </RepeaterItem>
                    ))}
                    {data.itinerary.length === 0 && <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">No itinerary days added yet.</div>}
                </div>
            </section>

            {/* 5. INCLUSIONS & EXCLUSIONS */}
            <section id="section-cost" className="space-y-4 scroll-mt-24">
                 <div className="flex items-center gap-2 pb-2 border-b">
                    <ListChecks className="text-primary" />
                    <h3 className="text-xl font-bold">Inclusions & Exclusions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* INCLUDED */}
                    <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3"><CardTitle className="text-base text-green-700 dark:text-green-400">✅ What's Included</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {data.cost.included.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input value={item} onChange={e => handleCost('included', 'update', idx, e.target.value)} className="bg-white dark:bg-card" />
                                    <Button type="button" variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleCost('included', 'remove', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleCost('included', 'add')}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </CardContent>
                    </Card>
                    {/* EXCLUDED */}
                    <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <CardHeader className="pb-3"><CardTitle className="text-base text-red-700 dark:text-red-400">❌ What's Excluded</CardTitle></CardHeader>
                         <CardContent className="space-y-2">
                            {data.cost.excluded.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input value={item} onChange={e => handleCost('excluded', 'update', idx, e.target.value)} className="bg-white dark:bg-card" />
                                    <Button type="button" variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleCost('excluded', 'remove', idx)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleCost('excluded', 'add')}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

             {/* 6. FAQS */}
            <section id="section-faq" className="space-y-4 scroll-mt-24">
                <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="text-primary" />
                        <h3 className="text-xl font-bold">FAQs</h3>
                    </div>
                     <Button type="button" size="sm" onClick={() => handleRepeater('faqs', 'add')}>
                        <Plus className="w-4 h-4 mr-1" /> Add FAQ
                    </Button>
                </div>
                <div className="grid gap-4">
                     {data.faqs.map((item, idx) => (
                        <RepeaterItem key={idx} index={idx} onDelete={() => handleRepeater('faqs', 'remove', idx)}>
                             <div className="space-y-3">
                                <Input value={item.question} onChange={e => handleRepeater('faqs', 'update', idx, 'question', e.target.value)} placeholder="Question (e.g. Is visa included?)" className="font-semibold" />
                                <Textarea value={item.answer} onChange={e => handleRepeater('faqs', 'update', idx, 'answer', e.target.value)} placeholder="Answer..." rows={2} />
                             </div>
                        </RepeaterItem>
                     ))}
                      {data.faqs.length === 0 && <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">No FAQs added yet.</div>}
                </div>
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

// ... [GalleryManager remains exactly the same] ...
// I am omitting it for brevity since it was not changed.
// Assume standard GalleryManager component here (refer to your original file).
const GalleryManager = ({ pkg }) => {
  const { data, setData, post, processing, errors, reset } = useForm({ images: [] });
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setData('images', files);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const submitImages = (e) => {
    e.preventDefault();
    if (data.images.length === 0) return;
    post(route('admin.packages.images.store', pkg.id), {
      preserveScroll: true,
      onSuccess: () => { reset('images'); setPreviews([]); toast.success('Images uploaded!'); },
      onError: () => toast.error('Upload failed.')
    });
  };

  const deleteImage = (imageId) => {
    if (confirm('Delete this image?')) {
      router.delete(route('admin.packages.images.destroy', { package: pkg.id, image: imageId }), {
        preserveScroll: true,
        onSuccess: () => toast.success('Image deleted.'),
      });
    }
  };

  const galleryImages = pkg.images?.filter(img => img.type !== 'thumbnail') || [];

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
                        <Button type="submit" className="w-full" disabled={processing || data.images.length === 0}>
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
                            <img src={img.full_url} className="w-full h-full object-cover" />
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
export default function EditHolidayPackage({ auth, package: pkg }) {
  const currentName = getCurrentTranslation(pkg, 'name', `Package #${pkg.id}`);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
                <Link href={route('admin.packages.index')}>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="font-bold text-xl text-foreground leading-tight">{currentName}</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {pkg.id}</p>
                </div>
           </div>
           <div className="flex items-center gap-2">
               <Button variant="secondary" asChild>
                   <Link href={`/public/packages/${pkg.id}`} target="_blank">View Live Page</Link>
               </Button>
           </div>
        </div>
      }
    >
      <Head title={`Edit: ${currentName}`} />

      <div className="py-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* TOP SECTION: THUMBNAIL & QUICK STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                 <ThumbnailManager pkg={pkg} />
              </div>
              <div className="lg:col-span-3">
                 <Card className="h-full flex flex-col justify-center border-none shadow-none bg-transparent">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-card border rounded-lg shadow-sm">
                            <div className="text-muted-foreground text-xs uppercase font-bold">Duration</div>
                            <div className="text-2xl font-bold">{pkg.duration} <span className="text-sm font-normal text-muted-foreground">Days</span></div>
                        </div>
                        <div className="p-4 bg-card border rounded-lg shadow-sm">
                             <div className="text-muted-foreground text-xs uppercase font-bold">Rating</div>
                             <div className="flex items-center gap-1 text-2xl font-bold">
                                {pkg.rating} <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                             </div>
                        </div>
                         <div className="p-4 bg-card border rounded-lg shadow-sm">
                             <div className="text-muted-foreground text-xs uppercase font-bold">Itinerary Items</div>
                             <div className="text-2xl font-bold">{safeParseJson(pkg.itinerary, []).length}</div>
                        </div>
                         <div className="p-4 bg-card border rounded-lg shadow-sm">
                             <div className="text-muted-foreground text-xs uppercase font-bold">Gallery</div>
                             <div className="text-2xl font-bold">{pkg.images?.length - 1 || 0} <span className="text-sm font-normal text-muted-foreground">Photos</span></div>
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
                 <EditPackageForm pkg={pkg} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-6">
                 <GalleryManager pkg={pkg} />
            </TabsContent>
          </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
