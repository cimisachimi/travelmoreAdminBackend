import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

export default function TripPlannerIndex({ auth, planners }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header="Trip Planner Submissions"
    >
      <Head title="Trip Planners" />
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            A complete list of all custom trip planner requests submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Trip Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planners.map((planner) => (
                <TableRow key={planner.id}>
                  <TableCell>
                    <div className="font-medium">{planner.full_name || planner.company_name}</div>
                    <div className="text-sm text-muted-foreground">{planner.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{planner.trip_type}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{planner.budget_pack}</TableCell>
                  <TableCell>{new Date(planner.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Contacted</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}