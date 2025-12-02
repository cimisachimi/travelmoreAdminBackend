import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Plus, Trash, X } from "lucide-react";

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
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

  // --- Dynamic Field Helpers ---

  const addPriceTier = () => {
    setData("price_tiers", [...data.price_tiers, { min_pax: "", max_pax: "", price: "" }]);
  };
  const updatePriceTier = (index, field, value) => {
    const newTiers = [...data.price_tiers];
    newTiers[index][field] = value;
    setData("price_tiers", newTiers);
  };
  const removePriceTier = (index) => {
    setData("price_tiers", data.price_tiers.filter((_, i) => i !== index));
  };

  const addItineraryDay = () => {
    setData("itinerary", [...data.itinerary, { day: data.itinerary.length + 1, title: "", activities: [""] }]);
  };
  const updateItinerary = (index, field, value) => {
    const newItinerary = [...data.itinerary];
    newItinerary[index][field] = value;
    setData("itinerary", newItinerary);
  };
  const addActivity = (dayIndex) => {
    const newItinerary = [...data.itinerary];
    newItinerary[dayIndex].activities.push("");
    setData("itinerary", newItinerary);
  };
  const updateActivity = (dayIndex, actIndex, value) => {
    const newItinerary = [...data.itinerary];
    newItinerary[dayIndex].activities[actIndex] = value;
    setData("itinerary", newItinerary);
  };

  const addSimpleList = (field) => setData(field, [...data[field], ""]);
  const updateSimpleList = (field, index, value) => {
    const newList = [...data[field]];
    newList[index] = value;
    setData(field, newList);
  };
  const removeSimpleList = (field, index) => {
    setData(field, data[field].filter((_, i) => i !== index));
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Create Open Trip</h2>}
    >
      <Head title="Create Open Trip" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Basic & Translatable Info */}
            <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Tabs defaultValue="en">
                        <TabsList>
                            <TabsTrigger value="en">English (EN)</TabsTrigger>
                            <TabsTrigger value="id">Indonesian (ID)</TabsTrigger>
                        </TabsList>
                        {["en", "id"].map((lang) => (
                            <TabsContent key={lang} value={lang} className="space-y-4">
                                <div>
                                    <Label>Trip Name ({lang.toUpperCase()})</Label>
                                    <Input
                                        value={data[lang].name}
                                        onChange={e => setData(lang, { ...data[lang], name: e.target.value })}
                                    />
                                    {errors[`${lang}.name`] && <p className="text-red-500 text-sm">{errors[`${lang}.name`]}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Location ({lang.toUpperCase()})</Label>
                                        <Input
                                            value={data[lang].location}
                                            onChange={e => setData(lang, { ...data[lang], location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Category ({lang.toUpperCase()})</Label>
                                        <Input
                                            placeholder="e.g. Mountain, Beach"
                                            value={data[lang].category}
                                            onChange={e => setData(lang, { ...data[lang], category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Description ({lang.toUpperCase()})</Label>
                                    <Textarea
                                        rows={5}
                                        value={data[lang].description}
                                        onChange={e => setData(lang, { ...data[lang], description: e.target.value })}
                                    />
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                        <div>
                            <Label>Duration (Days)</Label>
                            <Input type="number" value={data.duration} onChange={e => setData('duration', e.target.value)} />
                            {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
                        </div>
                        <div>
                            <Label>Rating (0-5)</Label>
                            <Input type="number" step="0.1" value={data.rating} onChange={e => setData('rating', e.target.value)} />
                        </div>
                        <div>
                            <Label>Google Maps Embed URL</Label>
                            <Input value={data.map_url} onChange={e => setData('map_url', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Price Tiers */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Price Tiers</CardTitle>
                    <Button type="button" size="sm" onClick={addPriceTier} variant="outline"><Plus size={16}/> Add Tier</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.price_tiers.map((tier, index) => (
                        <div key={index} className="flex gap-4 items-end">
                            <div className="w-24">
                                <Label>Min Pax</Label>
                                <Input type="number" value={tier.min_pax} onChange={e => updatePriceTier(index, 'min_pax', e.target.value)} />
                            </div>
                            <div className="w-24">
                                <Label>Max Pax</Label>
                                <Input type="number" placeholder="Any" value={tier.max_pax} onChange={e => updatePriceTier(index, 'max_pax', e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <Label>Price (IDR)</Label>
                                <Input type="number" value={tier.price} onChange={e => updatePriceTier(index, 'price', e.target.value)} />
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removePriceTier(index)}><Trash size={16}/></Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 3. Itinerary */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Itinerary</CardTitle>
                    <Button type="button" size="sm" onClick={addItineraryDay} variant="outline"><Plus size={16}/> Add Day</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {data.itinerary.map((day, dIndex) => (
                        <div key={dIndex} className="border p-4 rounded-lg bg-gray-50">
                            <div className="flex gap-4 mb-3">
                                <div className="w-20">
                                    <Label>Day</Label>
                                    <Input type="number" value={day.day} onChange={e => updateItinerary(dIndex, 'day', e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <Label>Title</Label>
                                    <Input value={day.title} onChange={e => updateItinerary(dIndex, 'title', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Activities</Label>
                                {day.activities.map((act, aIndex) => (
                                    <div key={aIndex} className="flex gap-2">
                                        <Input size="sm" value={act} onChange={e => updateActivity(dIndex, aIndex, e.target.value)} />
                                    </div>
                                ))}
                                <Button type="button" size="sm" variant="ghost" onClick={() => addActivity(dIndex)} className="text-xs">+ Add Activity</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 4. Includes / Excludes & Meeting Points */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Includes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {data.includes.map((item, i) => (
                            <div key={i} className="flex gap-2">
                                <Input value={item} onChange={e => updateSimpleList('includes', i, e.target.value)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSimpleList('includes', i)}><X size={14}/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addSimpleList('includes')}>+ Add Item</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Excludes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {data.excludes.map((item, i) => (
                            <div key={i} className="flex gap-2">
                                <Input value={item} onChange={e => updateSimpleList('excludes', i, e.target.value)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSimpleList('excludes', i)}><X size={14}/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addSimpleList('excludes')}>+ Add Item</Button>
                    </CardContent>
                </Card>
            </div>

            {/* 5. Meeting Points */}
            <Card>
                <CardHeader className="flex flex-row justify-between"><CardTitle>Meeting Points</CardTitle> <Button type="button" size="sm" onClick={() => setData('meeting_points', [...data.meeting_points, {name:'', time:''}])}>Add</Button></CardHeader>
                <CardContent className="space-y-3">
                    {data.meeting_points.map((mp, i) => (
                        <div key={i} className="flex gap-3">
                            <Input placeholder="Location Name" value={mp.name} onChange={e => {
                                const newMp = [...data.meeting_points]; newMp[i].name = e.target.value; setData('meeting_points', newMp);
                            }} />
                            <Input placeholder="Time (e.g. 08:00)" className="w-40" value={mp.time} onChange={e => {
                                const newMp = [...data.meeting_points]; newMp[i].time = e.target.value; setData('meeting_points', newMp);
                            }} />
                            <Button type="button" variant="destructive" size="icon" onClick={() => {
                                setData('meeting_points', data.meeting_points.filter((_, idx) => idx !== i));
                            }}><Trash size={16}/></Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 6. Images */}
            <Card>
                <CardHeader><CardTitle>Upload Images</CardTitle></CardHeader>
                <CardContent>
                    <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => setData('images', Array.from(e.target.files))}
                    />
                    {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button variant="outline" asChild><Link href={route("admin.open-trips.index")}>Cancel</Link></Button>
                <Button type="submit" disabled={processing}>Save Open Trip</Button>
            </div>

          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
