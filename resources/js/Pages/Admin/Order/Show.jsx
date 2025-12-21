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
    CreditCard, Package, PlusCircle, Tag, ChevronDown, ListChecks, Info
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// ==========================================
// --- 1. GLOBAL HELPERS ---
// ==========================================

/**
 * Formats numbers into IDR currency format
 */
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

/**
 * Standard date and time formatter
 */
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

/**
 * Formats the Travel Date specifically (Day Month Year)
 */
const formatTravelDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

/**
 * Formats add-ons specifically to show what was purchased.
 * Checks selected_addons first to match the order amount correctly.
 */
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

/**
 * Returns a styled badge based on order transaction status
 */
const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        paid: "bg-green-100 text-green-800 border-green-200",
        settlement: "bg-green-100 text-green-800 border-green-200",
        partially_paid: "bg-orange-100 text-orange-800 border-orange-200",
        refund: "bg-blue-100 text-blue-800 border-blue-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
        expire: "bg-gray-100 text-gray-800 border-gray-200",
        failure: "bg-red-100 text-red-800 border-red-200",
    };

    let label = status;
    if (status === 'settlement') label = 'Paid';
    if (status === 'partially_paid') label = 'Partially Paid';

    return <Badge variant="outline" className={`${styles[status] || "bg-gray-100"} capitalize px-2.5 py-0.5`}>{label}</Badge>;
};

/**
 * Safely retrieves values from nested data objects with multiple key fallbacks
 */
const getVal = (data, key, ...alts) => {
    const keys = [key, ...alts];
    for (const k of keys) {
        if (data?.[k] !== undefined && data?.[k] !== null && data?.[k] !== "") return data[k];
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (data?.[snakeKey] !== undefined && data?.[snakeKey] !== null) return data[snakeKey];
    }
    return null;
};

/**
 * FIXED: Matches order items to names with better fallback for Car Rentals
 */
const getOrderItemName = (item, details) => {
    // 1. Check if it's an addon
    const addons = details?.selected_addons || details?.addons;
    if (Array.isArray(addons)) {
        const matchedAddon = addons.find(a =>
            typeof a === 'object' &&
            Math.abs(Number(a.price) - Number(item.price)) < 1
        );
        if (matchedAddon) return { name: matchedAddon.name, isAddon: true };
    }

    // 2. Check orderable relationship name
    if (item.orderable && item.orderable.name) return { name: item.orderable.name, isAddon: false };

    // 3. Check hardcoded name column in DB
    if (item.name) return { name: item.name, isAddon: false };

    // 4. Fallback to Snapshot Data (Handles Car Rental brand + model)
    const snapshotName = getVal(details, 'service_name', 'name', 'activity_name');
    if (snapshotName) return { name: snapshotName, isAddon: false };

    if (details?.brand && details?.car_model) {
        return { name: `${details.brand} ${details.car_model}`, isAddon: false };
    }

    return { name: "Service Item", isAddon: false };
};

// ==========================================
// --- 2. LAYOUT SUB-COMPONENTS ---
// ==========================================

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

const CatalogReference = ({ title, icon: Icon, children }) => (
    <div className="mt-8 pt-6 border-t border-dashed">
        <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none outline-none">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                    {title}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                {children}
            </div>
        </details>
    </div>
);

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
                <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded border mt-1 w-fit">{va.va_number}</span>
            </div>
        );
    }
    return <span className="capitalize font-medium">{type?.replace(/_/g, ' ') || 'Unknown Method'}</span>;
};

