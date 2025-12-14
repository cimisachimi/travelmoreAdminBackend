import React, { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Switch } from "@/Components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import InputError from "@/Components/InputError";
import { toast } from "sonner";

export default function GalleryCreate({ linkOptions }) {
  const { data, setData, post, processing, errors } = useForm({
    is_active: true,
    redirect_url: "",
    images: [],
    en: {
      title: "",
      location: "",
      description: "",
      best_time: "",
      ticket_price: ""
    },
    idn: {
      title: "",
      location: "",
      description: "",
      best_time: "",
      ticket_price: ""
    },
  });

  // --- Link Builder Logic ---
  const [linkType, setLinkType] = useState("custom");
  const [selectedId, setSelectedId] = useState("");

  const urlPrefixes = {
    packages: "/packages/",
    activities: "/activities/",
    open_trips: "/open-trips/",
    rentals: "/car-rentals/",
  };

  useEffect(() => {
    if (linkType === "custom") {
       // Manual input mode
    } else if (linkType && selectedId) {
      setData("redirect_url", `${urlPrefixes[linkType]}${selectedId}`);
    }
  }, [linkType, selectedId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.galleries.store"), {
      onSuccess: () => toast.success("Gallery item created successfully"),
      onError: () => toast.error("Please check the form for errors"),
    });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Create Gallery Item</h2>}
    >
      <Head title="Create Gallery" />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Gallery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* --- Status & Redirect Builder --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData("is_active", checked)}
                        />
                        <span>{data.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>

                  {/* Link Builder UI */}
                  <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                    <Label>Redirect Destination</Label>

                    <Select value={linkType} onValueChange={(val) => { setLinkType(val); setSelectedId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Link Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom URL</SelectItem>
                        <SelectItem value="packages">Holiday Package</SelectItem>
                        <SelectItem value="activities">Activity</SelectItem>
                        <SelectItem value="open_trips">Open Trip</SelectItem>
                        <SelectItem value="rentals">Car Rental</SelectItem>
                      </SelectContent>
                    </Select>

                    {linkType !== "custom" && (
                      <Select value={selectedId} onValueChange={(val) => setSelectedId(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {linkOptions[linkType]?.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Generated URL</Label>
                      <Input
                        value={data.redirect_url}
                        onChange={(e) => setData("redirect_url", e.target.value)}
                        readOnly={linkType !== "custom"}
                        className={linkType !== "custom" ? "bg-gray-100 text-gray-500" : ""}
                        placeholder="https://..."
                      />
                      <InputError message={errors.redirect_url} />
                    </div>
                  </div>
                </div>

                {/* --- Images Upload --- */}
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setData("images", e.target.files)}
                  />
                  <InputError message={errors.images} />
                </div>

                {/* --- Multilingual Tabs --- */}
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English (EN)</TabsTrigger>
                    <TabsTrigger value="idn">Indonesian (ID)</TabsTrigger>
                  </TabsList>

                  {/* English Tab */}
                  <TabsContent value="en" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title (EN)</Label>
                            <Input
                                value={data.en.title}
                                onChange={(e) => setData("en", { ...data.en, title: e.target.value })}
                                required
                            />
                            <InputError message={errors["en.title"]} />
                        </div>
                        {/* ✅ Location Input */}
                        <div className="space-y-2">
                            <Label>Location (EN)</Label>
                            <Input
                                placeholder="e.g. South Bali"
                                value={data.en.location}
                                onChange={(e) => setData("en", { ...data.en, location: e.target.value })}
                            />
                            <InputError message={errors["en.location"]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Best Time (EN)</Label>
                            <Input
                                placeholder="e.g. April - October"
                                value={data.en.best_time}
                                onChange={(e) => setData("en", { ...data.en, best_time: e.target.value })}
                            />
                            <InputError message={errors["en.best_time"]} />
                        </div>
                        <div className="space-y-2">
                            <Label>Entrance Fee (EN)</Label>
                            <Input
                                placeholder="e.g. $10 or Free"
                                value={data.en.ticket_price}
                                onChange={(e) => setData("en", { ...data.en, ticket_price: e.target.value })}
                            />
                            <InputError message={errors["en.ticket_price"]} />
                        </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (EN)</Label>
                      <Textarea
                        rows={3}
                        value={data.en.description}
                        onChange={(e) => setData("en", { ...data.en, description: e.target.value })}
                      />
                      <InputError message={errors["en.description"]} />
                    </div>
                  </TabsContent>

                  {/* Indonesian Tab */}
                  <TabsContent value="idn" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Judul (ID)</Label>
                            <Input
                                value={data.idn.title}
                                onChange={(e) => setData("idn", { ...data.idn, title: e.target.value })}
                                required
                            />
                            <InputError message={errors["idn.title"]} />
                        </div>
                        {/* ✅ Location Input */}
                        <div className="space-y-2">
                            <Label>Lokasi (ID)</Label>
                            <Input
                                placeholder="Contoh: Bali Selatan"
                                value={data.idn.location}
                                onChange={(e) => setData("idn", { ...data.idn, location: e.target.value })}
                            />
                            <InputError message={errors["idn.location"]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Waktu Terbaik (ID)</Label>
                            <Input
                                placeholder="Contoh: April - Oktober"
                                value={data.idn.best_time}
                                onChange={(e) => setData("idn", { ...data.idn, best_time: e.target.value })}
                            />
                            <InputError message={errors["idn.best_time"]} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tiket Masuk (ID)</Label>
                            <Input
                                placeholder="Contoh: Rp 15.000 atau Gratis"
                                value={data.idn.ticket_price}
                                onChange={(e) => setData("idn", { ...data.idn, ticket_price: e.target.value })}
                            />
                            <InputError message={errors["idn.ticket_price"]} />
                        </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi (ID)</Label>
                      <Textarea
                        rows={3}
                        value={data.idn.description}
                        onChange={(e) => setData("idn", { ...data.idn, description: e.target.value })}
                      />
                      <InputError message={errors["idn.description"]} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Create Gallery Item"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
