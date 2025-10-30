import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import InputError from '@/Components/InputError';
import { ArrowLeft } from 'lucide-react';

export default function CreateDiscountCode({ auth }) {
  const { data, setData, post, processing, errors } = useForm({
    code: '',
    type: 'fixed',
    value: '',
    max_uses: '',
    expires_at: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.discount-codes.store'));
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.discount-codes.index')}>
            <Button variant="outline" size="icon" aria-label="Back to Discount Codes">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Create New Discount Code
          </h2>
        </div>
      }
    >
      <Head title="Create Discount Code" />

      <div className="py-12">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Discount Code Details</CardTitle>
              <CardDescription>Fill in the details for the new discount code.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={data.code}
                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                    placeholder="e.g., SALE10"
                    required
                  />
                  <InputError message={errors.code} className="mt-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select onValueChange={(value) => setData('type', value)} defaultValue={data.type}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount (IDR)</SelectItem>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.type} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={data.value}
                      onChange={(e) => setData('value', e.target.value)}
                      placeholder={data.type === 'fixed' ? 'e.g., 50000' : 'e.g., 10'}
                      required
                    />
                    <InputError message={errors.value} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_uses">Max Uses (Optional)</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      value={data.max_uses}
                      onChange={(e) => setData('max_uses', e.target.value)}
                      placeholder="e.g., 100"
                    />
                    <InputError message={errors.max_uses} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expires At (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={data.expires_at}
                      onChange={(e) => setData('expires_at', e.target.value)}
                    />
                    <InputError message={errors.expires_at} className="mt-2" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Code'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
