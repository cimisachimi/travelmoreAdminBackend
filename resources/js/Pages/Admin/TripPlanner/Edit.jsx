import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import InputError from "@/Components/InputError";
import { Badge } from "@/Components/ui/badge";
import QuillEditor from "@/Components/QuillEditor";

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
        try {
            return JSON.parse(data).join(', ');
        } catch (e) {
            return data;
        }
    }
    return data;
};

export default function Edit({ auth, tripPlanner }) {
  const { data, setData, put, processing, errors } = useForm({
    price: tripPlanner.price || 0,
    status: tripPlanner.status || "Pending",
    notes: tripPlanner.notes || "",
    recommendation_content: tripPlanner.recommendation_content || "",
  });

  const submit = (e) => {
    e.preventDefault();
    put(route("admin.planners.update", tripPlanner.id), {
        preserveScroll: true,
    });
  };

  // Calculate total pax
  const totalPax = (parseInt(tripPlanner.pax_adults) || 0) +
                   (parseInt(tripPlanner.pax_teens) || 0) +
                   (parseInt(tripPlanner.pax_kids) || 0) +
                   (parseInt(tripPlanner.pax_seniors) || 0);

  // Address formatter
  const fullAddress = [
    tripPlanner.address,
    tripPlanner.city,
    tripPlanner.province,
    tripPlanner.postal_code,
    tripPlanner.country
  ].filter(Boolean).join(', ');

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
            <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Manage Trip Request #{tripPlanner.id}
            </h2>
            <div className="flex gap-2">
                <Badge variant={tripPlanner.status === 'Approved' ? 'default' : 'secondary'}>
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

                {/* 1. Contact & Identity */}
                <div className="col-span-2 pb-2 border-b border-gray-100 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">👤 Traveler Profile</h3>
                </div>
                <DetailRow label="Full Name" value={tripPlanner.full_name} />
                <DetailRow label="Email" value={tripPlanner.email} />
                <DetailRow label="Phone" value={tripPlanner.phone} />
                <DetailRow label="Frequent Traveler?" value={tripPlanner.is_frequent_traveler === 'yes' ? 'Yes' : 'No'} />

                {(tripPlanner.company_name || tripPlanner.brand_name) && (
                    <>
                        <DetailRow label="Company" value={tripPlanner.company_name} />
                        <DetailRow label="Brand" value={tripPlanner.brand_name} />
                    </>
                )}

                <DetailRow label="Full Address" value={fullAddress} fullWidth />

                {/* 2. Trip Logistics */}
                <div className="col-span-2 pb-2 border-b border-gray-100 mt-4 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">✈️ Trip Logistics</h3>
                </div>
                <DetailRow label="Trip Type" value={tripPlanner.trip_type} />
                <DetailRow label="Travel Type" value={tripPlanner.travel_type} />
                <DetailRow label="Departure Date" value={tripPlanner.departure_date} />
                <DetailRow label="Duration" value={tripPlanner.duration} />
                <DetailRow label="Budget Pack" value={tripPlanner.budget_pack} />
                <DetailRow label="Total Pax" value={`${totalPax} People`} />

                <div className="col-span-2 grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded text-center">
                    <div><span className="block text-xs text-gray-500">Adults</span><span className="font-bold">{tripPlanner.pax_adults || 0}</span></div>
                    <div><span className="block text-xs text-gray-500">Teens</span><span className="font-bold">{tripPlanner.pax_teens || 0}</span></div>
                    <div><span className="block text-xs text-gray-500">Kids</span><span className="font-bold">{tripPlanner.pax_kids || 0}</span></div>
                    <div><span className="block text-xs text-gray-500">Seniors</span><span className="font-bold">{tripPlanner.pax_seniors || 0}</span></div>
                </div>

                {/* 3. Detailed Preferences */}
                <div className="col-span-2 pb-2 border-b border-gray-100 mt-4 mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">🎨 Preferences & Style</h3>
                </div>

                <DetailRow label="Travel Style" value={formatList(tripPlanner.travel_style)} fullWidth />
                {tripPlanner.other_travel_style && <DetailRow label="Other Style" value={tripPlanner.other_travel_style} fullWidth />}

                <DetailRow label="Travel Personality" value={formatList(tripPlanner.travel_personality)} fullWidth />
                {tripPlanner.other_travel_personality && <DetailRow label="Other Personality" value={tripPlanner.other_travel_personality} fullWidth />}

                <DetailRow label="Accommodation" value={tripPlanner.accommodation_preference} fullWidth />

                <DetailRow label="Food Preferences" value={formatList(tripPlanner.food_preference)} fullWidth />
                {tripPlanner.other_food_preference && <DetailRow label="Other Food" value={tripPlanner.other_food_preference} fullWidth />}

                <DetailRow label="Activity Level" value={tripPlanner.activity_level} />
                <DetailRow label="Attractions" value={tripPlanner.attraction_preference} />

                <DetailRow label="Budget Priorities" value={formatList(tripPlanner.budget_priorities)} fullWidth />
                <DetailRow label="Add-ons" value={formatList(tripPlanner.addons)} fullWidth />

                <div className="col-span-2 mt-2">
                    <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">Must Visit / Special Requests</dt>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 min-h-[60px]">
                        {tripPlanner.must_visit || "None"}
                    </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Workspace (Action) */}
          <div className="space-y-6 flex flex-col h-full">

            {/* 1. Recommendation Editor */}
            <Card className="flex-1 flex flex-col shadow-md border-blue-200 dark:border-blue-900">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20 py-4">
                    <CardTitle className="text-blue-700 dark:text-blue-300 text-base">Craft Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-0 pb-4 px-4 flex flex-col min-h-[500px]">
                    <div className="flex-1 mt-4">
                        <QuillEditor
                            value={data.recommendation_content}
                            onChange={(val) => setData('recommendation_content', val)}
                        />
                    </div>
                    <InputError message={errors.recommendation_content} className="mt-2" />
                </CardContent>
            </Card>

            {/* 2. Controls */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-base">Finalize & Save</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                     {/* Price */}
                    <div>
                        <Label htmlFor="price">Trip Price (IDR)</Label>
                        <Input
                            id="price"
                            type="number"
                            className="mt-1"
                            value={data.price}
                            onChange={(e) => setData("price", e.target.value)}
                        />
                        <InputError message={errors.price} />
                    </div>

                    {/* Status */}
                    <div>
                        <Label htmlFor="status">Submission Status</Label>
                         <Select value={data.status} onValueChange={(val) => setData("status", val)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">🕒 Pending Review</SelectItem>
                                <SelectItem value="Approved">✅ Approved (Send to User)</SelectItem>
                                <SelectItem value="Rejected">❌ Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div className="md:col-span-2 pt-2 flex gap-4 justify-end">
                        <Link href={route('admin.planners.index')}>
                             <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" className="min-w-[150px]" disabled={processing}>
                            {processing ? "Saving..." : "💾 Save & Update"}
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
