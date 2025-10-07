import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function UserIndex({ auth, users }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Users</h2>}
    >
      <Head title="Users" />

      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 text-gray-900">
          <h3 className="text-lg font-medium">User List</h3>
          <div className="mt-4">
            {/* You can replace this with a nice table component later */}
            <ul>
              {users.map(user => (
                <li key={user.id}>{user.name} - {user.email}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}