const OrderTimeline = ({ order, effectiveStatus }) => {
    const steps = [
        { status: 'created', label: 'Order Created', date: order.created_at, active: true },
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

// ==========================================
// --- 3. SERVICE SPECIFIC RENDERERS ---
// ==========================================

const HolidayPackageDetails = ({ details }) => {
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));
    return (
        <div className="space-y-8">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Holiday Package Selected</span>
                <div className="text-emerald-900 font-bold text-lg">{getVal(details, 'service_name', 'name')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <SectionHeader icon={User} title="Guest & Group Info" />
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Lead Guest" value={details.full_name} icon={User} className="col-span-2" />
                        <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                        <DetailItem label="Contact Number" value={details.phone_number} icon={Phone} />
                        <DetailItem label="Adults" value={details.adults} icon={User} />
                        <DetailItem label="Children" value={details.children || "0"} icon={Baby} />
                    </div>
                </div>
                <div className="space-y-6">
                    <SectionHeader icon={Calendar} title="Travel Schedule" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Trip Start Date" value={formatTravelDate(details.trip_start)} icon={Calendar} />
                        <DetailItem label="Pickup Point" value={details.pickup_location} icon={MapPin} />
                        <DetailItem label="Flight Num" value={details.flight_number || "Not Provided"} icon={Plane} />
                        <DetailItem label="Duration" value={`${details.duration} Days`} icon={Clock} />
                    </div>
                </div>
            </div>

            <CatalogReference title="View Package Itinerary & Specs" icon={Package}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h5 className="font-bold text-sm border-b pb-1 flex items-center gap-2"><ListChecks className="w-3.5 h-3.5"/> Itinerary Highlights</h5>
                        <div className="text-xs text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: details.itinerary }} />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h5 className="font-bold text-sm text-green-700 border-b pb-1">What's Included</h5>
                            <div className="text-xs text-gray-600 mt-2 prose prose-sm" dangerouslySetInnerHTML={{ __html: details.cost_includes }} />
                        </div>
                        <div>
                            <h5 className="font-bold text-sm text-red-700 border-b pb-1">What's Excluded</h5>
                            <div className="text-xs text-gray-600 mt-2 prose prose-sm" dangerouslySetInnerHTML={{ __html: details.cost_excludes }} />
                        </div>
                    </div>
                </div>
            </CatalogReference>
        </div>
    );
};

const ActivityDetails = ({ details }) => {
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));
    return (
        <div className="space-y-8">
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Activity Selected</span>
                <div className="text-orange-900 font-bold text-lg">{getVal(details, 'name', 'activity_name', 'service_name')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <SectionHeader icon={User} title="Participant Information" />
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Lead Guest" value={details.full_name} icon={User} className="col-span-2" />
                        <DetailItem label="Email" value={details.email} icon={Mail} className="col-span-2" />
                        <DetailItem label="Quantity" value={`${details.quantity} Pax`} icon={Users} />
                        <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                    </div>
                </div>
                <div className="space-y-6">
                    <SectionHeader icon={Clock} title="Logistics & Pricing Audit" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Activity Date" value={formatTravelDate(details.booked_for)} icon={Calendar} />
                        <DetailItem label="Preferred Time" value={details.activity_time} icon={Clock} />
                        <DetailItem label="Pickup Point" value={details.pickup_location} icon={MapPin} />
                        <DetailItem label="Price snapshot" value={`${formatCurrency(details.price_per_person)} / Pax`} icon={Tag} />
                    </div>
                </div>
            </div>

            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Purchased Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}

            <CatalogReference title="View Activity Description & Info" icon={Ticket}>
                <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: details.description }} />
            </CatalogReference>
        </div>
    );
};

const OpenTripDetails = ({ details }) => {
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));
    return (
        <div className="space-y-8">
            <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg shadow-sm">
                <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">Open Trip Selected</span>
                <div className="text-cyan-900 font-bold text-lg">{getVal(details, 'service_name', 'name')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <SectionHeader icon={Users} title="Fulfillment Data" />
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Lead Guest" value={details.full_name} className="col-span-2" />
                        <DetailItem label="Contact" value={details.phone_number} icon={Phone} />
                        <DetailItem label="Nationality" value={details.participant_nationality} icon={Flag} />
                        <DetailItem label="Group size" value={`${details.total_pax} Pax (${details.adults} Ad, ${details.children || 0} Ch)`} icon={Users} className="col-span-2" />
                    </div>
                </div>
                <div className="space-y-6">
                    <SectionHeader icon={Calendar} title="Travel Schedule" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Trip Date" value={formatTravelDate(details.trip_start)} icon={Calendar} />
                        <DetailItem label="Meeting Point" value={details.pickup_location} icon={MapPin} />
                        <DetailItem label="Price snapshot" value={`${formatCurrency(details.price_per_pax)} / Pax`} icon={Tag} />
                        <DetailItem label="Base Subtotal" value={formatCurrency(details.base_subtotal)} icon={Wallet} />
                    </div>
                </div>
            </div>

            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Purchased Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}

            <CatalogReference title="View Trip Details & Itinerary" icon={Compass}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h5 className="font-bold text-sm border-b pb-1 flex items-center gap-2"><ListChecks className="w-3.5 h-3.5"/> Full Itinerary</h5>
                        <div className="text-xs text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: details.itinerary }} />
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-bold text-sm border-b pb-1">Included Services</h5>
                        <div className="text-xs text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: details.cost_includes }} />
                    </div>
                </div>
            </CatalogReference>
        </div>
    );
};

