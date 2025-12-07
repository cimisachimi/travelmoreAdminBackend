import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
// ✅ Import AddonsRepeater
import AddonsRepeater from "@/Pages/Admin/Components/AddonsRepeater";

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        is_active: false,
        price: 0,
        status: "active",
        duration: "",
        thumbnail: null,
        gallery: [],
        addons: [], // ✅ Initialize Addons
        translations: {
            en: { name: "", description: "", location: "", category: "" },
            id: { name: "", description: "", location: "", category: "" },
        },
    });

    // ... [Thumbnail & Gallery Logic remains the same] ...
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const onThumbnailDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) { setThumbnailPreview(URL.createObjectURL(file)); setData("thumbnail", file); }
    };
    const removeThumbnail = () => { setThumbnailPreview(null); setData("thumbnail", null); };
    const { getRootProps: getThumbnailRootProps, getInputProps: getThumbnailInputProps, isDragActive: isThumbnailDragActive } = useDropzone({ onDrop: onThumbnailDrop, accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] }, multiple: false });

    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const onGalleryDrop = (acceptedFiles) => {
        const newFiles = acceptedFiles.map((file) => Object.assign(file, { preview: URL.createObjectURL(file) }));
        setGalleryPreviews((prev) => [...prev, ...newFiles]);
        setData("gallery", [...data.gallery, ...newFiles]);
    };
    const removeGalleryImage = (index) => {
        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
        setData("gallery", data.gallery.filter((_, i) => i !== index));
    };
    const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({ onDrop: onGalleryDrop, accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] }, multiple: true });

    const submit = (e) => { e.preventDefault(); post(route("admin.activities.store")); };

    const handleTranslationChange = (locale, key, value) => {
        setData("translations", { ...data.translations, [locale]: { ...data.translations[locale], [key]: value } });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon"><Link href={route("admin.activities.index")}><ArrowLeft className="h-4 w-4" /></Link></Button>
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Create New Activity</h2>
            </div>
        }>
            <Head title="Create Activity" />
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-6">

                    {/* Publish / Draft Toggle */}
                    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <Checkbox id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                <Label htmlFor="is_active" className="font-semibold cursor-pointer">Publish to Frontend?</Label>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 ml-6">If unchecked, this activity will be saved as a <strong>Draft</strong>.</p>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="core" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="core">Core Details & Images</TabsTrigger>
                            <TabsTrigger value="translations">Translations</TabsTrigger>
                            <TabsTrigger value="addons">Add-ons</TabsTrigger> {/* ✅ New Tab */}
                        </TabsList>

                        <TabsContent value="core" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                             {/* ... [Core Details & Images Content remains the same] ... */}
                             <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="price">Price (IDR) <span className="text-red-500">*</span></Label>
                                                <Input id="price" type="number" value={data.price} onChange={(e) => setData("price", e.target.value)} />
                                                <InputError message={errors.price} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="duration">Duration</Label>
                                                <Input id="duration" value={data.duration} onChange={(e) => setData("duration", e.target.value)} placeholder="e.g. 3 Hours" />
                                                <InputError message={errors.duration} className="mt-1" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Thumbnail Image <span className="text-red-500">*</span></CardTitle>
                                        <CardDescription>Main image displayed on the listing card.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div {...getThumbnailRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isThumbnailDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"}`}>
                                            <input {...getThumbnailInputProps()} />
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                                            <p className="text-xs text-gray-500">PNG, JPG or WEBP (Max 2MB)</p>
                                        </div>
                                        <InputError message={errors.thumbnail} className="mt-2" />
                                        {thumbnailPreview && (
                                            <div className="mt-4 relative w-full h-48 group">
                                                <img src={thumbnailPreview} alt="Preview" className="h-full w-full object-cover rounded-lg shadow-sm" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={removeThumbnail}><X className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                             </div>

                             <div className="space-y-6">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>Gallery Images</CardTitle>
                                        <CardDescription>Additional photos for the details page.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div {...getGalleryRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isGalleryDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"}`}>
                                            <input {...getGalleryInputProps()} />
                                            <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="mt-2 text-xs text-gray-600 font-medium">Upload Multiple Files</p>
                                        </div>
                                        <InputError message={errors.gallery} className="mt-2" />

                                        {galleryPreviews.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                {galleryPreviews.map((file, index) => (
                                                    <div key={index} className="relative group aspect-square">
                                                        <img src={file.preview} className="h-full w-full object-cover rounded-md border" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeGalleryImage(index)}><X className="h-3 w-3" /></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                             </div>
                        </TabsContent>

                        <TabsContent value="translations" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle>Content Translations</CardTitle><CardDescription>Manage content for multiple languages.</CardDescription></CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="en" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4"><TabsTrigger value="en">English (EN)</TabsTrigger><TabsTrigger value="id">Indonesian (ID)</TabsTrigger></TabsList>
                                        <TabsContent value="en" className="space-y-4"><TranslationForm locale="en" data={data.translations.en} errors={errors} onChange={handleTranslationChange} /></TabsContent>
                                        <TabsContent value="id" className="space-y-4"><TranslationForm locale="id" data={data.translations.id} errors={errors} onChange={handleTranslationChange} /></TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ✅ Add-ons Content */}
                        <TabsContent value="addons" className="mt-4">
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

                    <div className="flex justify-end pt-4"><Button type="submit" size="lg" disabled={processing}>{processing ? "Saving..." : "Create Activity"}</Button></div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

function TranslationForm({ locale, data, errors, onChange }) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div><Label htmlFor={`name_${locale}`}>Activity Name ({locale.toUpperCase()}) <span className="text-red-500">*</span></Label><Input id={`name_${locale}`} value={data.name} onChange={(e) => onChange(locale, "name", e.target.value)} /><InputError message={errors[`translations.${locale}.name`]} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor={`location_${locale}`}>Location</Label><Input id={`location_${locale}`} value={data.location} onChange={(e) => onChange(locale, "location", e.target.value)} /><InputError message={errors[`translations.${locale}.location`]} className="mt-1" /></div>
                <div><Label htmlFor={`category_${locale}`}>Category</Label><Input id={`category_${locale}`} value={data.category} onChange={(e) => onChange(locale, "category", e.target.value)} placeholder="e.g. Water Sport" /><InputError message={errors[`translations.${locale}.category`]} className="mt-1" /></div>
            </div>
            <div><Label htmlFor={`desc_${locale}`}>Description</Label><Textarea id={`desc_${locale}`} value={data.description} onChange={(e) => onChange(locale, "description", e.target.value)} rows={6} /><InputError message={errors[`translations.${locale}.description`]} className="mt-1" /></div>
        </div>
    );
}
