import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Clock,
    Calendar,
    Users,
    Car,
    Plane,
    Ticket,
    Briefcase,
    MessageSquare,
    Wallet,
    Compass,
    Building2,
    Flag,
    Baby,
    Luggage
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// --- HELPERS ---
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusBadge = (status) => {
    switch (status) {
        case "pending": return <Badge variant="outline">Pending</Badge>;
        case "paid":
        case "settlement": return <Badge className="bg-green-600 text-white hover:bg-green-700">Paid</Badge>;
        case "partially_paid": return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Partial</Badge>;
        case "refund": return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Refunded</Badge>;
        case "cancelled":
        case "expire": return <Badge variant="destructive">{status}</Badge>;
        default: return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
};

// --- DATA PARSER HELPER ---
const getVal = (data, key, ...alts) => {
    const keys = [key, ...alts];
    for (const k of keys) {
        if (data?.[k] !== undefined && data?.[k] !== null && data?.[k] !== "") return data[k];
        // Try snake_case conversion
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (data?.[snakeKey] !== undefined && data?.[snakeKey] !== null) return data[snakeKey];
    }
    return null;
};

// --- SERVICE DETAIL SUB-COMPONENTS ---

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
    </div>
);

const DetailItem = ({ label, value, icon: Icon, className = "" }) => {
    if (!value) return null;
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
};

// 1. TRIP PLANNER RENDERER
const TripPlannerDetails = ({ details }) => {
    // Data mapping
    const type = getVal(details, 'type') || 'personal';
    const contactName = type === 'company' ? getVal(details, 'companyName', 'company_name') : getVal(details, 'fullName', 'full_name');
    const city = getVal(details, 'city');
    const tripType = getVal(details, 'tripType', 'trip_type');
    const brandName = getVal(details, 'brandName', 'brand_name');

    // Location Logic
    let location = city;
    if (tripType === 'domestic') location = `🇮🇩 ${city}, ${getVal(details, 'province')}`;
    if (tripType === 'foreign') location = `🌐 ${city}, ${getVal(details, 'country')}`;

    // Pax Logic
    const adults = parseInt(getVal(details, 'paxAdults', 'pax_adults') || 0);
    const kids = parseInt(getVal(details, 'paxKids', 'pax_kids') || 0);
    const teens = parseInt(getVal(details, 'paxTeens', 'pax_teens') || 0);
    const seniors = parseInt(getVal(details, 'paxSeniors', 'pax_seniors') || 0);
    const totalPax = adults + kids + teens + seniors;

    // Lists
    const travelStyle = getVal(details, 'travelStyle', 'travel_style');
    const displayTravelStyle = Array.isArray(travelStyle) ? travelStyle.join(', ') : travelStyle;

    const addons = getVal(details, 'addons');
    const displayAddons = Array.isArray(addons) ? addons.join(', ') : addons;

    return (
        <div className="space-y-6">
            {/* Trip Overview */}
            <div>
                <SectionHeader icon={Compass} title="Trip Overview" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Destination" value={location} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Travel Type" value={getVal(details, 'travelType', 'travel_type')?.replace(/_/g, ' ')} icon={Plane} />
                    <DetailItem label="Departure" value={getVal(details, 'departureDate', 'departure_date')} icon={Calendar} />
                    <DetailItem label="Duration" value={`${getVal(details, 'duration')} Days`} icon={Clock} />
                    <DetailItem label="Budget Pack" value={getVal(details, 'budgetPack', 'budget_pack')?.toUpperCase()} icon={Wallet} />
                </div>
            </div>

            {/* Preferences */}
            <div>
                <SectionHeader icon={Flag} title="Preferences" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Travel Style" value={displayTravelStyle} className="col-span-2" />
                    <DetailItem label="Add-ons" value={displayAddons} className="col-span-2" />
                    <DetailItem label="Must Visit" value={getVal(details, 'mustVisit', 'must_visit')} className="col-span-2" />
                </div>
            </div>

            {/* Organizer Info */}
            <div>
                <SectionHeader icon={type === 'company' ? Building2 : User} title={`Organizer (${type})`} />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Contact Name" value={contactName} />
                    {type === 'company' && <DetailItem label="Brand" value={brandName} />}

                    <div className="col-span-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1 mb-1">
                            <Users className="w-3 h-3" /> Participants ({totalPax})
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {adults > 0 && <Badge variant="outline">Adults: {adults}</Badge>}
                            {teens > 0 && <Badge variant="outline">Teens: {teens}</Badge>}
                            {kids > 0 && <Badge variant="outline">Kids: {kids}</Badge>}
                            {seniors > 0 && <Badge variant="outline">Seniors: {seniors}</Badge>}
                        </div>
                    </div>

                    <DetailItem label="Email" value={getVal(details, 'email')} icon={Mail} />
                    <DetailItem label="Phone" value={getVal(details, 'phone', 'phone_number')} icon={Phone} />
                </div>
            </div>
        </div>
    );
};

