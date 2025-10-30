import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import PostForm from './PostForm'; // The re-usable form
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { DeletePostDialog } from './ConfirmationDialogs';

export default function EditPost({ auth, post }) {
  // `post` is passed from PostController@edit

  const { data, setData, processing, errors } = useForm({
    _method: 'put',
    status: post.status,
    en: post.en || { title: '', excerpt: '', content: '' },
    idn: post.idn || { title: '', excerpt: '', content: '' },
    images: [], // For *new* images
    deleted_images: [], // For IDs of *existing* images to delete
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Populate existing images on component mount
  useEffect(() => {
    setExistingImages(post.images || []);
  }, [post.images]);

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

  const removeExistingImage = (imageId) => {
    setData('deleted_images', [...data.deleted_images, imageId]);
    setExistingImages(existingImages.filter(img => img.id !== imageId));
  };

  const handleSave = (e) => {
    e.preventDefault();
    router.post(route('admin.posts.update', post.id), data, {
      forceFormData: true, // Important for file uploads
      onSuccess: () => {
        toast.success("Postingan berhasil diperbarui!");
        // Reset form state after successful save
        setData({
          ...data,
          images: [],
          deleted_images: [],
        });
        setNewImagePreviews([]);
      },
      onError: (err) => {
        console.error(err);
        toast.error("Gagal memperbarui postingan. Periksa error.");
      }
    });
  };

  const handleDeleteConfirm = () => {
    router.delete(route('admin.posts.destroy', post.id), {
      onSuccess: () => {
        // No need for toast, Index page will show it
        // We are redirected to Index on success
      },
      onError: () => toast.error("Gagal menghapus postingan."),
      onFinish: () => setShowDeleteDialog(false)
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
            Edit Postingan
          </h2>
        </div>
      }
    >
      <Head title="Edit Postingan" />

      <form onSubmit={handleSave}>
        <div className="py-12">
          <div className="space-y-6 sm:px-6 lg:px-8">
            <PostForm
              data={data}
              setData={setData}
              errors={errors}
              handleImageChange={handleImageChange}
              existingImages={existingImages}
              newImagePreviews={newImagePreviews}
              removeExistingImage={removeExistingImage}
              removeNewImagePreview={removeNewImagePreview}
            />
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between sm:px-6 lg:px-8">
            <Button
              variant="destructive"
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              disabled={processing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
            <div className="flex items-center">
              <Link href={route('admin.posts.index')}>
                <Button variant="outline" type="button" disabled={processing}>
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={processing} className="ml-2">
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      </form>

      <DeletePostDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        postToDelete={post}
      />
    </AuthenticatedLayout>
  );
}
