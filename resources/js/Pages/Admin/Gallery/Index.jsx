import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import Pagination from "@/Components/Pagination"; // Assuming you have this component
import { toast } from "sonner"; // Assuming you use sonner or similar

export default function GalleryIndex({ galleries }) {
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gallery item?")) {
      router.delete(route("admin.galleries.destroy", id), {
        onSuccess: () => toast.success("Gallery item deleted"),
        onError: () => toast.error("Failed to delete item"),
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gallery Management</h2>}
    >
      <Head title="Gallery" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gallery Items</CardTitle>
                <CardDescription>Manage your photo gallery, descriptions, and redirect links.</CardDescription>
              </div>
              <Button asChild>
                <Link href={route("admin.galleries.create")}>
                  <Plus className="mr-2 h-4 w-4" /> Add New
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Best Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {galleries.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        No gallery items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    galleries.data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-12 w-12 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.best_time || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "Active" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={route("admin.galleries.edit", item.id)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination links={galleries.links} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
