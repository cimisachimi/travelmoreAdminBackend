import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Trash, X, Star, Upload, Save, ArrowLeft } from "lucide-react";
import Checkbox from "@/Components/Checkbox";
import { useState } from "react";
// ✅ Import AddonsRepeater
import AddonsRepeater from "@/Pages/Admin/Components/AddonsRepeater";

export default function Edit({ auth, openTrip, initialCost }) {
  const { data, setData, put, processing, errors } = useForm({
    is_active: Boolean(openTrip.is_active),

    duration: openTrip.duration || "",
    rating: openTrip.rating || "",
    map_url: openTrip.map_url || "",

    // Translations
    en: {
      name: openTrip.translations.find(t => t.locale === 'en')?.name || "",
      location: openTrip.translations.find(t => t.locale === 'en')?.location || "",
      category: openTrip.translations.find(t => t.locale === 'en')?.category || "",
      description: openTrip.translations.find(t => t.locale === 'en')?.description || ""
    },
    id: {
      name: openTrip.translations.find(t => t.locale === 'id')?.name || "",
      location: openTrip.translations.find(t => t.locale === 'id')?.location || "",
      category: openTrip.translations.find(t => t.locale === 'id')?.category || "",
      description: openTrip.translations.find(t => t.locale === 'id')?.description || ""
    },

    // JSON Fields
    price_tiers: openTrip.price_tiers || [{ min_pax: 1, max_pax: "", price: "" }],
    meeting_points: openTrip.meeting_points || [{ name: "", time: "" }],
    itinerary: openTrip.itinerary || [{ day: 1, title: "", activities: [""] }],
    includes: initialCost.included || [""],
    excludes: initialCost.excluded || [""],
    addons: openTrip.addons || [], // ✅ Initialize Addons
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route("admin.open-trips.update", openTrip.id));
  };

  // --- Image Management Handlers ---
  const [newImage, setNewImage] = useState(null);

  const handleUploadImage = () => {
    if (!newImage) return;
    const formData = new FormData();
    formData.append('image', newImage);
    router.post(route('admin.open-trips.images.store', openTrip.id), formData, {
        onSuccess: () => setNewImage(null)
    });
  };

  const handleDeleteImage = (imageId) => {
    if (confirm("Delete this image?")) {
        router.delete(route('admin.open-trips.images.destroy', [openTrip.id, imageId]));
    }
  };

  const handleSetThumbnail = (imageId) => {
    router.post(route('admin.open-trips.thumbnail.update', openTrip.id), { image_id: imageId });
  };

  // ... (Dynamic field helpers) ...
  const addPriceTier = () => setData("price_tiers", [...data.price_tiers, { min_pax: "", max_pax: "", price: "" }]);
  const updatePriceTier = (index, field, value) => {
    const newTiers = [...data.price_tiers]; newTiers[index][field] = value; setData("price_tiers", newTiers);
  };
  const removePriceTier = (index) => setData("price_tiers", data.price_tiers.filter((_, i) => i !== index));

  const addItineraryDay = () => setData("itinerary", [...data.itinerary, { day: data.itinerary.length + 1, title: "", activities: [""] }]);
  const updateItinerary = (index, field, value) => {
    const newItinerary = [...data.itinerary]; newItinerary[index][field] = value; setData("itinerary", newItinerary);
  };
  const addActivity = (dayIndex) => {
    const newItinerary = [...data.itinerary]; newItinerary[dayIndex].activities.push(""); setData("itinerary", newItinerary);
  };
  const updateActivity = (dayIndex, actIndex, value) => {
    const newItinerary = [...data.itinerary]; newItinerary[dayIndex].activities[actIndex] = value; setData("itinerary", newItinerary);
  };

  const addSimpleList = (field) => setData(field, [...data[field], ""]);
  const updateSimpleList = (field, index, value) => {
    const newList = [...data[field]]; newList[index] = value; setData(field, newList);
  };
  const removeSimpleList = (field, index) => setData(field, data[field].filter((_, i) => i !== index));


  return (
    <AuthenticatedLayout
        user={auth.user}
        header={
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon"><Link href={route("admin.open-trips.index")}><ArrowLeft className="h-4 w-4" /></Link></Button>
                <h2 className="text-xl font-semibold text-gray-800">Edit Open Trip: {data.en.name}</h2>
            </div>
        }
    >
      <Head title="Edit Open Trip" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Publish Toggle */}
                <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <Label htmlFor="is_active" className="font-semibold cursor-pointer select-none">
                                Publish to Frontend?
                            </Label>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-6">
                            If unchecked, this trip will be saved as a <strong>Draft</strong> and hidden from the public site.
                        </p>
                    </CardContent>
                </Card>

                {/* Main Tabs */}
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="info">Info</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="addons">Add-ons</TabsTrigger> {/* ✅ Add-ons Tab */}
                    </TabsList>

                    {/* 1. Basic Info */}
                    <TabsContent value="info">
                        <Card>
                            <CardHeader><CardTitle>Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Tabs defaultValue="en">
                                    <TabsList>
                                        <TabsTrigger value="en">English</TabsTrigger>
                                        <TabsTrigger value="id">Indonesian</TabsTrigger>
                                    </TabsList>
                                    {["en", "id"].map((lang) => (
                                        <TabsContent key={lang} value={lang} className="space-y-3 pt-4">
                                            <Label>Name</Label>
                                            <Input value={data[lang].name} onChange={e => setData(lang, { ...data[lang], name: e.target.value })} />
                                            <Label>Location</Label>
                                            <Input value={data[lang].location} onChange={e => setData(lang, { ...data[lang], location: e.target.value })} />
                                            <Label>Description</Label>
                                            <Textarea value={data[lang].description} onChange={e => setData(lang, { ...data[lang], description: e.target.value })} />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label>Duration</Label><Input value={data.duration} onChange={e => setData('duration', e.target.value)} /></div>
                                    <div><Label>Rating</Label><Input value={data.rating} onChange={e => setData('rating', e.target.value)} /></div>
                                    <div><Label>Map URL</Label><Input value={data.map_url} onChange={e => setData('map_url', e.target.value)} /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2. Price Tiers */}
                    <TabsContent value="pricing">
                        <Card>
                            {/* ✅ FIXED: Removed duplicate 'type' attribute */}
                            <CardHeader className="flex flex-row justify-between"><CardTitle>Price Tiers</CardTitle><Button type="button" size="sm" onClick={addPriceTier}>Add</Button></CardHeader>
                            <CardContent className="space-y-2">
                                {data.price_tiers.map((tier, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <Input placeholder="Min" className="w-20" value={tier.min_pax} onChange={e => updatePriceTier(i, 'min_pax', e.target.value)} />
                                        <Input placeholder="Max" className="w-20" value={tier.max_pax} onChange={e => updatePriceTier(i, 'max_pax', e.target.value)} />
                                        <Input placeholder="Price" className="flex-1" value={tier.price} onChange={e => updatePriceTier(i, 'price', e.target.value)} />
                                        <Button type="button" size="icon" variant="destructive" onClick={() => removePriceTier(i)}><Trash size={14}/></Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 3. Itinerary */}
                    <TabsContent value="itinerary">
                        <Card>
                            {/* ✅ FIXED: Removed duplicate 'type' attribute */}
                            <CardHeader className="flex flex-row justify-between"><CardTitle>Itinerary</CardTitle><Button type="button" size="sm" onClick={addItineraryDay}>Add Day</Button></CardHeader>
                            <CardContent className="space-y-4">
                                {data.itinerary.map((day, dIndex) => (
                                    <div key={dIndex} className="border p-3 rounded">
                                        <div className="flex gap-2 mb-2">
                                            <Input className="w-16" value={day.day} onChange={e => updateItinerary(dIndex, 'day', e.target.value)} />
                                            <Input className="flex-1" placeholder="Day Title" value={day.title} onChange={e => updateItinerary(dIndex, 'title', e.target.value)} />
                                        </div>
                                        <div className="pl-4 space-y-1 border-l-2">
                                            {day.activities.map((act, aIndex) => (
                                                <Input key={aIndex} size="sm" value={act} onChange={e => updateActivity(dIndex, aIndex, e.target.value)} />
                                            ))}
                                            <Button type="button" size="sm" variant="link" onClick={() => addActivity(dIndex)}>+ Activity</Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 4. Details (Includes/Excludes) */}
                    <TabsContent value="details">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader><CardTitle>Includes</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {data.includes.map((inc, i) => (
                                        <div key={i} className="flex gap-2"><Input value={inc} onChange={e => updateSimpleList('includes', i, e.target.value)} /><Button type="button" size="icon" variant="ghost" onClick={() => removeSimpleList('includes', i)}><X size={14}/></Button></div>
                                    ))}
                                    <Button type="button" size="sm" variant="outline" onClick={() => addSimpleList('includes')}>Add</Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Excludes</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {data.excludes.map((ex, i) => (
                                        <div key={i} className="flex gap-2"><Input value={ex} onChange={e => updateSimpleList('excludes', i, e.target.value)} /><Button type="button" size="icon" variant="ghost" onClick={() => removeSimpleList('excludes', i)}><X size={14}/></Button></div>
                                    ))}
                                    <Button type="button" size="sm" variant="outline" onClick={() => addSimpleList('excludes')}>Add</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ✅ 5. Add-ons Tab */}
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
                </Tabs>

                <div className="flex justify-end gap-4 border-t pt-4">
                    <Button variant="outline" asChild><Link href={route("admin.open-trips.index")}>Cancel</Link></Button>
                    <Button type="submit" disabled={processing} size="lg"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                </div>
            </form>

            {/* --- Image Management Section (Below Form) --- */}
            <Card>
                <CardHeader><CardTitle>Manage Images</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {openTrip.images.map((img) => (
                            <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                                <img src={img.full_url} alt="Trip" className="h-32 w-full object-cover" />
                                {img.type === 'thumbnail' && (
                                    <div className="absolute top-0 right-0 bg-primary text-white text-xs px-2 py-1">Cover</div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                    <Button size="icon" variant="destructive" onClick={() => handleDeleteImage(img.id)}><Trash size={16}/></Button>
                                    {img.type !== 'thumbnail' && (
                                        <Button size="icon" variant="secondary" onClick={() => handleSetThumbnail(img.id)}><Star size={16}/></Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Input type="file" onChange={e => setNewImage(e.target.files[0])} className="max-w-xs" />
                        <Button onClick={handleUploadImage} disabled={!newImage}><Upload size={16} className="mr-2"/> Upload New</Button>
                    </div>
                </CardContent>
            </Card>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
