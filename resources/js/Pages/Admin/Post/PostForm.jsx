import React from 'react';
import QuillEditor from '@/Components/QuillEditor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import InputError from '@/Components/InputError';
import { X } from 'lucide-react';

export default function PostForm({
  data,
  setData, // Ini adalah fungsi setData dari useForm
  errors,
  handleImageChange,
  existingImages = [],
  newImagePreviews = [],
  removeExistingImage,
  removeNewImagePreview
}) {

  // ✅ --- FIX ---
  // Menggunakan functional update untuk setData.
  // Ini mencegah "stale state" dan memastikan kita selalu
  // memodifikasi state terbaru.
  const handleTranslationChange = (locale, field, value) => {
    setData(data => ({
      ...data,
      [locale]: {
        ...data[locale],
        [field]: value
      }
    }));
  };
  // ✅ --- END FIX ---

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Main Content Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Konten Postingan</CardTitle>
            <CardDescription>Isi detail postingan Anda dalam kedua bahasa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English (EN)</TabsTrigger>
                <TabsTrigger value="idn">Indonesian (ID)</TabsTrigger>
              </TabsList>

              {/* English Tab */}
              <TabsContent value="en" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="en_title">Judul (EN)</Label>
                  <Input
                    id="en_title"
                    value={data.en.title}
                    onChange={(e) => handleTranslationChange('en', 'title', e.target.value)}
                  />
                  <InputError message={errors['en.title']} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="en_excerpt">Kutipan (EN)</Label>
                  <Textarea
                    id="en_excerpt"
                    value={data.en.excerpt}
                    onChange={(e) => handleTranslationChange('en', 'excerpt', e.target.value)}
                  />
                  <InputError message={errors['en.excerpt']} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="en_content">Konten (EN)</Label>
                  <QuillEditor
                    value={data.en.content}
                    onChange={(content) => handleTranslationChange('en', 'content', content)}
                  />
                  <InputError message={errors['en.content']} className="mt-2" />
                </div>
              </TabsContent>

              {/* Indonesian Tab */}
              <TabsContent value="idn" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="idn_title">Judul (ID)</Label>
                  <Input
                    id="idn_title"
                    value={data.idn.title}
                    onChange={(e) => handleTranslationChange('idn', 'title', e.target.value)}
                  />
                  <InputError message={errors['idn.title']} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="idn_excerpt">Kutipan (ID)</Label>
                  <Textarea
                    id="idn_excerpt"
                    value={data.idn.excerpt}
                    onChange={(e) => handleTranslationChange('idn', 'excerpt', e.target.value)}
                  />
                  <InputError message={errors['idn.excerpt']} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="idn_content">Konten (ID)</Label>
                  <QuillEditor
                    value={data.idn.content}
                    onChange={(content) => handleTranslationChange('idn', 'content', content)}
                  />
                  <InputError message={errors['idn.content']} className="mt-2" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setData('status', value)} defaultValue={data.status}>
              <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Terbitkan</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.status} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gambar</CardTitle>
            <CardDescription>Unggah satu atau lebih gambar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Gambar yang Ada</Label>
            {existingImages.length > 0 ? (
              <div className="mb-4 grid grid-cols-2 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img src={`/storage/${image.url}`} alt="Existing" className="rounded-md object-cover w-full h-32" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeExistingImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground mb-4">Tidak ada gambar.</p>}
            <InputError message={errors.deleted_images} className="mt-2" />

            <Label htmlFor="images">Tambah Gambar Baru</Label>
            <Input
              id="images"
              type="file"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            <InputError message={errors.images} className="mt-2" />

            {newImagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {newImagePreviews.map((src, index) => (
                  <div key={index} className="relative group">
                    <img src={src} alt={`Preview ${index + 1}`} className="rounded-md object-cover w-full h-32" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeNewImagePreview(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
