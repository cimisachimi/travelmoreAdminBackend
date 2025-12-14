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
import { X } from "lucide-react";

export default function GalleryEdit({ gallery, linkOptions }) {
  const { data, setData, post, processing, errors } = useForm({
    _method: "PUT",
    is_active: gallery.is_active,
    redirect_url: gallery.redirect_url || "",
    images: [],
    deleted_images: [],
    en: {
      title: gallery.en?.title || "",
      location: gallery.en?.location || "", // ✅ Location
      description: gallery.en?.description || "",
      best_time: gallery.en?.best_time || "",
      ticket_price: gallery.en?.ticket_price || "",
    },
    idn: {
      title: gallery.idn?.title || "",
      location: gallery.idn?.location || "", // ✅ Location
      description: gallery.idn?.description || "",
      best_time: gallery.idn?.best_time || "",
      ticket_price: gallery.idn?.ticket_price || "",
    },
  });

  const [existingImages, setExistingImages] = useState(gallery.images || []);

  // --- Link Builder Logic ---
  const [linkType, setLinkType] = useState("custom");
  const [selectedId, setSelectedId] = useState("");

  const urlPrefixes = {
    packages: "/packages/",
    activities: "/activities/",
    open_trips: "/open-trips/",
    rentals: "/car-rentals/",
  };

  // Logic to parse existing URL into Type + ID
  useEffect(() => {
    if (!gallery.redirect_url) return;

    let found = false;
    Object.entries(urlPrefixes).forEach(([type, prefix]) => {
      if (gallery.redirect_url.startsWith(prefix)) {
        const id = gallery.redirect_url.replace(prefix, "");
        if (id && !isNaN(id)) {
            setLinkType(type);
            setSelectedId(id);
            found = true;
        }
      }
    });

    if (!found) setLinkType("custom");
  }, []);

  // Logic to build URL from Type + ID
  useEffect(() => {
    if (linkType === "custom") {
       // Manual mode handled by Input onChange
    } else if (linkType && selectedId) {
      setData("redirect_url", `${urlPrefixes[linkType]}${selectedId}`);
    }
  }, [linkType, selectedId]);


  const handleImageDelete = (imageId) => {
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
    setData("deleted_images", [...data.deleted_images, imageId]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.galleries.update", gallery.id), {
      onSuccess: () => toast.success("Gallery item updated successfully"),
      onError: () => toast.error("Please check the form for errors"),
    });
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Gallery Item</h2>}
    >
      <Head title="Edit Gallery" />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Edit Gallery Details</CardTitle>
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
                        onChange={(e) => {
                            setData("redirect_url", e.target.value);
                            if (linkType !== "custom") setLinkType("custom");
                        }}
                        readOnly={linkType !== "custom"}
                        className={linkType !== "custom" ? "bg-gray-100 text-gray-500" : ""}
                        placeholder="https://..."
                      />
                      <InputError message={errors.redirect_url} />
                    </div>
                  </div>
                </div>

                {/* --- Existing Images --- */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Images</Label>
                    <div className="grid grid-cols-4 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative group border rounded-lg overflow-hidden h-24">
                          <img
                            src={img.url}
                            alt="Gallery"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageDelete(img.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- Add New Images --- */}
                <div className="space-y-2">
                  <Label htmlFor="images">Add New Images</Label>
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
                                value={data.en.best_time}
                                onChange={(e) => setData("en", { ...data.en, best_time: e.target.value })}
                            />
                            <InputError message={errors["en.best_time"]} />
                        </div>
                        <div className="space-y-2">
                            <Label>Entrance Fee (EN)</Label>
                            <Input
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
                                value={data.idn.best_time}
                                onChange={(e) => setData("idn", { ...data.idn, best_time: e.target.value })}
                            />
                            <InputError message={errors["idn.best_time"]} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tiket Masuk (ID)</Label>
                            <Input
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

                <div className="flex justify-end pt-4 space-x-4">
                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Update Gallery Item"}
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