// 2. CAR RENTAL RENDERER
const CarRentalDetails = ({ details }) => {
    return (
        <div className="space-y-6">
            {/* Vehicle Info */}
            <div>
                <SectionHeader icon={Car} title="Vehicle Information" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Car Model" value={`${details.brand || ''} ${details.car_model || ''}`} />
                    <DetailItem label="License Plate" value={getVal(details, 'plate_number') || 'N/A'} />
                    <DetailItem label="Duration" value={`${getVal(details, 'total_days')} Day(s)`} icon={Clock} />
                    <DetailItem label="Transmission" value={details.transmission} />
                </div>
            </div>

            {/* Logistics */}
            <div>
                <SectionHeader icon={MapPin} title="Pickup & Contact" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Pickup Location" value={getVal(details, 'pickup_location')} />
                    <DetailItem label="Pickup Time" value={getVal(details, 'pickup_time')} icon={Clock} />
                    <DetailItem label="Renter Contact" value={getVal(details, 'phone_number')} icon={Phone} className="col-span-2" />
                </div>
            </div>
        </div>
    );
};

// 3. HOLIDAY PACKAGE RENDERER
const HolidayPackageDetails = ({ details }) => {
    const adults = getVal(details, 'adults') || 0;
    const children = getVal(details, 'children') || 0;

    return (
        <div className="space-y-6">
            {/* Guest Info */}
            <div>
                <SectionHeader icon={Users} title="Guest Information" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Lead Guest" value={getVal(details, 'full_name')} icon={User} />
                    <DetailItem label="Nationality" value={getVal(details, 'participant_nationality')} icon={Flag} />
                    <div className="col-span-2 flex gap-2">
                        <Badge variant="secondary" className="gap-1"><User className="w-3 h-3"/> {adults} Adults</Badge>
                        {children > 0 && <Badge variant="secondary" className="gap-1"><Baby className="w-3 h-3"/> {children} Children</Badge>}
                    </div>
                    <DetailItem label="Email" value={getVal(details, 'email')} icon={Mail} />
                    <DetailItem label="Phone" value={getVal(details, 'phone_number')} icon={Phone} />
                </div>
            </div>

            {/* Logistics */}
            <div>
                <SectionHeader icon={Luggage} title="Travel Logistics" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Pickup" value={getVal(details, 'pickup_location')} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Flight No." value={getVal(details, 'flight_number')} icon={Plane} />
                </div>
            </div>
        </div>
    );
};

