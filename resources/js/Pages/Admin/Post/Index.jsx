import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { PlusCircle } from 'lucide-react';
import PostList from './PostList'; // We re-use your PostList component
import { DeletePostDialog } from './ConfirmationDialogs'; // We re-use your dialog

export default function PostIndex({ auth, posts }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!postToDelete) return;

    router.delete(route('admin.posts.destroy', postToDelete.id), {
      preserveScroll: true,
      onSuccess: () => toast.success("Postingan berhasil dihapus."),
      onError: () => toast.error("Gagal menghapus postingan."),
      onFinish: () => {
        setShowDeleteDialog(false);
        setPostToDelete(null);
      }
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Blog Posts</h2>}
    >
      <Head title="Blog Posts" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Kelola Postingan Blog</CardTitle>
                  <CardDescription>Buat, edit, dan kelola semua artikel.</CardDescription>
                </div>
                <Link href={route('admin.posts.create')}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Buat Postingan Baru
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <PostList
                posts={posts} // This is the paginated list from the controller
                onEdit={(post) => router.get(route('admin.posts.edit', post.id))}
                onDelete={handleDeleteClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <DeletePostDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        postToDelete={postToDelete}
      />
    </AuthenticatedLayout>
  );
}
