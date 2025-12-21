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
    ArrowLeft, User, Phone, Mail, MapPin, Clock, Calendar, Users,
    Car, Plane, Ticket, Briefcase, MessageSquare, Wallet, Compass,
    Building2, Flag, Baby, Luggage, CheckCircle2, XCircle, AlertCircle,
    CreditCard, Package, PlusCircle, Tag
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
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const formatAddons = (addons) => {
    if (!addons) return null;
    if (typeof addons === 'string') return addons;
    if (Array.isArray(addons)) {
        if (addons.length === 0) return null;
        return addons.map(addon => {
            if (typeof addon === 'string') return addon;
            if (addon.name) {
                return addon.price
                    ? `${addon.name} (${formatCurrency(addon.price)})`
                    : addon.name;
            }
            return JSON.stringify(addon);
        }).join(', ');
    }
    return null;
};

// ✅ UPDATED: Added explicit handling for 'partially_paid' style
const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        paid: "bg-green-100 text-green-800 border-green-200",
        settlement: "bg-green-100 text-green-800 border-green-200",
        partially_paid: "bg-orange-100 text-orange-800 border-orange-200", // ✅ DISTINCT STYLE
        refund: "bg-blue-100 text-blue-800 border-blue-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
        expire: "bg-gray-100 text-gray-800 border-gray-200",
        failure: "bg-red-100 text-red-800 border-red-200",
    };

    // Normalize status label
    let label = status;
    if (status === 'settlement') label = 'Paid';
    if (status === 'partially_paid') label = 'Partially Paid';

    return <Badge variant="outline" className={`${styles[status] || "bg-gray-100"} capitalize px-2 py-0.5`}>{label}</Badge>;
};

const getVal = (data, key, ...alts) => {
    const keys = [key, ...alts];
    for (const k of keys) {
        if (data?.[k] !== undefined && data?.[k] !== null && data?.[k] !== "") return data[k];
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (data?.[snakeKey] !== undefined && data?.[snakeKey] !== null) return data[snakeKey];
    }
    return null;
};

// --- LOGIC TO RESOLVE ITEM NAME ---
const getOrderItemName = (item, details) => {
    const addons = details?.addons || details?.selected_addons;
    if (Array.isArray(addons)) {
        const matchedAddon = addons.find(a =>
            typeof a === 'object' &&
            Math.abs(Number(a.price) - Number(item.price)) < 1
        );
        if (matchedAddon) return { name: matchedAddon.name, isAddon: true };
    }
    if (item.orderable && item.orderable.name) {
        return { name: item.orderable.name, isAddon: false };
    }
    if (item.name) return { name: item.name, isAddon: false };
    return { name: "Unknown Item", isAddon: false };
};


// --- SUB-COMPONENTS ---

// 1. Payment Parser
const PaymentMethodDetail = ({ transaction }) => {
    if (!transaction) return <span className="text-muted-foreground italic">No payment info</span>;

    let payload = {};
    try {
        payload = typeof transaction.payment_payloads === 'string'
            ? JSON.parse(transaction.payment_payloads)
            : transaction.payment_payloads;
    } catch (e) { console.error("JSON Parse Error", e); }

    const type = transaction.payment_type;

    if (type === 'bank_transfer' && payload?.va_numbers?.[0]) {
        const va = payload.va_numbers[0];
        return (
            <div className="flex flex-col">
                <span className="font-bold text-gray-800 uppercase">{va.bank} Virtual Account</span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded border">{va.va_number}</span>
                </div>
            </div>
        );
    }
    if (type === 'echannel') {
        return (
            <div className="flex flex-col">
                <span className="font-bold text-gray-800">Mandiri Bill Payment</span>
                <span className="text-xs text-muted-foreground">Biller: {payload.biller_code}</span>
                <span className="font-mono text-sm">Key: {payload.bill_key}</span>
            </div>
        );
    }
    if (['gopay', 'qris', 'shopeepay'].includes(type)) {
        return (
            <div className="flex flex-col">
                <span className="font-bold text-gray-800 capitalize">{type.replace('_', ' ')}</span>
                <span className="text-xs text-muted-foreground">Instant Payment</span>
            </div>
        );
    }
    if (type === 'credit_card') {
        return (
            <div className="flex flex-col">
                <span className="font-bold text-gray-800">Credit Card</span>
                <span className="text-xs text-muted-foreground uppercase">{payload.bank} - {payload.card_type}</span>
                <span className="font-mono text-sm">**** **** **** {payload.masked_card}</span>
            </div>
        );
    }
    return <span className="capitalize font-medium">{type?.replace(/_/g, ' ') || 'Unknown Method'}</span>;
};

