import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import Checkbox from "@/Components/Checkbox"; // ✅ Checkbox
import InputError from "@/Components/InputError";
import { Plus, Trash, X, ArrowLeft, Save } from "lucide-react";

export default function Create({ auth }) {
  const { data, setData, post, processing, errors } = useForm({
    is_active: false, // ✅ Added
    duration: "",
    rating: "",
    map_url: "",
    en: { name: "", location: "", category: "", description: "" },
    id: { name: "", location: "", category: "", description: "" },
    price_tiers: [{ min_pax: 1, max_pax: "", price: "" }],
    meeting_points: [{ name: "", time: "" }],
    itinerary: [{ day: 1, title: "", activities: [""] }],
    includes: [""],
    excludes: [""],
    images: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.open-trips.store"));
  };

  // --- Helpers ---
  const addPriceTier = () => setData("price_tiers", [...data.price_tiers, { min_pax: "", max_pax: "", price: "" }]);
  const updatePriceTier = (index, field, value) => { const newTiers = [...data.price_tiers]; newTiers[index][field] = value; setData("price_tiers", newTiers); };
  const removePriceTier = (index) => setData("price_tiers", data.price_tiers.filter((_, i) => i !== index));

  const addItineraryDay = () => setData("itinerary", [...data.itinerary, { day: data.itinerary.length + 1, title: "", activities: [""] }]);
  const updateItinerary = (index, field, value) => { const newItinerary = [...data.itinerary]; newItinerary[index][field] = value; setData("itinerary", newItinerary); };
  const addActivity = (dayIndex) => { const newItinerary = [...data.itinerary]; newItinerary[dayIndex].activities.push(""); setData("itinerary", newItinerary); };
  const updateActivity = (dayIndex, actIndex, value) => { const newItinerary = [...data.itinerary]; newItinerary[dayIndex].activities[actIndex] = value; setData("itinerary", newItinerary); };

  const addSimpleList = (field) => setData(field, [...data[field], ""]);
  const updateSimpleList = (field, index, value) => { const newList = [...data[field]]; newList[index] = value; setData(field, newList); };
  const removeSimpleList = (field, index) => setData(field, data[field].filter((_, i) => i !== index));

  return (
    <AuthenticatedLayout user={auth.user} header={
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon"><Link href={route("admin.open-trips.index")}><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Create Open Trip</h2>
        </div>
    }>
      <Head title="Create Open Trip" />

      <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ✅ Publish / Draft Toggle */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Checkbox id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        <Label htmlFor="is_active" className="font-semibold cursor-pointer">Publish to Frontend?</Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 ml-6">If unchecked, this trip will be saved as a <strong>Draft</strong>.</p>
                </CardContent>
            </Card>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details & Translations</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing & Meeting</TabsTrigger>
                    <TabsTrigger value="itinerary">Itinerary & Includes</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>

                {/* 1. Details */}
                <TabsContent value="details" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Translations</CardTitle></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="en">
                                <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="id">Indonesian</TabsTrigger></TabsList>
                                {["en", "id"].map((lang) => (
                                    <TabsContent key={lang} value={lang} className="space-y-4 pt-4">
                                        <div><Label>Name ({lang.toUpperCase()}) <span className="text-red-500">*</span></Label><Input value={data[lang].name} onChange={e => setData(lang, { ...data[lang], name: e.target.value })} /><InputError message={errors[`${lang}.name`]} className="mt-1"/></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Location</Label><Input value={data[lang].location} onChange={e => setData(lang, { ...data[lang], location: e.target.value })} /></div>
                                            <div><Label>Category</Label><Input placeholder="e.g. Mountain" value={data[lang].category} onChange={e => setData(lang, { ...data[lang], category: e.target.value })} /></div>
                                        </div>
                                        <div><Label>Description</Label><Textarea rows={5} value={data[lang].description} onChange={e => setData(lang, { ...data[lang], description: e.target.value })} /></div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Core Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            <div><Label>Duration (Days)</Label><Input type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} /><InputError message={errors.duration}/></div>
                            <div><Label>Rating (0-5)</Label><Input type="number" step="0.1" value={data.rating} onChange={e => setData('rating', e.target.value)} /></div>
                            <div><Label>Map URL</Label><Input value={data.map_url} onChange={e => setData('map_url', e.target.value)} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. Pricing */}
                <TabsContent value="pricing" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between"><CardTitle>Price Tiers</CardTitle><Button type="button" size="sm" onClick={addPriceTier} variant="outline"><Plus size={16}/> Add Tier</Button></CardHeader>
                        <CardContent className="space-y-3">
                            {data.price_tiers.map((tier, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                    <div className="w-24"><Label>Min Pax</Label><Input type="number" value={tier.min_pax} onChange={e => updatePriceTier(index, 'min_pax', e.target.value)} /></div>
                                    <div className="w-24"><Label>Max Pax</Label><Input type="number" placeholder="Any" value={tier.max_pax} onChange={e => updatePriceTier(index, 'max_pax', e.target.value)} /></div>
                                    <div className="flex-1"><Label>Price (IDR)</Label><Input type="number" value={tier.price} onChange={e => updatePriceTier(index, 'price', e.target.value)} /></div>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removePriceTier(index)}><Trash size={16}/></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between"><CardTitle>Meeting Points</CardTitle> <Button type="button" size="sm" onClick={() => setData('meeting_points', [...data.meeting_points, {name:'', time:''}])}>Add</Button></CardHeader>
                        <CardContent className="space-y-3">
                            {data.meeting_points.map((mp, i) => (
                                <div key={i} className="flex gap-3">
                                    <Input placeholder="Location Name" value={mp.name} onChange={e => { const newMp = [...data.meeting_points]; newMp[i].name = e.target.value; setData('meeting_points', newMp); }} />
                                    <Input placeholder="Time (e.g. 08:00)" className="w-40" value={mp.time} onChange={e => { const newMp = [...data.meeting_points]; newMp[i].time = e.target.value; setData('meeting_points', newMp); }} />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => setData('meeting_points', data.meeting_points.filter((_, idx) => idx !== i))}><Trash size={16}/></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. Itinerary */}
                <TabsContent value="itinerary" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between"><CardTitle>Itinerary</CardTitle><Button type="button" size="sm" onClick={addItineraryDay} variant="outline"><Plus size={16}/> Add Day</Button></CardHeader>
                        <CardContent className="space-y-6">
                            {data.itinerary.map((day, dIndex) => (
                                <div key={dIndex} className="border p-4 rounded-lg bg-gray-50">
                                    <div className="flex gap-4 mb-3">
                                        <div className="w-20"><Label>Day</Label><Input type="number" value={day.day} onChange={e => updateItinerary(dIndex, 'day', e.target.value)} /></div>
                                        <div className="flex-1"><Label>Title</Label><Input value={day.title} onChange={e => updateItinerary(dIndex, 'title', e.target.value)} /></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Activities</Label>
                                        {day.activities.map((act, aIndex) => (
                                            <Input key={aIndex} size="sm" value={act} onChange={e => updateActivity(dIndex, aIndex, e.target.value)} />
                                        ))}
                                        <Button type="button" size="sm" variant="ghost" onClick={() => addActivity(dIndex)} className="text-xs">+ Add Activity</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Includes</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {data.includes.map((item, i) => (
                                    <div key={i} className="flex gap-2"><Input value={item} onChange={e => updateSimpleList('includes', i, e.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeSimpleList('includes', i)}><X size={14}/></Button></div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addSimpleList('includes')}>+ Add Item</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Excludes</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {data.excludes.map((item, i) => (
                                    <div key={i} className="flex gap-2"><Input value={item} onChange={e => updateSimpleList('excludes', i, e.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeSimpleList('excludes', i)}><X size={14}/></Button></div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addSimpleList('excludes')}>+ Add Item</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 4. Images */}
                <TabsContent value="images" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Upload Images</CardTitle><CardDescription>Select multiple images. The first one will be the thumbnail.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed rounded-lg p-10 text-center bg-gray-50">
                                <Input type="file" multiple accept="image/*" onChange={e => setData('images', Array.from(e.target.files))} className="cursor-pointer" />
                                <p className="mt-2 text-sm text-gray-500">Drag & Drop or Click to Upload</p>
                            </div>
                            {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 pt-6 border-t">
                <Button variant="outline" asChild><Link href={route("admin.open-trips.index")}>Cancel</Link></Button>
                <Button type="submit" size="lg" disabled={processing}><Save className="w-4 h-4 mr-2"/> Save Open Trip</Button>
            </div>

          </form>
      </div>
    </AuthenticatedLayout>
  );
}
