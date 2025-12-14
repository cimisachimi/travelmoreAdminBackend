import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import InputError from "@/Components/InputError";
import { Badge } from "@/Components/ui/badge";
import { Phone, MessageCircle, Wallet } from "lucide-react";

// Helper for clean data display
const DetailRow = ({ label, value, fullWidth = false }) => (
  <div className={`${fullWidth ? "col-span-2" : "col-span-1"}`}>
    <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wider">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap">
      {value || <span className="text-gray-400 italic">Not specified</span>}
    </dd>
  </div>
);

// Helper to join array data or show string
const formatList = (data) => {
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
    status: tripPlanner.status || "Pending",
    notes: tripPlanner.notes || "",
  });

  const submit = (e) => {
    e.preventDefault();
    put(route("admin.planners.update", tripPlanner.id), {
        preserveScroll: true,
    });
  };

  const totalPax = (parseInt(tripPlanner.pax_adults) || 0) + (parseInt(tripPlanner.pax_teens) || 0) + (parseInt(tripPlanner.pax_kids) || 0) + (parseInt(tripPlanner.pax_seniors) || 0);

  const fullAddress = [tripPlanner.address, tripPlanner.city, tripPlanner.province, tripPlanner.postal_code, tripPlanner.country].filter(Boolean).join(', ');

  const getWhatsAppLink = (number) => {
      if (!number) return '#';
      let cleanNumber = number.replace(/\D/g, '');
      if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.substring(1);
      return `https://wa.me/${cleanNumber}`;
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
            <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Manage Trip Request #{tripPlanner.id}
            </h2>
            <div className="flex gap-2">
                <Badge variant={tripPlanner.status === 'Accepted' ? 'default' : 'secondary'}>
                    {tripPlanner.status}
                </Badge>
            </div>
        </div>
      }
    >
      <Head title={`Trip Plan #${tripPlanner.id}`} />

      <div className="py-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">

          {/* LEFT COLUMN: User Context (Detailed View) */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-4">
                <CardTitle className="text-lg">User Requirements</CardTitle>
                <CardDescription>Full details submitted by the user.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-2 gap-y-6 gap-x-4 max-h-[800px] overflow-y-auto">
                <div className="col-span-2 pb-2 border-b border-gray-100 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">👤 Traveler Profile</h3>
                </div>
                <DetailRow label="Full Name" value={tripPlanner.full_name} />
                <DetailRow label="Email" value={tripPlanner.email} />
                <DetailRow label="Phone" value={tripPlanner.phone} />
                <DetailRow label="Frequent Traveler?" value={tripPlanner.is_frequent_traveler === 'yes' ? 'Yes' : 'No'} />
                <DetailRow label="Full Address" value={fullAddress} fullWidth />

                <div className="col-span-2 pb-2 border-b border-gray-100 mt-4 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">✈️ Trip Logistics</h3>
                </div>
                <DetailRow label="Trip Type" value={tripPlanner.trip_type} />
                <DetailRow label="Travel Type" value={tripPlanner.travel_type} />
                <DetailRow label="Departure Date" value={tripPlanner.departure_date} />
                <DetailRow label="Duration" value={tripPlanner.duration} />
                <DetailRow label="Budget Pack" value={tripPlanner.budget_pack} />
                <DetailRow label="Total Pax" value={`${totalPax} People`} />

                <div className="col-span-2 pb-2 border-b border-gray-100 mt-4 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">🎨 Preferences & Style</h3>
                </div>
                <DetailRow label="Travel Style" value={formatList(tripPlanner.travel_style)} fullWidth />
                <DetailRow label="Accommodation" value={tripPlanner.accommodation_preference} fullWidth />
                <DetailRow label="Food Preferences" value={formatList(tripPlanner.food_preference)} fullWidth />
                <DetailRow label="Activity Level" value={tripPlanner.activity_level} />
                <DetailRow label="Attractions" value={tripPlanner.attraction_preference} />
                <div className="col-span-2 mt-2">
                    <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">Must Visit / Special Requests</dt>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 min-h-[60px]">
                        {tripPlanner.must_visit || "None"}
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Action & Contact */}
          <div className="space-y-6 flex flex-col h-full">

            {/* 1. Contact Client Card */}
            <Card className="shadow-md border-green-200 dark:border-green-900 bg-green-50/50">
                <CardHeader className="py-4">
                    <CardTitle className="text-base text-green-800 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Step 1: Contact Client
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Review the requirements on the left, then contact the client directly to discuss the itinerary.
                    </p>
                    {tripPlanner.phone ? (
                        <a href={getWhatsAppLink(tripPlanner.phone)} target="_blank" rel="noopener noreferrer">
                            <Button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Chat on WhatsApp ({tripPlanner.phone})
                            </Button>
                        </a>
                    ) : (
                        <Button disabled className="w-full opacity-50 cursor-not-allowed gap-2">
                            <Phone className="h-4 w-4" />
                            No Phone Number Available
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* 2. Controls */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-base">Step 2: Update Status & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 pb-6">
                     {/* Price (READ ONLY) */}
                    <div>
                        <Label>Trip Price</Label>
                        <div className="mt-2 flex items-center justify-between p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-center gap-2">
                                <Wallet className="text-gray-400 h-5 w-5" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCurrency(globalPrice)}
                                </span>
                            </div>
                            <Badge variant="outline" className="text-xs">Global Rate</Badge>
                        </div>
                    </div>

                    {/* ✅ UPDATED: Detailed Status Dropdown */}
                    <div>
                        <Label htmlFor="status">Progress Status</Label>
                         <Select value={data.status} onValueChange={(val) => setData("status", val)}>
                            <SelectTrigger className="mt-1 h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">
                                    <span className="flex items-center gap-2 text-orange-600 font-medium">
                                        🔴 Need to Contact <span className="text-gray-400 font-normal text-xs ml-auto">(New Submission)</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="In Progress">
                                    <span className="flex items-center gap-2 text-blue-600 font-medium">
                                        🔵 In Progress <span className="text-gray-400 font-normal text-xs ml-auto">(Discussing/Drafting)</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="Accepted">
                                    <span className="flex items-center gap-2 text-emerald-600 font-medium">
                                        ✅ Client Accepted <span className="text-gray-400 font-normal text-xs ml-auto">(Ready for Payment)</span>
                                    </span>
                                </SelectItem>
                                <SelectItem value="Rejected">
                                    <span className="flex items-center gap-2 text-gray-500 font-medium">
                                        ❌ Rejected / Cancelled
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="pt-2 flex gap-4 justify-end">
                        <Link href={route('admin.planners.index')}>
                             <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" className="min-w-[150px]" disabled={processing}>
                            {processing ? "Saving..." : "💾 Save Changes"}
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