// 2. Timeline
const OrderTimeline = ({ order, effectiveStatus }) => { // ✅ Accept computed status
    const steps = [
        { status: 'created', label: 'Order Created', date: order.created_at, active: true },
        // If partially paid, we show it as "active" but distinct
        {
            status: 'paid',
            label: effectiveStatus === 'partially_paid' ? 'Down Payment Paid' : 'Payment Success',
            date: order.transaction?.status === 'settlement' ? order.transaction.updated_at : null,
            active: ['paid', 'settlement', 'partially_paid'].includes(effectiveStatus)
        },
        { status: 'completed', label: 'Order Complete', date: null, active: false }
    ];

    if (['cancelled', 'expire', 'refund'].includes(effectiveStatus)) {
        steps.push({ status: 'cancelled', label: 'Cancelled / Refunded', date: order.updated_at, active: true, error: true });
    }

    return (
        <div className="relative flex items-center justify-between w-full mb-8 mt-4 px-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
            {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${step.error ? 'border-red-500 bg-red-50 text-red-600' : (step.active ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-200')}`}>
                        {step.error ? <XCircle className="w-5 h-5" /> : (step.active ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />)}
                    </div>
                    <span className={`text-xs font-medium mt-2 ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                    {step.date && <span className="text-[10px] text-muted-foreground mt-0.5">{new Date(step.date).toLocaleDateString()}</span>}
                </div>
            ))}
        </div>
    );
};

// 3. Detail Helpers
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
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3 text-muted-foreground/70" />} {label}
            </span>
            <span className="text-sm font-medium text-gray-900 break-words leading-snug">{value}</span>
        </div>
    );
};

// --- SERVICE RENDERERS ---
const TripPlannerDetails = ({ details }) => {
    const contactName = details.type === 'company' ? getVal(details, 'companyName', 'company_name') : getVal(details, 'fullName', 'full_name');
    const displayAddons = formatAddons(getVal(details, 'addons', 'selected_addons'));

    return (
        <div className="space-y-6">
            <div>
                <SectionHeader icon={Compass} title="Trip Overview" />
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Destination" value={details.city} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Start Date" value={getVal(details, 'departureDate', 'departure_date')} icon={Calendar} />
                    <DetailItem label="Duration" value={`${details.duration} Days`} icon={Clock} />
                </div>
            </div>
            <div>
                <SectionHeader icon={Flag} title="Preferences" />
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Add-ons" value={displayAddons || 'None'} icon={PlusCircle} className="col-span-2" />
                </div>
            </div>
            <div>
                <SectionHeader icon={User} title="Contact" />
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Name" value={contactName} icon={User} />
                    <DetailItem label="Phone" value={getVal(details, 'phone', 'phone_number')} icon={Phone} />
                </div>
            </div>
        </div>
    );
};

const OpenTripDetails = ({ details }) => {
    // Priority fix: show only what was actually purchased during checkout
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));

    return (
        <div className="space-y-8">
            {/* 1. Guest & Contact Details */}
            <div>
                <SectionHeader icon={User} title="Lead Guest Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Full Name" value={details.full_name} icon={User} />
                    <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                    <DetailItem label="Email Address" value={details.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={details.phone_number} icon={Phone} />
                </div>
            </div>

            {/* 2. Group Composition */}
            <div>
                <SectionHeader icon={Users} title="Group Size" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                    <DetailItem label="Adults" value={details.adults} icon={User} />
                    <DetailItem label="Children" value={details.children || "0"} icon={Baby} />
                    <DetailItem label="Total Participants" value={`${details.total_pax} Pax`} icon={Users} />
                </div>
            </div>

            {/* 3. Travel Logistics */}
            <div>
                <SectionHeader icon={MapPin} title="Travel Logistics" />
                <div className="grid grid-cols-1 gap-y-4 gap-x-8">
                    <DetailItem label="Meeting/Pickup Point" value={details.pickup_location} icon={MapPin} className="col-span-2" />
                </div>
            </div>

            {/* 4. Financial Snapshot at Booking */}
            <div>
                <SectionHeader icon={Wallet} title="Pricing Snapshot" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Price Per Pax" value={formatCurrency(details.price_per_pax)} icon={Tag} />
                    <DetailItem label="Base Subtotal" value={formatCurrency(details.base_subtotal)} icon={Briefcase} />
                    {details.discount_applied > 0 && (
                        <DetailItem
                            label="Discount Applied"
                            value={`-${formatCurrency(details.discount_applied)}`}
                            className="text-red-600 font-bold"
                        />
                    )}
                </div>
            </div>

            {/* 5. Selected Extras */}
            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Selected Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}
        </div>
    );
};

const CarRentalDetails = ({ details }) => {
    // ✅ FIX: Prioritize 'selected_addons' (purchased) over 'addons' (catalog)
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));

    return (
        <div className="space-y-8">
            {/* 1. Vehicle Information */}
            <div>
                <SectionHeader icon={Car} title="Vehicle Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Brand & Model" value={`${details.brand} ${details.car_model}`} icon={Car} />
                    <DetailItem label="Rental Duration" value={`${details.total_days} Days`} icon={Clock} />
                </div>
            </div>

            {/* 2. Pickup & Contact */}
            <div>
                <SectionHeader icon={MapPin} title="Logistics & Contact" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Pickup Location" value={details.pickup_location} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Pickup Time" value={details.pickup_time} icon={Clock} />
                    <DetailItem label="Contact Number" value={details.phone_number} icon={Phone} />
                </div>
            </div>

            {/* 3. Financial Snapshot */}
            <div>
                <SectionHeader icon={Wallet} title="Pricing Snapshot" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Price Per Day" value={formatCurrency(details.price_per_day)} icon={Tag} />
                    {details.discount_applied > 0 && (
                        <DetailItem
                            label="Discount Applied"
                            value={`-${formatCurrency(details.discount_applied)}`}
                            className="text-red-600 font-bold"
                        />
                    )}
                </div>
            </div>

            {/* 4. Selected Extras */}
            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Selected Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}
        </div>
    );
};
const HolidayPackageDetails = ({ details }) => {
const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));
    return (
        <div className="space-y-8">
            {/* 1. Guest & Contact Details */}
            <div>
                <SectionHeader icon={User} title="Guest Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Full Name (Lead)" value={details.full_name} icon={User} />
                    <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                    <DetailItem label="Email Address" value={details.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={details.phone_number} icon={Phone} />
                </div>
            </div>

            {/* 2. Group Composition */}
            <div>
                <SectionHeader icon={Users} title="Group Size & Composition" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                    <DetailItem label="Adults" value={details.adults} icon={User} />
                    <DetailItem label="Children" value={details.children || "0"} icon={Baby} />
                    <DetailItem label="Total Participants" value={`${details.total_pax} Pax`} icon={Users} />
                </div>
            </div>

            {/* 3. Travel & Logistics */}
            <div>
                <SectionHeader icon={Plane} title="Logistics & Travel" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Pickup Location" value={details.pickup_location} icon={MapPin} className="col-span-2" />
                    <DetailItem label="Flight Number" value={details.flight_number || "Not Provided"} icon={Plane} />
                    <DetailItem label="Duration" value={`${details.duration} Days`} icon={Clock} />
                </div>
            </div>

            {/* 4. Booking Snapshot (Financial Audit) */}
            <div>
                <SectionHeader icon={Wallet} title="Pricing Snapshot at Booking" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Price Per Pax" value={formatCurrency(details.price_per_pax)} icon={Tag} />
                    <DetailItem label="Base Subtotal" value={formatCurrency(details.base_subtotal)} icon={Briefcase} />
                    {details.discount_applied > 0 && (
                        <DetailItem label="Discount Applied" value={`-${formatCurrency(details.discount_applied)}`} className="text-red-600" />
                    )}
                </div>
            </div>

            {/* 5. Extras */}
            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Selected Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}
        </div>
    );
};

const ActivityDetails = ({ details }) => {
    const activityName = getVal(details, 'name') || getVal(details, 'activity_name') || getVal(details, 'service_name');

    // ✅ FIX PRIORITY: Check 'selected_addons' first to show only what the user purchased
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));

    return (
        <div className="space-y-8">
            {/* Activity Highlight */}
            {activityName && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                    <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Activity Selected</span>
                    <div className="text-orange-900 font-bold text-lg">{activityName}</div>
                </div>
            )}

            {/* 1. Guest Information */}
            <div>
                <SectionHeader icon={User} title="Guest Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Full Name" value={details.full_name} icon={User} />
                    <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                    <DetailItem label="Email Address" value={details.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={details.phone_number} icon={Phone} />
                </div>
            </div>

            {/* 2. Schedule & Logistics */}
            <div>
                <SectionHeader icon={Ticket} title="Booking Specifics" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Participants" value={`${details.quantity} Pax`} icon={Users} />
                    <DetailItem label="Preferred Time" value={details.activity_time} icon={Clock} />
                    <DetailItem label="Pickup Location" value={details.pickup_location} icon={MapPin} className="col-span-2" />
                </div>
            </div>

            {/* 3. Pricing Snapshot (Audit Trail) */}
            <div>
                <SectionHeader icon={Wallet} title="Pricing Snapshot at Booking" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <DetailItem label="Price Per Person" value={formatCurrency(details.price_per_person)} icon={Tag} />
                    <DetailItem label="Base Subtotal" value={formatCurrency(details.base_subtotal)} icon={Briefcase} />
                    {details.discount_applied > 0 && (
                        <DetailItem
                            label="Discount Applied"
                            value={`-${formatCurrency(details.discount_applied)}`}
                            className="text-red-600 font-bold"
                        />
                    )}
                </div>
            </div>

            {/* 4. Selected Extras */}
            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Selected Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}

            {/* 5. Service Reference (From Model) */}
            {details.notes && (
                <div className="pt-4 border-t">
                    <DetailItem label="Service Notes" value={details.notes} icon={AlertCircle} />
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function Show({ auth, order }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const paidTransaction = order.transaction;
    const isRefundable = paidTransaction && paidTransaction.status === "settlement";
    const booking = order.booking;
    const bookableType = booking?.bookable_type || "";

    const rawDetails = booking?.details || {};
    const bookable = booking?.bookable || {};
    const snapshotDetails = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;
    const combinedDetails = { ...bookable, ...snapshotDetails };
    const specialRequest = getVal(combinedDetails, 'special_request');

    const totalAmount = Number(order.total_amount) || 0;
    const transactionAmount = Number(order.transaction?.gross_amount) || 0;

    const isSettled = ['settlement', 'capture', 'paid'].includes(order.status) || order.transaction?.status === 'settlement';

    // ✅ CRITICAL LOGIC: If settled amount < total amount, it IS a down payment/partial payment.
    const isDownPayment = isSettled && transactionAmount > 0 && transactionAmount < totalAmount;

    const paidAmount = isSettled ? transactionAmount : 0;
    const remainingBalance = totalAmount - paidAmount;

    // ✅ FORCE STATUS OVERRIDE
    // If it's a down payment, show "partially_paid" even if DB says "settlement"
    const displayStatus = isDownPayment ? 'partially_paid' : order.status;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route("admin.orders.index")}>
                        <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Order #{order.order_number}</h2>
                </div>
            }
        >
            <Head title={`Order ${order.order_number}`} />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                {/* 1. STATUS & TIMELINE CARD */}
                <Card className="mb-8 border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-white to-gray-50/50">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-2xl font-bold text-gray-900">Order #{order.order_number}</CardTitle>

                                    {/* ✅ PAYMENT BADGE */}
                                    {isDownPayment ? (
                                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white border-none text-xs px-2.5 py-0.5 shadow-sm">
                                            Down Payment
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 text-xs px-2.5 py-0.5">
                                            Full Payment
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-3.5 h-3.5" /> Placed on {formatDate(order.created_at)}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Status</span>
                                {/* ✅ DISPLAY COMPUTED STATUS */}
                                {getStatusBadge(displayStatus)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* ✅ PASS COMPUTED STATUS TO TIMELINE */}
                        <OrderTimeline order={order} effectiveStatus={displayStatus} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Main Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 2. ITEMS ORDERED TABLE */}
                        <Card>
                            <CardHeader><CardTitle>Items Ordered</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="pl-6">Item Description</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right pr-6">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items.map((item) => {
                                            const { name, isAddon } = getOrderItemName(item, combinedDetails);

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {isAddon ? <PlusCircle className="w-4 h-4 text-orange-500" /> : <Ticket className="w-4 h-4 text-blue-500" />}
                                                            <div className="font-semibold text-gray-900">{name}</div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 capitalize ml-6">
                                                            {isAddon ? 'Add-on' : item.orderable_type.split('\\').pop().replace(/([A-Z])/g, ' $1').trim()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right pr-6 font-medium">{formatCurrency(item.price)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* TOTALS */}
                                <div className="p-6 bg-slate-50 border-t flex flex-col items-end gap-2">
                                    <div className="w-full max-w-[280px] flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                                    </div>

                                    {Number(order.discount_amount) > 0 && (
                                        <div className="w-full max-w-[280px] flex justify-between text-sm text-muted-foreground">
                                            <span>Discount</span><span className="text-red-500 font-medium">-{formatCurrency(order.discount_amount)}</span>
                                        </div>
                                    )}

                                    {/* ✅ CONDITIONAL DOWN PAYMENT */}
                                    {isDownPayment && (
                                        <>
                                            <div className="w-full max-w-[280px] flex justify-between text-sm text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded">
                                                <span>Down Payment (Paid)</span><span>{formatCurrency(paidAmount)}</span>
                                            </div>
                                            <div className="w-full max-w-[280px] flex justify-between text-sm text-orange-700 font-medium border-t border-orange-200 border-dashed pt-2 mt-1">
                                                <span>Remaining Balance</span><span>{formatCurrency(remainingBalance)}</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="w-full max-w-[280px] flex justify-between text-lg font-bold border-t border-slate-200 pt-3 mt-1 text-slate-900">
                                        <span>Total Amount</span><span>{formatCurrency(order.total_amount)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. BOOKING SPECIFICS */}
                        {booking && (
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <Briefcase className="w-5 h-5" /> Service Information
                                    </CardTitle>
                                    <CardDescription>Detailed requirements for this booking.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {bookableType.includes("TripPlanner") && <TripPlannerDetails details={combinedDetails} />}
                                    {bookableType.includes("CarRental") && <CarRentalDetails details={combinedDetails} />}
                                    {bookableType.includes("HolidayPackage") && <HolidayPackageDetails details={combinedDetails} />}
                                    {bookableType.includes("Activity") && <ActivityDetails details={combinedDetails} />}
                                    {bookableType.includes("OpenTrip") && <OpenTripDetails details={combinedDetails} />}


                                    {!bookableType.match(/(TripPlanner|CarRental|HolidayPackage|Activity|OpenTrip)/) && (
                                    <div className="text-center py-8 text-muted-foreground italic">No specific service details available.</div>
                                    )}

                                    {specialRequest && (
                                        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 shadow-sm">
                                            <MessageSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                                            <div>
                                                <h5 className="text-amber-800 font-bold text-xs uppercase tracking-wide mb-1">Special Request</h5>
                                                <p className="text-amber-900 text-sm italic leading-relaxed">"{specialRequest}"</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar Info (Customer, Transaction, History) */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <Card>
                            <CardHeader className="pb-3 border-b"><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {order.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-semibold text-gray-900 truncate">{order.user.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="w-3 h-3" /> Registered User
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <DetailItem label="Email Address" value={order.user.email} icon={Mail} />
                                    <DetailItem label="Phone Number" value={order.user.phone_number || "Not Provided"} icon={Phone} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transaction */}
                        <Card className="border-blue-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-blue-50/80 border-b border-blue-100 pb-3">
                                <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4"/> Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 space-y-5">
                                {order.transaction ? (
                                    <>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Method</span>
                                            <PaymentMethodDetail transaction={order.transaction} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <DetailItem label="Amount Paid" value={formatCurrency(order.transaction.gross_amount)} icon={Wallet} />
                                            <DetailItem label="Payment Date" value={formatDate(order.transaction.updated_at)} icon={Clock} />
                                        </div>
                                        <div className="pt-3 border-t border-dashed">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-muted-foreground">Transaction ID</span>
                                                {/* Display computed status here too if you like, otherwise use raw status */}
                                                <Badge variant="outline" className="text-[10px] bg-white">{order.transaction.status}</Badge>
                                            </div>
                                            <span className="font-mono text-xs text-gray-600 break-all bg-gray-50 px-2 py-1 rounded block mt-1">
                                                {order.transaction.transaction_code || order.transaction.id}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded bg-slate-50">
                                        No successful transaction found.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History */}
                        {order.transactions && order.transactions.length > 1 && (
                            <Card>
                                <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">Transaction History</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            {order.transactions.map(trx => (
                                                <TableRow key={trx.id} className="hover:bg-transparent">
                                                    <TableCell className="py-3 pl-4">
                                                        <div className="font-medium text-xs">{formatDate(trx.created_at)}</div>
                                                        <div className="text-[10px] text-muted-foreground capitalize">{trx.payment_type?.replace(/_/g, ' ')}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-3 pr-4">
                                                        <Badge variant={trx.status === 'settlement' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                            {trx.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
