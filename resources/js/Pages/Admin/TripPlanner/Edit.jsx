import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Badge } from "@/Components/ui/badge";
import { Phone, MessageCircle, AlertCircle, CheckCircle, PenTool, Send, RotateCcw, MapPin, Calendar, Users, Wallet } from "lucide-react";

// Helper for clean data display
const DetailRow = ({ label, value, fullWidth = false, icon: Icon }) => (
  <div className={`${fullWidth ? "col-span-2" : "col-span-1"} flex flex-col`}>
    <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1">
      {Icon && <Icon size={12} />}
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md border border-gray-100 dark:border-gray-800">
      {value || <span className="text-gray-400 italic">Not specified</span>}
    </dd>
  </div>
);

// Helper to format lists (arrays or JSON strings)
const formatList = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) return data.join(', ');
    if (typeof data === 'string' && data.startsWith('[')) {
        try { return JSON.parse(data).join(', '); } catch (e) { return data; }
    }
    return data;
};

// Helper for currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export default function Edit({ auth, tripPlanner, globalPrice }) {
  const { data, setData, put, processing, errors } = useForm({
    status: tripPlanner.status || "pending",
    notes: tripPlanner.notes || "",
  });

  // Check payment status
  const isPaid = tripPlanner.bookings && tripPlanner.bookings.some(b => ['paid', 'partial'].includes(b.payment_status));

  const submit = (e) => {
    e.preventDefault();
    put(route("admin.planners.update", tripPlanner.id), {
        preserveScroll: true,
    });
  };

  // Calculate Pax
  const totalPax = (parseInt(tripPlanner.pax_adults) || 0) +
                   (parseInt(tripPlanner.pax_teens) || 0) +
                   (parseInt(tripPlanner.pax_kids) || 0) +
                   (parseInt(tripPlanner.pax_seniors) || 0);

  // Format Address
  const fullAddress = [
      tripPlanner.address,
      tripPlanner.city,
      tripPlanner.province,
      tripPlanner.postal_code,
      tripPlanner.country
  ].filter(Boolean).join(', ');

  // WhatsApp Link
  const getWhatsAppLink = (number) => {
      if (!number) return '#';
      let cleanNumber = number.replace(/\D/g, '');
      if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.substring(1);
      return `https://wa.me/${cleanNumber}`;
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manage Trip Request #{tripPlanner.id}</h2>}
    >
      <Head title={`Trip Plan #${tripPlanner.id}`} />

      <div className="py-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">

          {/* LEFT COLUMN (Span 2): Comprehensive User Details */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="h-fit shadow-md">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    📋 Full Trip Details
                </CardTitle>
                <CardDescription>Complete information submitted by the client.</CardDescription>
              </CardHeader>

              <CardContent className="pt-6 grid grid-cols-2 gap-y-6 gap-x-6">

                {/* SECTION 1: PERSONAL INFO */}
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-gray-100 mt-2">
                    <Users className="text-blue-600 w-5 h-5"/>
                    <h3 className="font-bold text-gray-900">Traveler Profile</h3>
                </div>

                <DetailRow label="Full Name" value={tripPlanner.full_name} />
                <DetailRow label="Email" value={tripPlanner.email} />
                <DetailRow label="Phone Number" value={tripPlanner.phone} />
                <DetailRow label="Frequent Traveler?" value={tripPlanner.is_frequent_traveler} />
                {(tripPlanner.company_name || tripPlanner.brand_name) && (
                    <>
                        <DetailRow label="Company Name" value={tripPlanner.company_name} />
                        <DetailRow label="Brand Name" value={tripPlanner.brand_name} />
                    </>
                )}
                <DetailRow label="Full Address" value={fullAddress} fullWidth />

                {/* SECTION 2: TRIP LOGISTICS */}
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-gray-100 mt-6">
                    <MapPin className="text-orange-600 w-5 h-5"/>
                    <h3 className="font-bold text-gray-900">Logistics & Timing</h3>
                </div>

                <DetailRow label="Trip Type" value={tripPlanner.trip_type} />
                <DetailRow label="Travel Type" value={tripPlanner.travel_type} />
                <DetailRow label="Departure Date" value={tripPlanner.departure_date} icon={Calendar} />
                <DetailRow label="Duration" value={tripPlanner.duration} />
                <DetailRow label="Total Pax" value={`${totalPax} People`} icon={Users} />

                {/* Pax Breakdown */}
                <div className="col-span-2 grid grid-cols-4 gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">Adults</span>
                        <span className="font-bold text-lg">{tripPlanner.pax_adults || 0}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">Teens</span>
                        <span className="font-bold text-lg">{tripPlanner.pax_teens || 0}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">Kids</span>
                        <span className="font-bold text-lg">{tripPlanner.pax_kids || 0}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">Seniors</span>
                        <span className="font-bold text-lg">{tripPlanner.pax_seniors || 0}</span>
                    </div>
                </div>

                {/* SECTION 3: BUDGET & PREFERENCES */}
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-gray-100 mt-6">
                    <Wallet className="text-green-600 w-5 h-5"/>
                    <h3 className="font-bold text-gray-900">Budget & Style</h3>
                </div>

                <DetailRow label="Budget Tier" value={tripPlanner.budget_pack} />
                <DetailRow label="Budget Priorities" value={formatList(tripPlanner.budget_priorities)} />
                <DetailRow label="Travel Style" value={formatList(tripPlanner.travel_style)} fullWidth />
                {tripPlanner.other_travel_style && <DetailRow label="Other Style" value={tripPlanner.other_travel_style} fullWidth />}

                <DetailRow label="Travel Personality" value={formatList(tripPlanner.travel_personality)} fullWidth />
                {tripPlanner.other_travel_personality && <DetailRow label="Other Personality" value={tripPlanner.other_travel_personality} fullWidth />}

                {/* SECTION 4: SPECIFICS */}
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-gray-100 mt-6">
                    <PenTool className="text-purple-600 w-5 h-5"/>
                    <h3 className="font-bold text-gray-900">Specific Requests</h3>
                </div>

                <DetailRow label="Accommodation Pref." value={tripPlanner.accommodation_preference} fullWidth />
                <DetailRow label="Food Preferences" value={formatList(tripPlanner.food_preference)} fullWidth />
                {tripPlanner.other_food_preference && <DetailRow label="Other Food" value={tripPlanner.other_food_preference} fullWidth />}

                <DetailRow label="Activity Level" value={tripPlanner.activity_level} />
                <DetailRow label="Attraction Types" value={tripPlanner.attraction_preference} />

                <DetailRow label="Requested Add-ons" value={formatList(tripPlanner.addons)} fullWidth />

                <div className="col-span-2 mt-2">
                    <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1">
                        ⭐ Must Visit / Special Requests
                    </dt>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md text-sm text-gray-800 dark:text-gray-200 border border-yellow-200 dark:border-yellow-800 min-h-[80px] whitespace-pre-wrap">
                        {tripPlanner.must_visit || "No special requests."}
                    </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (Span 1): Workflow & Status */}
          <div className="xl:col-span-1 space-y-6 flex flex-col h-full">

            {/* 1. Payment Status Check */}
            <Card className={isPaid ? "border-green-500 border-l-4 shadow-sm" : "border-red-500 border-l-4 shadow-sm"}>
                <CardHeader className="py-4 pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>1. Payment Status</span>
                        {isPaid ? <Badge className="bg-green-600">Paid</Badge> : <Badge variant="destructive">Unpaid</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isPaid ? (
                        <p className="text-sm text-green-700">Client has paid. You can start crafting the trip.</p>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} /> Warning: Client has not paid yet. Do not start work.
                        </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground pt-2 border-t">Global Price: {formatCurrency(globalPrice)}</div>
                </CardContent>
            </Card>

            {/* 2. Client Communication */}
            <Card className="shadow-sm">
                <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" /> 2. Communication</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Use WhatsApp to send the result or discuss revisions.</p>
                    {tripPlanner.phone ? (
                        <a href={getWhatsAppLink(tripPlanner.phone)} target="_blank" rel="noopener noreferrer">
                            <Button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                                <MessageCircle className="h-4 w-4" /> Contact Client ({tripPlanner.phone})
                            </Button>
                        </a>
                    ) : (
                        <Button disabled className="w-full opacity-50">No Phone</Button>
                    )}
                </CardContent>
            </Card>

            {/* 3. Workflow Status */}
            <Card className="flex-1 shadow-sm border-blue-100">
                <CardHeader className="py-4 bg-blue-50/50">
                    <CardTitle className="text-base text-blue-900">3. Update Workflow Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div>
                        <Label>Current Stage</Label>
                        <Select value={data.status} onValueChange={(val) => setData("status", val)}>
                            <SelectTrigger className="mt-1 h-12 bg-white">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending"><span className="flex items-center gap-2 text-gray-500">🕒 Pending <span className="text-xs text-gray-400 ml-auto">(Waiting)</span></span></SelectItem>
                                <SelectItem value="drafting"><span className="flex items-center gap-2 text-blue-600 font-medium"><PenTool size={16}/> Crafting Trip <span className="text-xs text-gray-400 ml-auto">(Working)</span></span></SelectItem>
                                <SelectItem value="sent_to_client"><span className="flex items-center gap-2 text-purple-600 font-medium"><Send size={16}/> Result Sent <span className="text-xs text-gray-400 ml-auto">(Feedback)</span></span></SelectItem>
                                <SelectItem value="revision"><span className="flex items-center gap-2 text-orange-600 font-medium"><RotateCcw size={16}/> Revision <span className="text-xs text-gray-400 ml-auto">(Adjusting)</span></span></SelectItem>
                                <SelectItem value="completed"><span className="flex items-center gap-2 text-green-600 font-bold"><CheckCircle size={16}/> Done <span className="text-xs text-gray-400 ml-auto">(Final)</span></span></SelectItem>
                                <SelectItem value="rejected">❌ Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                     <div>
                        <Label htmlFor="notes">Internal Admin Notes</Label>
                        <Textarea
                            id="notes"
                            className="mt-1 min-h-[120px]"
                            placeholder="Add notes about revisions, client feedback, or special requirements..."
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t mt-4">
                        <Link href={route('admin.planners.index')}><Button variant="outline" type="button">Cancel</Button></Link>
                        <Button type="submit" className="min-w-[140px]" disabled={processing}>
                            {processing ? "Saving..." : "💾 Update Status"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