// 4. ACTIVITY RENDERER
const ActivityDetails = ({ details }) => {
    return (
        <div className="space-y-6">
            <div>
                <SectionHeader icon={Ticket} title="Activity Details" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Guest Name" value={getVal(details, 'full_name')} icon={User} />
                    <DetailItem label="Participants" value={`${getVal(details, 'quantity')} Pax`} icon={Users} />
                    <DetailItem label="Pickup Location" value={getVal(details, 'pickup_location')} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Contact" value={getVal(details, 'phone_number')} icon={Phone} />
                    <DetailItem label="Email" value={getVal(details, 'email')} icon={Mail} />
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function Show({ auth, order }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const paidTransaction = order.transaction;
    const isRefundable = paidTransaction && paidTransaction.status === "settlement";

    // Resolve Booking Data
    const booking = order.booking;
    const bookableType = booking?.bookable_type || "";

    // ✅ FIX: MERGE SNAPSHOT AND LIVE DATA
    // We combine 'booking.details' (snapshot) with 'booking.bookable' (live DB record)
    // This ensures fields like 'city', 'pax_adults' from TripPlanner table are available.
    const rawDetails = booking?.details || {};
    const bookable = booking?.bookable || {};
    const snapshotDetails = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;

    // Combined object. Snapshot takes priority if keys overlap (though for TripPlanner, DB record is richer)
    const combinedDetails = { ...bookable, ...snapshotDetails };

    const specialRequest = getVal(combinedDetails, 'special_request');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route("admin.orders.index")}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        Order Details
                    </h2>
                </div>
            }
        >
            <Head title={`Order ${order.order_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: Main Order Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Items Ordered */}
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>Order #{order.order_number}</CardTitle>
                                    <CardDescription>{`Placed on ${formatDate(order.created_at)}`}</CardDescription>
                                </div>
                                {getStatusBadge(order.status)}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Description</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        Type: {item.orderable_type.split('\\').pop().replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pricing Summary */}
                                <div className="mt-6 flex flex-col items-end space-y-2">
                                    <div className="w-full max-w-xs flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="w-full max-w-xs flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-red-500">-{formatCurrency(order.discount_amount)}</span>
                                    </div>
                                    {order.down_payment_amount > 0 && (
                                         <div className="w-full max-w-xs flex justify-between text-sm">
                                            <span className="text-muted-foreground">Down Payment</span>
                                            <span className="text-blue-600">{formatCurrency(order.down_payment_amount)}</span>
                                        </div>
                                    )}
                                    <div className="w-full max-w-xs flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total</span>
                                        <span>{formatCurrency(order.total_amount)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Service Specific Details */}
                        {booking && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <Briefcase className="w-5 h-5" />
                                        Service Information
                                    </CardTitle>
                                    <CardDescription>
                                        Detailed specifications for this {bookableType.split('\\').pop()} booking.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {bookableType.includes("TripPlanner") && <TripPlannerDetails details={combinedDetails} />}
                                    {bookableType.includes("CarRental") && <CarRentalDetails details={combinedDetails} />}
                                    {bookableType.includes("HolidayPackage") && <HolidayPackageDetails details={combinedDetails} />}
                                    {bookableType.includes("Activity") && <ActivityDetails details={combinedDetails} />}

                                    {!bookableType.includes("TripPlanner") &&
                                     !bookableType.includes("CarRental") &&
                                     !bookableType.includes("HolidayPackage") &&
                                     !bookableType.includes("Activity") && (
                                        <div className="text-sm text-muted-foreground italic">No specific details available for this service type.</div>
                                    )}

                                    {specialRequest && (
                                        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                            <h5 className="text-amber-800 font-semibold text-sm flex items-center gap-2 mb-1">
                                                <MessageSquare className="w-4 h-4"/> Special Request
                                            </h5>
                                            <p className="text-amber-900 text-sm italic">"{specialRequest}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Customer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {order.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate">{order.user.name}</div>
                                        <div className="text-xs text-muted-foreground">Registered User</div>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{order.user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="w-4 h-4 shrink-0" />
                                        <span>{order.user.phone_number || "No Phone"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.transaction ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            {getStatusBadge(order.transaction.status)}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Method</span>
                                            <span className="font-medium capitalize">
                                                {order.transaction.payment_type.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Paid Amount</span>
                                            <span className="font-medium">{formatCurrency(order.transaction.gross_amount)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 pt-2 border-t">
                                            <span className="text-xs text-muted-foreground">Transaction ID</span>
                                            <span className="font-mono text-xs font-medium break-all">{order.transaction.transaction_code}</span>
                                        </div>

                                        {isRefundable && (
                                            <div className="pt-4 mt-2">
                                                <Link
                                                    href={route("admin.orders.refund", order.id)}
                                                    method="post"
                                                    as="button"
                                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3 shadow-sm transition-colors"
                                                    onBefore={() => confirm("Are you sure? This will refund the payment via Midtrans and cancel the order.")}
                                                >
                                                    Issue Full Refund
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                                        <span className="text-xs text-muted-foreground">No valid payment transaction found.</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
