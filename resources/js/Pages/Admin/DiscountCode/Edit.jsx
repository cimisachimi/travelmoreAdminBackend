import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import InputError from '@/Components/InputError';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditDiscountCode({ auth, discountCode }) {
  // Format initial date to YYYY-MM-DD for the date input
  const initialDate = discountCode.expires_at
    ? new Date(discountCode.expires_at).toISOString().split('T')[0]
    : '';

  const { data, setData, put, processing, errors } = useForm({
    code: discountCode.code,
    type: discountCode.type,
    value: discountCode.value,
    max_uses: discountCode.max_uses || '',
    expires_at: initialDate,
  });

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.discount-codes.update', discountCode.id));
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.discount-codes.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Edit Discount Code
          </h2>
        </div>
      }
    >
      <Head title={`Edit ${data.code}`} />

      <div className="py-12">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Code: {discountCode.code}</CardTitle>
              <CardDescription>Update the discount code details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                {/* Code */}
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

                {/* Type & Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={data.type}
                        onValueChange={(value) => setData('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
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
                      step="0.01"
                      min="0"
                      value={data.value}
                      onChange={(e) => setData('value', e.target.value)}
                      placeholder={data.type === 'fixed' ? 'e.g., 50000' : 'e.g., 10'}
                      required
                    />
                    <InputError message={errors.value} className="mt-2" />
                  </div>
                </div>

                {/* Usage Limits & Expiration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_uses">Max Uses (Optional)</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
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
                    <Save className="w-4 h-4 mr-2" />
                    {processing ? 'Saving...' : 'Save Changes'}
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
