import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function HolidayPackageIndex({ auth, packages }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Holiday Packages</h2>}
    >
      <Head title="Holiday Packages" />

      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 text-gray-900">
          <h3 className="text-lg font-medium">Package List</h3>
          <div className="mt-4">
            <ul>
              {packages.map(pkg => (
                <li key={pkg.id}>{pkg.name} - ${pkg.price}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}