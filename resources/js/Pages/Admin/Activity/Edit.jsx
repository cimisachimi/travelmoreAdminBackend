import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import { ArrowLeft, Trash2, Upload, Save, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/Components/ui/alert-dialog";

function TranslationForm({ locale, data, errors, onChange }) {
    return (
        <div className="space-y-4">
            <div><Label>Name ({locale.toUpperCase()})</Label><Input value={data.name} onChange={(e) => onChange(locale, "name", e.target.value)} /><InputError message={errors[`translations.${locale}.name`]} className="mt-1"/></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Location</Label><Input value={data.location} onChange={(e) => onChange(locale, "location", e.target.value)} /><InputError message={errors[`translations.${locale}.location`]} className="mt-1"/></div>
                <div><Label>Category</Label><Input value={data.category} onChange={(e) => onChange(locale, "category", e.target.value)} /><InputError message={errors[`translations.${locale}.category`]} className="mt-1"/></div>
            </div>
            <div><Label>Description</Label><Textarea value={data.description} onChange={(e) => onChange(locale, "description", e.target.value)} rows={6}/><InputError message={errors[`translations.${locale}.description`]} className="mt-1"/></div>
        </div>
    );
}

function EditActivityForm({ activity, errors }) {
    const { data, setData, put, processing } = useForm({
        is_active: Boolean(activity.is_active),
        price: activity.price || 0,
        status: activity.status || "active",
        duration: activity.duration || "",
        translations: {
            en: { name: activity.translations.en?.name || "", description: activity.translations.en?.description || "", location: activity.translations.en?.location || "", category: activity.translations.en?.category || "" },
            id: { name: activity.translations.id?.name || "", description: activity.translations.id?.description || "", location: activity.translations.id?.location || "", category: activity.translations.id?.category || "" },
        },
    });

    const handleTranslationChange = (locale, key, value) => { setData("translations", { ...data.translations, [locale]: { ...data.translations[locale], [key]: value } }); };
    const submit = (e) => { e.preventDefault(); put(route("admin.activities.update", activity.id), { preserveScroll: true }); };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Publish / Draft Toggle */}
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Checkbox id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        <Label htmlFor="is_active" className="font-semibold cursor-pointer">Publish to Frontend?</Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 ml-6">Toggling this will immediately affect visibility on the public website.</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Activity Details</CardTitle></CardHeader>
                    <CardContent>
                        <Tabs defaultValue="en">
                            <TabsList className="grid w-full grid-cols-2 mb-4"><TabsTrigger value="en">English (EN)</TabsTrigger><TabsTrigger value="id">Indonesian (ID)</TabsTrigger></TabsList>
                            <TabsContent value="en" className="mt-4"><TranslationForm locale="en" data={data.translations.en} errors={errors} onChange={handleTranslationChange} /></TabsContent>
                            <TabsContent value="id" className="mt-4"><TranslationForm locale="id" data={data.translations.id} errors={errors} onChange={handleTranslationChange} /></TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Core Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><Label>Price (IDR)</Label><Input type="number" value={data.price} onChange={(e) => setData("price", e.target.value)} /><InputError message={errors.price} className="mt-1" /></div>
                            <div><Label>Duration</Label><Input value={data.duration} onChange={(e) => setData("duration", e.target.value)} /><InputError message={errors.duration} className="mt-1" /></div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3 flex justify-end">
                    <Button type="submit" size="lg" disabled={processing}>
                        <Save className="w-4 h-4 mr-2" /> {processing ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </form>
    );
}

const ThumbnailManager = ({ activity, errors }) => {
    const { processing } = useForm();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { router.post(route("admin.activities.thumbnail.update", activity.id), { thumbnail: file }, { forceFormData: true, preserveScroll: true }); }
    };
    const triggerFileInput = () => document.getElementById("thumbnail-upload-input").click();
    const thumbnailUrl = activity.thumbnail_url ? activity.thumbnail_url : `https://via.placeholder.com/1280x720.png?text=No+Thumbnail`;

    return (
        <Card>
            <CardHeader><CardTitle>Thumbnail Image</CardTitle><CardDescription>Current main display image.</CardDescription></CardHeader>
            <CardContent>
                <div className="relative group aspect-video rounded-lg overflow-hidden border">
                    <img src={thumbnailUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={triggerFileInput} disabled={processing} variant="secondary"><Upload className="mr-2 h-4 w-4" /> Change Thumbnail</Button>
                        <input id="thumbnail-upload-input" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </div>
                </div>
                <InputError message={errors.thumbnail} className="mt-2" />
            </CardContent>
        </Card>
    );
};

const GalleryManager = ({ activity, errors }) => {
    const { data, setData, post, processing } = useForm({ gallery: [] });
    const handleFileChange = (e) => { setData("gallery", Array.from(e.target.files)); };
    const submitImages = (e) => { e.preventDefault(); post(route("admin.activities.gallery.store", activity.id), { preserveScroll: true, onSuccess: () => { document.getElementById("gallery-upload").value = ""; setData("gallery", []); }, }); };
    const deleteImage = (imageId) => { if (confirm("Delete image?")) { router.delete(route("admin.activities.images.destroy", { activity: activity.id, image: imageId }), { preserveScroll: true }); } };
    const galleryImages = activity.images_url.filter((img) => img.type === "gallery");

    return (
        <Card>
            <CardHeader><CardTitle>Gallery</CardTitle><CardDescription>Additional images associated with this activity.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                    <form onSubmit={submitImages} className="flex gap-4 items-center">
                        <Input id="gallery-upload" type="file" multiple onChange={handleFileChange} className="bg-background" />
                        <Button type="submit" disabled={processing || data.gallery.length === 0}>Upload Selected</Button>
                    </form>
                </div>
                {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImages.map((image) => (
                            <div key={image.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                                <img src={image.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="destructive" size="icon" onClick={() => deleteImage(image.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">No gallery images uploaded yet.</div>
                )}
            </CardContent>
        </Card>
    );
};

export default function Edit({ auth, activity, errors: pageErrors = {} }) {
    const deleteActivity = (e) => { e.preventDefault(); router.delete(route("admin.activities.destroy", activity.id)); };

    return (
        <AuthenticatedLayout user={auth.user} header={
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon"><Link href={route("admin.activities.index")}><ArrowLeft className="h-4 w-4" /></Link></Button>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Edit: {activity.name}</h2>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete Activity</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this Activity?</AlertDialogTitle>
                            <AlertDialogDescription className="text-red-600 font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Warning: This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteActivity} className="bg-destructive">Delete Permanently</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        }>
            <Head title={`Edit Activity - ${activity.name}`} />
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="settings">Settings & Content</TabsTrigger>
                        <TabsTrigger value="gallery">Media Gallery</TabsTrigger>
                    </TabsList>
                    <TabsContent value="settings" className="mt-6"><EditActivityForm activity={activity} errors={pageErrors} /></TabsContent>
                    <TabsContent value="gallery" className="mt-6 space-y-6"><ThumbnailManager activity={activity} errors={pageErrors} /><GalleryManager activity={activity} errors={pageErrors} /></TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
