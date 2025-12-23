import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
    ArrowLeft,
    Clock,
    MapPin,
    Star,
    CheckCircle2,
    XCircle,
    Edit,
    Info,
    List,
    Image as ImageIcon,
    DollarSign,
    Link as LinkIcon,
    Layers
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";

// Helper to format currency consistently with your Index page
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericAmount);
};

export default function Show({ auth, package: holidayPackage }) {
    // Extract translations for easy access
    const enTranslation = holidayPackage.translations?.find(t => t.locale === 'en') || {};
    const idTranslation = holidayPackage.translations?.find(t => t.locale === 'id') || {};

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.packages.index')}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Package Details: {holidayPackage.name}
                        </h2>
                    </div>
                    <Link href={route('admin.packages.edit', holidayPackage.id)}>
                        <Button className="shadow-md">
                            <Edit className="mr-2 h-4 w-4" /> Edit Package
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title={`Package Details - ${holidayPackage.name}`} />

            <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Header Stats / Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-gray-400">Visibility</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {holidayPackage.is_active ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Published
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-gray-500">
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Draft Mode
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-gray-400">Duration</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-500" />
                            <span className="text-2xl font-bold">{holidayPackage.duration} Days</span>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-gray-400">Customer Rating</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl font-bold">{Number(holidayPackage.rating || 0).toFixed(1)}</span>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-gray-400">Base Location</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" />
                            <span className="text-lg font-bold truncate">{holidayPackage.location || 'Not Specified'}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                        <TabsTrigger value="overview" className="rounded-lg"><Info className="w-4 h-4 mr-2" /> Content & Slugs</TabsTrigger>
                        <TabsTrigger value="pricing" className="rounded-lg"><DollarSign className="w-4 h-4 mr-2" /> Pricing & Addons</TabsTrigger>
                        <TabsTrigger value="itinerary" className="rounded-lg"><List className="w-4 h-4 mr-2" /> Itinerary</TabsTrigger>
                        <TabsTrigger value="gallery" className="rounded-lg"><ImageIcon className="w-4 h-4 mr-2" /> Gallery</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB: Contains Localized Content and Slugs */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-emerald-600" />
                                    Localized Descriptions
                                </CardTitle>
                                <CardDescription>URL Slugs are automatically updated based on the package name.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* English View */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-emerald-600 border-b pb-2">English (EN)</h4>
                                    <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-dashed border-emerald-200">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                                            <LinkIcon className="w-3 h-3" /> SEO URL Slug
                                        </div>
                                        <code className="text-sm text-emerald-700 dark:text-emerald-400 break-all font-mono">
                                            {enTranslation.slug || 'Pending Generation...'}
                                        </code>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="font-bold text-lg">{enTranslation.name}</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed italic">
                                            {enTranslation.description || 'No English description provided.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Indonesian View */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-emerald-600 border-b pb-2">Indonesian (ID)</h4>
                                    <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-dashed border-emerald-200">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                                            <LinkIcon className="w-3 h-3" /> SEO URL Slug
                                        </div>
                                        <code className="text-sm text-emerald-700 dark:text-emerald-400 break-all font-mono">
                                            {idTranslation.slug || 'Pending Generation...'}
                                        </code>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="font-bold text-lg">{idTranslation.name}</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed italic">
                                            {idTranslation.description || 'No Indonesian description provided.'}
                                        </p>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PRICING TAB */}
                    <TabsContent value="pricing" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Pricing Tiers</CardTitle>
                                    <CardDescription>Price per person based on group size.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {holidayPackage.price_tiers?.map((tier, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Guest Range</span>
                                                    <span className="font-bold text-sm">{tier.min_pax} - {tier.max_pax || '∞'} Pax</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Rate</span>
                                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(tier.price)}</span>
                                                </div>
                                            </div>
                                        )) || <p className="text-muted-foreground italic">No pricing configured.</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Optional Add-ons</CardTitle>
                                    <CardDescription>Extra services available for selection.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {holidayPackage.addons?.map((addon, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 border rounded-xl">
                                                <span className="font-medium text-sm">{addon.name}</span>
                                                <span className="font-bold text-emerald-600">+{formatCurrency(addon.price)}</span>
                                            </div>
                                        )) || <p className="text-muted-foreground italic text-center py-4">No optional addons defined.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ITINERARY TAB */}
                    <TabsContent value="itinerary" className="mt-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Schedule Breakdown</CardTitle>
                                <CardDescription>Day-by-day plan for this trip.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 relative">
                                {holidayPackage.itinerary?.map((item, i) => (
                                    <div key={i} className="flex gap-6 relative group">
                                        {/* Visual Timeline Line */}
                                        {i !== holidayPackage.itinerary.length - 1 && (
                                            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-200 transition-colors" />
                                        )}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-600 z-10 border-2 border-white dark:border-gray-800">
                                            {item.day}
                                        </div>
                                        <div className="pb-4 space-y-1">
                                            <h5 className="font-bold text-lg text-gray-900 dark:text-gray-100">{item.title}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                )) || <p className="text-muted-foreground italic text-center py-8">No itinerary days added yet.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* GALLERY TAB */}
                    <TabsContent value="gallery" className="mt-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Image Gallery</CardTitle>
                                <CardDescription>Visual assets used for the listing.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {holidayPackage.images?.map((img, i) => (
                                        <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50">
                                            <img
                                                src={img.full_url}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={`Package visualization ${i}`}
                                            />
                                            {img.type === 'thumbnail' && (
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="bg-emerald-600 shadow-lg border-none">Main Cover</Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!holidayPackage.images || holidayPackage.images.length === 0) && (
                                        <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-gray-400">
                                            <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                                            <p className="text-xs font-medium uppercase tracking-widest">No images uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
