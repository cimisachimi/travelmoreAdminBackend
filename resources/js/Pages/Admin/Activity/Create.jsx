import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
    images: [],

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

  // --- Image States and Dropzone Logic ---
  const [imagePreviews, setImagePreviews] = useState([]);

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setImagePreviews((prev) => [...prev, ...newFiles]);
    setData("images", [...data.images, ...newFiles]);
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setData(
      "images",
      data.images.filter((_, i) => i !== index)
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    multiple: true,
  });
  // --- End Image Logic ---

  const submit = (e) => {
    e.preventDefault();
    // Set 'Content-Type' to 'multipart/form-data'
    post(route("admin.activities.store"), {
      forceFormData: true,
    });
  };

  // Helper for updating nested translation state
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

                    {/* English Tab */}
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

                    {/* Indonesian Tab */}
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

                {/* Image Upload Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                    <CardDescription>
                      Upload images for the activity. The
                      first image will be the thumbnail.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive
                          ? "border-primary"
                          : "border-gray-300"
                        }`}
                    >
                      <input {...getInputProps()} />
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {isDragActive
                          ? "Drop the files here..."
                          : "Drag 'n' drop files here, or click to select"}
                      </p>
                    </div>
                    <InputError
                      message={errors.images}
                      className="mt-2"
                    />

                    {/* Previews */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {imagePreviews.map(
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
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                removeImage(
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
          onChange={(e) => onChange(locale, "location", e.target.value)}
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
          onChange={(e) => onChange(locale, "category", e.target.value)}
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