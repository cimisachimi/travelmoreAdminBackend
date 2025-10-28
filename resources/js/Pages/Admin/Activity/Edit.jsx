import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/Components/ui/alert-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/Components/ui/tabs";
import React from "react";

// --- Reusable Translation Form Component ---
function TranslationForm({ locale, data, errors, onChange }) {
    return (
        <>
            <div>
                <Label htmlFor={`name_${locale}`}>Name</Label>
                <Input
                    id={`name_${locale}`}
                    value={data.name}
                    onChange={(e) => onChange(locale, "name", e.target.value)}
                />
                <InputError
                    message={errors[`translations.${locale}.name`]}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor={`location_${locale}`}>Location</Label>
                <Input
                    id={`location_${locale}`}
                    value={data.location}
                    onChange={(e) =>
                        onChange(locale, "location", e.target.value)
                    }
                />
                <InputError
                    message={errors[`translations.${locale}.location`]}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor={`category_${locale}`}>Category</Label>
                <Input
                    id={`category_${locale}`}
                    value={data.category}
                    onChange={(e) =>
                        onChange(locale, "category", e.target.value)
                    }
                    placeholder="e.g. Water Sport, Hiking"
                />
                <InputError
                    message={errors[`translations.${locale}.category`]}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor={`description_${locale}`}>Description</Label>
                <Textarea
                    id={`description_${locale}`}
                    value={data.description}
                    onChange={(e) =>
                        onChange(locale, "description", e.target.value)
                    }
                />
                <InputError
                    message={errors[`translations.${locale}.description`]}
                    className="mt-2"
                />
            </div>
        </>
    );
}

