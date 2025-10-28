import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/Components/ui/tabs";

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        // Non-translatable
        price: 0,
        status: "active",
        duration: "",

        // Image fields
        thumbnail: null,
        gallery: [],

        // Translatable
        translations: {
            en: {
                name: "",
                description: "",
                location: "",
                category: "",
            },
            id: {
                name: "",
                description: "",
                location: "",
                category: "",
            },
        },
    });

    // --- Thumbnail States ---
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const onThumbnailDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setThumbnailPreview(URL.createObjectURL(file));
            setData("thumbnail", file);
        }
    };

    const removeThumbnail = () => {
        setThumbnailPreview(null);
        setData("thumbnail", null);
    };

    const {
        getRootProps: getThumbnailRootProps,
        getInputProps: getThumbnailInputProps,
        isDragActive: isThumbnailDragActive,
    } = useDropzone({
        onDrop: onThumbnailDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
        multiple: false,
    });
    // --- End Thumbnail Logic ---

    // --- Gallery States ---
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const onGalleryDrop = (acceptedFiles) => {
        const newFiles = acceptedFiles.map((file) =>
            Object.assign(file, {
                preview: URL.createObjectURL(file),
            })
        );
        setGalleryPreviews((prev) => [...prev, ...newFiles]);
        setData("gallery", [...data.gallery, ...newFiles]);
    };

    const removeGalleryImage = (index) => {
        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
        setData(
            "gallery",
            data.gallery.filter((_, i) => i !== index)
        );
    };

    const {
        getRootProps: getGalleryRootProps,
        getInputProps: getGalleryInputProps,
        isDragActive: isGalleryDragActive,
    } = useDropzone({
        onDrop: onGalleryDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
        multiple: true,
    });
    // --- End Gallery Logic ---

    const submit = (e) => {
        e.preventDefault();
        // useForm automatically detects file uploads
        // and sends as multipart/form-data
        post(route("admin.activities.store"));
    };

    const handleTranslationChange = (locale, key, value) => {
        setData("translations", {
            ...data.translations,
            [locale]: {
                ...data.translations[locale],
                [key]: value,
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route("admin.activities.index")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Create New Activity
                    </h2>
                </div>
            }
        >
            <Head title="Create Activity" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Details Card */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Activity Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs
                                        defaultValue="en"
                                        className="w-full"
                                    >
                                        <TabsList>
                                            <TabsTrigger value="en">
                                                English
                                            </TabsTrigger>
                                            <TabsTrigger value="id">
                                                Indonesian
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent
                                            value="en"
                                            className="mt-4"
                                        >
                                            <div className="space-y-4">
                                                <TranslationForm
                                                    locale="en"
                                                    data={data.translations.en}
                                                    errors={errors}
                                                    onChange={
                                                        handleTranslationChange
                                                    }
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent
                                            value="id"
                                            className="mt-4"
                                        >
                                            <div className="space-y-4">
                                                <TranslationForm
                                                    locale="id"
                                                    data={data.translations.id}
                                                    errors={errors}
                                                    onChange={
                                                        handleTranslationChange
                                                    }
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Settings & Image Card */}
                            <div className="space-y-6">
                                {/* Settings Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="price">
                                                Price (IDR)
                                            </Label>
                                            <Input
                                                id="price"
                                                name="price"
                                                type="number"
                                                value={data.price}
                                                onChange={(e) =>
                                                    setData(
                                                        "price",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.price}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="duration">
                                                Duration
                                            </Label>
                                            <Input
                                                id="duration"
                                                name="duration"
                                                value={data.duration}
                                                onChange={(e) =>
                                                    setData(
                                                        "duration",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g. 3 Hours, Full Day"
                                            />
                                            <InputError
                                                message={errors.duration}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="status">
                                                Status
                                            </Label>
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

                                {/* Thumbnail Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Thumbnail</CardTitle>
                                        <CardDescription>
                                            Upload the main image for the
                                            activity.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            {...getThumbnailRootProps()}
                                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                                                isThumbnailDragActive
                                                    ? "border-primary"
                                                    : "border-gray-300 dark:border-gray-600"
                                            }`}
                                        >
                                            <input
                                                {...getThumbnailInputProps()}
                                            />
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {isThumbnailDragActive
                                                    ? "Drop file here"
                                                    : "Drag 'n' drop or click"}
                                            </p>
                                        </div>
                                        <InputError
                                            message={errors.thumbnail}
                                            className="mt-2"
                                        />
                                        {thumbnailPreview && (
                                            <div className="mt-4 relative w-full h-32">
                                                <img
                                                    src={thumbnailPreview}
                                                    alt="Thumbnail Preview"
                                                    className="h-full w-full object-cover rounded-md"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={removeThumbnail}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Gallery Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Gallery</CardTitle>
                                        <CardDescription>
                                            Upload additional images for the
                                            gallery.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            {...getGalleryRootProps()}
                                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                                                isGalleryDragActive
                                                    ? "border-primary"
                                                    : "border-gray-300 dark:border-gray-600"
                                            }`}
                                        >
                                            <input
                                                {...getGalleryInputProps()}
                                            />
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {isGalleryDragActive
                                                    ? "Drop files here"
                                                    : "Drag 'n' drop (multiple)"}
                                            </p>
                                        </div>
                                        <InputError
                                            message={
                                                errors.gallery ||
                                                errors["gallery.*"]
                                            }
                                            className="mt-2"
                                        />
                                        <div className="mt-4 grid grid-cols-3 gap-4">
                                            {galleryPreviews.map(
                                                (file, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={file.preview}
                                                            alt="Preview"
                                                            className="h-24 w-full object-cover rounded-md"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() =>
                                                                removeGalleryImage(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Submit Button */}
                            <div className="lg:col-span-3 flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? "Saving..."
                                        : "Create Activity"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Reusable Translation Form Component
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
