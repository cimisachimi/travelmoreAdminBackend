import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/Components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/Components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Package, Megaphone, Star, Percent, Tag, XCircle } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function DiscountCodeIndex({ auth, discountCodes, activeBanner }) {

  const deleteCode = (code) => {
    if (confirm('Are you sure you want to delete this discount code?')) {
      router.delete(route('admin.discount-codes.destroy', code.id), { preserveScroll: true });
    }
  };

  const toggleBanner = (code) => {
    router.post(route('admin.discount-codes.toggle-banner', code.id), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout user={auth.user} header="Discount Codes">
      <Head title="Discount Codes" />

      <div className="space-y-6">

        {/* ✅ NEW: Banner Preview Section */}
        <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Megaphone className="h-5 w-5 text-indigo-600" />
                    Website Header Banner
                </CardTitle>
                <CardDescription>
                    This is exactly how the active discount appears to your customers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {activeBanner ? (
                    <div className="space-y-2">
                        {/* The Preview Bar */}
                        <div className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                    <Tag className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight">Special Offer Active!</p>
                                    <p className="text-indigo-100 text-sm mt-0.5">
                                        Get <span className="font-bold text-white">{activeBanner.type === 'percent' ? `${activeBanner.value}%` : formatCurrency(activeBanner.value)} OFF</span> with code:
                                        <span className="ml-2 font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-white/20 shadow-sm">
                                            {activeBanner.code}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => toggleBanner(activeBanner)}
                                variant="secondary"
                                className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-sm font-semibold shrink-0"
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Deactivate Banner
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed border-indigo-200 rounded-xl bg-white/50">
                        <Megaphone className="h-10 w-10 mb-3 text-indigo-200" />
                        <p className="font-medium text-indigo-900">No active banner</p>
                        <p className="text-xs text-indigo-400">Select a code from the list below to display it on your website.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* List Section */}
        <Card>
            <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                <CardTitle>Manage Codes</CardTitle>
                <CardDescription>Create and manage promotional codes.</CardDescription>
                </div>
                <Link href={route('admin.discount-codes.create')}>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Code</Button>
                </Link>
            </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {discountCodes.data.length > 0 ? (
                    discountCodes.data.map((code) => {
                    // Check if this specific code row is the active banner
                    const isBanner = activeBanner && activeBanner.id === code.id;

                    return (
                        <TableRow key={code.id} className={isBanner ? "bg-indigo-50/60 hover:bg-indigo-100/50 transition-colors" : ""}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`text-base px-3 py-1 ${isBanner ? 'border-indigo-500 text-indigo-700 bg-indigo-100' : ''}`}>
                                <Package className="mr-2 h-4 w-4 opacity-50" />
                                {code.code}
                            </Badge>
                            {isBanner && (
                                <Badge className="bg-indigo-600 hover:bg-indigo-700 gap-1 shadow-sm animate-in fade-in zoom-in">
                                    <Star className="h-3 w-3 fill-current" /> Active Banner
                                </Badge>
                            )}
                            </div>
                        </TableCell>
                        <TableCell className="capitalize">
                            <div className="flex items-center gap-2">
                                {code.type === 'percent' ? <Percent className="h-4 w-4 text-gray-400" /> : <Tag className="h-4 w-4 text-gray-400" />}
                                {code.type}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                            {code.type === 'percent' ? `${code.value}%` : formatCurrency(code.value)}
                        </TableCell>
                        <TableCell>
                            <span className={code.max_uses && code.uses >= code.max_uses ? "text-red-500 font-bold" : ""}>
                                {code.uses}
                            </span>
                            <span className="text-gray-400 mx-1">/</span>
                            {code.max_uses || '∞'}
                        </TableCell>
                        <TableCell>
                            {code.expires_at ? new Date(code.expires_at).toLocaleDateString('en-GB') : <span className="text-gray-400 italic">Never</span>}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                {/* Toggle Banner Action */}
                                <DropdownMenuItem onClick={() => toggleBanner(code)} className="cursor-pointer">
                                    {isBanner ? (
                                        <><XCircle className="mr-2 h-4 w-4 text-red-500" /> Disable Banner</>
                                    ) : (
                                        <><Megaphone className="mr-2 h-4 w-4 text-indigo-600" /> Set as Banner</>
                                    )}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem asChild>
                                <Link href={route('admin.discount-codes.edit', code.id)} className="flex items-center cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                onClick={() => deleteCode(code)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center cursor-pointer"
                                >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                    })
                ) : (
                    <TableRow><TableCell colSpan="6" className="h-24 text-center text-muted-foreground">No discount codes found.</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
            {discountCodes.links && <div className="p-4 border-t"><Pagination links={discountCodes.links} /></div>}
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
