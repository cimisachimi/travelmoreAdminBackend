import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea"; // Assuming you have this
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import InputError from "@/Components/InputError";

export default function Edit({ auth, tripPlanner }) {
  const { data, setData, put, processing, errors } = useForm({
    price: tripPlanner.price || 0,
    status: tripPlanner.status || "Pending",
    notes: tripPlanner.notes || "",
  });

  const submit = (e) => {
    e.preventDefault();
    put(route("admin.trip-planner.update", tripPlanner.id));
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Edit Trip Plan #{tripPlanner.id}
        </h2>
      }
    >
      <Head title={`Edit Trip Plan #${tripPlanner.id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Update Price and Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                {/* Price Input */}
                <div>
                  <Label htmlFor="price">Price (IDR)</Label>
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
                  <Label htmlFor="status">Status</Label>
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
                  />
                  <InputError message={errors.notes} className="mt-2" />
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-4">
                  <Button disabled={processing}>
                    {processing ? "Saving..." : "Save Changes"}
                  </Button>
                  <Link
                    href={route("admin.trip-planner.index")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