// --- Edit Form for Text-Only Fields ---
function EditActivityForm({ activity, errors }) {
    const { data, setData, put, processing } = useForm({
        // Non-translatable
        price: activity.price || 0,
        status: activity.status || "active",
        duration: activity.duration || "",
        // NO FILES HERE
        translations: {
            en: {
                name: activity.translations.en?.name || "",
                description: activity.translations.en?.description || "",
                location: activity.translations.en?.location || "",
                category: activity.translations.en?.category || "",
            },
            id: {
                name: activity.translations.id?.name || "",
                description: activity.translations.id?.description || "",
                location: activity.translations.id?.location || "",
                category: activity.translations.id?.category || "",
            },
        },
    });

    const handleTranslationChange = (locale, key, value) => {
        setData("translations", {
            ...data.translations,
            [locale]: {
                ...data.translations[locale],
                [key]: value,
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();
        // Use PUT request, which now works as it's not multipart
        put(route("admin.activities.update", activity.id), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activity Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="en" className="w-full">
                            <TabsList>
                                <TabsTrigger value="en">English</TabsTrigger>
                                <TabsTrigger value="id">Indonesian</TabsTrigger>
                            </TabsList>
                            <TabsContent value="en" className="mt-4">
                                <div className="space-y-4">
                                    <TranslationForm
                                        locale="en"
                                        data={data.translations.en}
                                        errors={errors}
                                        onChange={handleTranslationChange}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="id" className="mt-4">
                                <div className="space-y-4">
                                    <TranslationForm
                                        locale="id"
                                        data={data.translations.id}
                                        errors={errors}
                                        onChange={handleTranslationChange}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Settings Card */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="price">Price (IDR)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData("price", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.price}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="duration">Duration</Label>
                                <Input
                                    id="duration"
                                    name="duration"
                                    value={data.duration}
                                    onChange={(e) =>
                                        setData("duration", e.target.value)
                                    }
                                    placeholder="e.g. 3 Hours, Full Day"
                                />
                                <InputError
                                    message={errors.duration}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    name="status"
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData("status", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.status}
                                    className="mt-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Submit Button */}
                <div className="lg:col-span-3 flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </form>
    );
}

// --- Thumbnail Manager ---
const ThumbnailManager = ({ activity, errors }) => {
    const { processing } = useForm();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            router.post(
                route("admin.activities.thumbnail.update", activity.id),
                { thumbnail: file },
                { forceFormData: true, preserveScroll: true }
            );
        }
    };

    const triggerFileInput = () =>
        document.getElementById("thumbnail-upload-input").click();

    // --- FIX ---
    // Use `activity.thumbnail_url` which is the full URL from the accessor
    const thumbnailUrl = activity.thumbnail_url
        ? activity.thumbnail_url
        : `https://via.placeholder.com/1280x720.png?text=No+Thumbnail`;
    // --- END FIX ---

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative group aspect-video">
                    <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Button
                            onClick={triggerFileInput}
                            disabled={processing}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {processing ? "Uploading..." : "Upload New Thumbnail"}
                        </Button>
                        <input
                            id="thumbnail-upload-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>
                </div>
                <InputError message={errors.thumbnail} className="mt-2" />
            </CardContent>
        </Card>
    );
};

// --- Gallery Manager ---
const GalleryManager = ({ activity, errors }) => {
    const { data, setData, post, processing, errors: formErrors } = useForm({
        gallery: [],
    });

    const handleFileChange = (e) => {
        setData("gallery", Array.from(e.target.files));
    };

    const submitImages = (e) => {
        e.preventDefault();
        post(route("admin.activities.gallery.store", activity.id), {
            preserveScroll: true,
            onSuccess: () => {
                e.target.reset(); // Clear the file input
                setData("gallery", []);
            },
        });
    };

    const deleteImage = (imageId) => {
        if (confirm("Are you sure you want to delete this image?")) {
            router.delete(
                route("admin.activities.images.destroy", {
                    activity: activity.id,
                    image: imageId,
                }),
                { preserveScroll: true }
            );
        }
    };

    // --- FIX ---
    // Use `activity.images_url` from the accessor and filter out the thumbnail
    const galleryImages = activity.images_url.filter(
        (img) => img.type === "gallery"
    );
    // --- END FIX ---

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Upload New Images</h3>
                    <form
                        onSubmit={submitImages}
                        className="mt-2 flex flex-col sm:flex-row items-center gap-4"
                    >
                        <Input
                            id="gallery"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="flex-grow"
                        />
                        <Button type="submit" disabled={processing || data.gallery.length === 0} className="w-full sm:w-auto">
                            <Upload className="mr-2 h-4 w-4" /> Upload
                        </Button>
                    </form>
                    <InputError
                        message={formErrors.gallery || errors['gallery.*']}
                        className="mt-2"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-medium">Current Gallery</h3>
                    {/* Use the new `galleryImages` variable */}
                    {galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {/* Map over `galleryImages` */}
                            {galleryImages.map((image) => (
                                <div key={image.id} className="relative group">
                                    <img
                                        src={image.url} // This `image.url` is now the full URL
                                        alt="Gallery"
                                        className="w-full h-auto object-cover rounded-lg aspect-square"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => deleteImage(image.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground mt-4">
                            No gallery images uploaded.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// --- MAIN EDIT COMPONENT ---
export default function Edit({ auth, activity, errors: pageErrors = {} }) {
    const deleteActivity = (e) => {
        e.preventDefault();
        router.delete(route("admin.activities.destroy", activity.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route("admin.activities.index")}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Edit: {activity.name}
                        </h2>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the activity.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={deleteActivity}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            }
        >
            <Head title={`Edit Activity - ${activity.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Tabs defaultValue="settings" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="gallery">Media</TabsTrigger>
                        </TabsList>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="mt-6">
                            <EditActivityForm activity={activity} errors={pageErrors} />
                        </TabsContent>

                        {/* Gallery Tab */}
                        <TabsContent value="gallery" className="mt-6">
                            <div className="space-y-6">
                                <ThumbnailManager
                                    activity={activity}
                                    errors={pageErrors}
                                />
                                <GalleryManager
                                    activity={activity}
                                    errors={pageErrors}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
