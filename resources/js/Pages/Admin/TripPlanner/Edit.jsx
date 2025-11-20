import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import InputError from "@/Components/InputError";
import { Separator } from "@/Components/ui/separator";

// Helper component for displaying details
const DetailItem = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || '-'}</dd>
  </div>
);

export default function Edit({ auth, tripPlanner }) {
  const { data, setData, put, processing, errors } = useForm({
    price: tripPlanner.price || 0,
    status: tripPlanner.status || "Pending",
    notes: tripPlanner.notes || "",
  });

  const submit = (e) => {
    e.preventDefault();
    // Use the correct route name from Step 1
    put(route("admin.planners.update", tripPlanner.id), {
        preserveScroll: true,
    });
  };

  const totalPax = (tripPlanner.adults || 0) + (tripPlanner.children || 0) + (tripPlanner.infants || 0);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Review Trip Plan #{tripPlanner.id}
        </h2>
      }
    >
      <Head title={`Trip Plan #${tripPlanner.id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Form to change price/status */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>
                  Set the price and status for this trip plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-6">
                  {/* Price Input */}
                  <div>
                    <Label htmlFor="price">Set Price (IDR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={data.price}
                      onChange={(e) => setData("price", e.target.value)}
                      className="mt-1 block w-full"
                    />
                    <InputError message={errors.price} className="mt-2" />
                  </div>

                  {/* Status Select */}
                  <div>
                    <Label htmlFor="status">Set Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(value) => setData("status", value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.status} className="mt-2" />
                  </div>

                  {/* Notes Textarea */}
                  <div>
                    <Label htmlFor="notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData("notes", e.target.value)}
                      className="mt-1 block w-full"
                      rows={4}
                      placeholder="Notes for the user or internal team..."
                    />
                    <InputError message={errors.notes} className="mt-2" />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-4">
                    <Button disabled={processing}>
                      {processing ? "Saving..." : "Save Changes"}
                    </Button>
                    <Link
                      href={route("admin.planners.index")}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Detailed View of the submission */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>User Submission Details</CardTitle>
                <CardDescription>
                  This is the original information submitted by the user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  {/* Contact Info */}
                  <DetailItem label="Full Name" value={tripPlanner.full_name} />
                  <DetailItem label="Email" value={tripPlanner.email} />
                  <DetailItem label="Phone Number" value={tripPlanner.phone_number} />
                  <DetailItem label="Country" value={tripPlanner.country_of_residence} />
                  <DetailItem label="Company Name" value={tripPlanner.company_name} />
                  <DetailItem label="Submitted By" value={tripPlanner.user?.name || 'Guest'} />

                  <Separator className="md:col-span-2" />

                  {/* Trip Info */}
                  <DetailItem label="Trip Type" value={tripPlanner.trip_type} />
                  <DetailItem label="Travel Type" value={tripPlanner.travel_type} />
                  <DetailItem label="Destination" value={tripPlanner.destination} />
                  <DetailItem label="Budget Pack" value={tripPlanner.budget_pack} />
                  <DetailItem label="Departure Date" value={new Date(tripPlanner.departure_date).toLocaleDateString()} />
                  <DetailItem label="Return Date" value={new Date(tripPlanner.return_date).toLocaleDateString()} />

                  <Separator className="md:col-span-2" />

                  {/* Participant Info */}
                  <DetailItem label="Participants" value={`${totalPax} Pax`} />
                  <DetailItem label="Adults" value={tripPlanner.adults} />
                  <DetailItem label="Children (2-11y)" value={tripPlanner.children} />
                  <DetailItem label="Infants (<2y)" value={tripPlanner.infants} />

                  <Separator className="md:col-span-2" />

                  {/* Other Info */}
                  <div className="md:col-span-2">
                    <DetailItem label="Interests" value={tripPlanner.interests?.join(', ')} />
                  </div>
                  <div className="md:col-span-2">
                    <DetailItem label="Other Requests" value={tripPlanner.other_requests} />
                  </div>

                </dl>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