const CarRentalDetails = ({ details }) => {
    const displayAddons = formatAddons(getVal(details, 'selected_addons', 'addons'));
    return (
        <div className="space-y-8">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Vehicle Selected</span>
                <div className="text-slate-900 font-bold text-lg">{`${details.brand} ${details.car_model}`}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <SectionHeader icon={Car} title="Vehicle Specs & Pickup" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Brand & Model" value={`${details.brand} ${details.car_model}`} icon={Car} />
                        <DetailItem label="Duration" value={`${details.total_days} Days`} icon={Calendar} />
                        <DetailItem label="Pickup Date" value={formatTravelDate(details.trip_start)} icon={Calendar} />
                        <DetailItem label="Pickup Time" value={details.pickup_time} icon={Clock} />
                        <DetailItem label="Pickup Location" value={details.pickup_location} icon={MapPin} />
                    </div>
                </div>
                <div className="space-y-6">
                    <SectionHeader icon={Wallet} title="Contact & Pricing Audit" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Contact Number" value={details.phone_number} icon={Phone} />
                        <DetailItem label="Price Per Day" value={formatCurrency(details.price_per_day)} icon={Tag} />
                        {details.discount_applied > 0 && (
                            <DetailItem label="Discount Applied" value={`-${formatCurrency(details.discount_applied)}`} className="text-red-600 font-bold" />
                        )}
                    </div>
                </div>
            </div>

            {displayAddons && (
                <div>
                    <SectionHeader icon={PlusCircle} title="Purchased Extras" />
                    <DetailItem label="Add-ons" value={displayAddons} />
                </div>
            )}

            <CatalogReference title="View Vehicle Specifications" icon={Car}>
                <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: details.description }} />
            </CatalogReference>
        </div>
    );
};

