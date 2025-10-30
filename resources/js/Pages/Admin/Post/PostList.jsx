import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function PostList({ posts, onEdit, onDelete }) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judul</TableHead>
            <TableHead>Penulis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Diterbitkan Pada</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.data.length > 0 ? (
            posts.data.map(post => (
              <TableRow key={post.id} className={post.status !== 'published' ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell>
                  <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="capitalize">
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>{post.published_at}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(post)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(post)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="5" className="h-24 text-center">
                Tidak ada postingan.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {posts.links && posts.meta && posts.meta.last_page > 1 && (
        <div className="p-4 border-t">
          <Pagination links={posts.links} />
        </div>
      )}
    </>
  );
}
