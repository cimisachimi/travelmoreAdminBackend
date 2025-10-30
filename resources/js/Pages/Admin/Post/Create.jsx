import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import PostForm from './PostForm'; // The re-usable form
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const emptyForm = {
  status: 'draft',
  images: [],
  en: { title: '', excerpt: '', content: '' },
  idn: { title: '', excerpt: '', content: '' },
};

export default function CreatePost({ auth }) {
  const { data, setData, post, processing, errors, reset } = useForm(emptyForm);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setData('images', files);
    setNewImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const removeNewImagePreview = (index) => {
    const newPreviews = [...newImagePreviews];
    newPreviews.splice(index, 1);
    setNewImagePreviews(newPreviews);

    const newImages = [...data.images];
    newImages.splice(index, 1);
    setData('images', newImages);
  };

  const handleSave = (e) => {
    e.preventDefault();
    post(route('admin.posts.store'), {
      onSuccess: () => {
        toast.success("Postingan berhasil dibuat!");
        reset();
        setNewImagePreviews([]);
      },
      onError: (err) => {
        console.error(err);
        toast.error("Gagal membuat postingan. Periksa error.");
      }
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.posts.index')}>
            <Button variant="outline" size="icon" aria-label="Back to Posts">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Buat Postingan Baru
          </h2>
        </div>
      }
    >
      <Head title="Buat Postingan Baru" />

      <form onSubmit={handleSave}>
        <div className="py-12">
          <div className="space-y-6 sm:px-6 lg:px-8">
            <PostForm
              data={data}
              setData={setData}
              errors={errors}
              handleImageChange={handleImageChange}
              newImagePreviews={newImagePreviews}
              removeNewImagePreview={removeNewImagePreview}
              existingImages={[]} // No existing images on create
              removeExistingImage={() => {}}
            />
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-end sm:px-6 lg:px-8">
            <Link href={route('admin.posts.index')}>
              <Button variant="outline" type="button" disabled={processing}>
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={processing} className="ml-2">
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Postingan
            </Button>
          </div>
        </div>
      </form>
    </AuthenticatedLayout>
  );
}