const TripPlannerDetails = ({ details }) => {
    const contactName = details.type === 'company' ? getVal(details, 'companyName', 'company_name') : getVal(details, 'fullName', 'full_name');
    return (
        <div className="space-y-8">
            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg shadow-sm">
                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Custom Service</span>
                <div className="text-purple-900 font-bold text-lg">Trip Planning Request</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <SectionHeader icon={Compass} title="Trip Overview" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Target Destination" value={details.city} icon={MapPin} />
                        <DetailItem label="Departure Date" value={getVal(details, 'departureDate', 'departure_date')} icon={Calendar} />
                        <DetailItem label="Desired Duration" value={`${details.duration} Days`} icon={Clock} />
                    </div>
                </div>
                <div>
                    <SectionHeader icon={User} title="Contact Details" />
                    <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Full Name" value={contactName} icon={User} />
                        <DetailItem label="Phone Number" value={getVal(details, 'phone', 'phone_number')} icon={Phone} />
                        <DetailItem label="Account Type" value={details.type} icon={Building2} className="capitalize" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// --- 4. MAIN EXPORT COMPONENT ---
// ==========================================

export default function Show({ auth, order }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const booking = order.booking;
    const bookableType = booking?.bookable_type || "";

    const rawDetails = booking?.details || {};
    const bookable = booking?.bookable || {};
    const snapshotDetails = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;

    // Merge database columns into combinedDetails
    const combinedDetails = {
        ...bookable,
        ...snapshotDetails,
        trip_start: booking?.start_date || booking?.booking_date,
        trip_end: booking?.end_date,
        booked_for: booking?.booking_date
    };

    const specialRequest = getVal(combinedDetails, 'special_request');

    const totalAmount = Number(order.total_amount) || 0;
    const transactionAmount = Number(order.transaction?.gross_amount) || 0;
    const isSettled = ['settlement', 'capture', 'paid'].includes(order.status) || order.transaction?.status === 'settlement';

    const isDownPayment = isSettled && transactionAmount > 0 && transactionAmount < totalAmount;
    const displayStatus = isDownPayment ? 'partially_paid' : order.status;

    const serviceConfig = {
        TripPlanner: { title: "Trip Planning Fulfillment", icon: Compass },
        CarRental: { title: "Car Rental Fulfillment", icon: Car },
        HolidayPackage: { title: "Holiday Package Fulfillment", icon: Package },
        Activity: { title: "Activity Fulfillment", icon: Ticket },
        OpenTrip: { title: "Open Trip Fulfillment", icon: MapPin },
    };
    const currentType = Object.keys(serviceConfig).find(key => bookableType.includes(key));
    const serviceInfo = serviceConfig[currentType] || { title: "Service Requirements", icon: Briefcase };
    const ServiceTitleIcon = serviceInfo.icon;

    return (
        <AuthenticatedLayout user={auth.user} header={
            <div className="flex items-center gap-4">
                <Link href={route("admin.orders.index")}><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Order Management</h2>
            </div>
        }>
            <Head title={`Order ${order.order_number}`} />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                <Card className="mb-8 border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-white to-gray-50/50 overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-2xl font-bold text-gray-900">Order #{order.order_number}</CardTitle>

                                    {!isSettled ? (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold uppercase tracking-tight px-2.5 py-0.5">Unpaid</Badge>
                                    ) : isDownPayment ? (
                                        <Badge className="bg-orange-600 text-white shadow-sm px-2.5 py-0.5 border-none font-bold uppercase tracking-tight">Down Payment</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black">Full Payment</Badge>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-2 mt-1 font-medium">
                                    <Calendar className="w-3.5 h-3.5" /> Placed on {formatDate(order.created_at)}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Current Fulfillment Status</span>
                                {getStatusBadge(displayStatus)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <OrderTimeline order={order} effectiveStatus={displayStatus} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-8">

                        <Card className="shadow-sm border-border/60">
                            <CardHeader className="border-b pb-3 bg-slate-50/30"><CardTitle className="text-lg">Items Purchased</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="pl-6 font-bold uppercase text-[10px]">Description</TableHead>
                                            <TableHead className="text-center font-bold uppercase text-[10px]">Qty</TableHead>
                                            <TableHead className="text-right pr-6 font-bold uppercase text-[10px]">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.order_items.map((item) => {
                                            const { name, isAddon } = getOrderItemName(item, combinedDetails);
                                            return (
                                                <TableRow key={item.id} className="hover:bg-transparent border-border/40">
                                                    <TableCell className="pl-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-md ${isAddon ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {isAddon ? <PlusCircle className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 leading-tight">{name}</div>
                                                                <div className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-tighter">
                                                                    {isAddon ? 'Service Add-on' : item.orderable_type.split('\\').pop().replace(/([A-Z])/g, ' $1').trim()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-gray-700">{item.quantity}</TableCell>
                                                    <TableCell className="text-right pr-6 font-black text-gray-900">{formatCurrency(item.price)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div className="p-6 bg-slate-50/80 border-t flex flex-col items-end gap-3 text-sm border-border/50">
                                    <div className="w-full max-w-[300px] flex justify-between text-muted-foreground font-medium">
                                        <span>Items Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    {Number(order.discount_amount) > 0 && <div className="w-full max-w-[300px] flex justify-between text-red-600 font-bold"><span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span></div>}
                                    {isDownPayment && (
                                        <>
                                            <div className="w-full max-w-[300px] flex justify-between text-blue-700 font-black bg-blue-50/80 px-2 py-1 rounded-sm"><span>Paid (DP)</span><span>{formatCurrency(transactionAmount)}</span></div>
                                            <div className="w-full max-w-[300px] flex justify-between text-orange-700 font-black border-t border-orange-200 border-dashed pt-2.5 mt-1"><span>Balance Due</span><span>{formatCurrency(order.total_amount - transactionAmount)}</span></div>
                                        </>
                                    )}
                                    <div className="w-full max-w-[300px] flex justify-between text-xl font-black border-t border-slate-300 pt-4 mt-2 text-slate-900"><span>Final Total</span><span>{formatCurrency(order.total_amount)}</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {booking && (
                            <Card className="overflow-hidden shadow-sm border-border/60">
                                <CardHeader className="bg-slate-50/50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-wide"><ServiceTitleIcon className="w-5 h-5" /> {serviceInfo.title}</CardTitle>
                                    <CardDescription className="text-xs">Fulfillment requirements defined at checkout.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {bookableType.includes("TripPlanner") && <TripPlannerDetails details={combinedDetails} />}
                                    {bookableType.includes("CarRental") && <CarRentalDetails details={combinedDetails} />}
                                    {bookableType.includes("HolidayPackage") && <HolidayPackageDetails details={combinedDetails} />}
                                    {bookableType.includes("Activity") && <ActivityDetails details={combinedDetails} />}
                                    {bookableType.includes("OpenTrip") && <OpenTripDetails details={combinedDetails} />}
                                    {specialRequest && (
                                        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-4 shadow-sm">
                                            <MessageSquare className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"/><div className="space-y-1"><h5 className="text-amber-800 font-black text-[10px] uppercase tracking-widest">Special Message</h5><p className="text-amber-900 text-sm italic font-medium">"{specialRequest}"</p></div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-sm border-border/60">
                            <CardHeader className="pb-3 border-b bg-slate-50/30"><CardTitle className="text-base font-bold">Customer Profile</CardTitle></CardHeader>
                            <CardContent className="pt-5 space-y-5">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-primary/20">{order.user.name.charAt(0).toUpperCase()}</div>
                                    <div className="overflow-hidden"><div className="font-black truncate text-gray-900 text-lg leading-none mb-1">{order.user.name}</div><div className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-widest"><User className="w-3 h-3" /> Registered Booking Client</div></div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <DetailItem label="Verified Email" value={order.user.email} icon={Mail} />
                                    <DetailItem label="Phone / WhatsApp" value={order.user.phone_number || "Not Provided"} icon={Phone} />
                                    <DetailItem label="Internal Account ID" value={`#USR-${order.user.id}`} icon={Info} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-100 shadow-sm overflow-hidden border-2">
                            <CardHeader className="bg-blue-50/80 border-b border-blue-100 pb-3"><CardTitle className="text-base text-blue-900 flex items-center gap-2 font-bold"><CreditCard className="w-4 h-4"/> Payment Transaction</CardTitle></CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {order.transaction ? <>
                                    <div className="space-y-2"><span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Settlement Method</span><PaymentMethodDetail transaction={order.transaction} /></div>
                                    <div className="grid grid-cols-2 gap-4 pt-1"><DetailItem label="Gross Received" value={formatCurrency(order.transaction.gross_amount)} icon={Wallet} /><DetailItem label="Payment Date" value={formatDate(order.transaction.updated_at)} icon={Clock} /></div>
                                    <div className="pt-4 border-t border-dashed border-blue-200">
                                        <div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Midtrans Reference</span><Badge variant="outline" className="text-[9px] bg-white h-4 font-black uppercase text-blue-700 border-blue-200">{order.transaction.status}</Badge></div>
                                        <span className="font-mono text-[10px] text-gray-700 break-all bg-white/50 px-2.5 py-2 rounded-sm block border border-blue-100 shadow-inner">{order.transaction.transaction_code || order.transaction.id}</span>
                                    </div>
                                </> : <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg bg-slate-50/50 italic font-medium">No successful transaction detected.</div>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
