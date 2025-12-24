import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';
import { MoreHorizontal, Search, User as UserIcon, Mail, ShieldCheck, Trash2, ShieldAlert, UserPlus } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

export default function UserIndex({ auth, users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const performSearch = useCallback(
        debounce((query) => {
            router.get(route('admin.users.index'), { ...filters, search: query, page: 1 }, {
                preserveState: true,
                replace: true
            });
        }, 500),
        [filters]
    );

    useEffect(() => {
        if (searchTerm !== (filters.search || '')) performSearch(searchTerm);
    }, [searchTerm]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', password: '', role: 'client',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => {
                reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleRoleUpdate = (user, newRole) => {
        if (confirm(`Change ${user.name}'s role to ${newRole}?`)) {
            router.put(route('admin.users.update', user.id), { role: newRole, name: user.name });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Permanently delete this user?')) router.delete(route('admin.users.destroy', id));
    };

    const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount || 0);

    return (
        <AuthenticatedLayout user={auth.user} header="User Management">
            <Head title="User Directory" />
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select
                            defaultValue={filters.role || 'all'}
                            onValueChange={(val) => router.get(route('admin.users.index'), { ...filters, role: val, page: 1 })}
                        >
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                                <SelectItem value="client">Clients</SelectItem>
                            </SelectContent>
                        </Select>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><UserPlus size={16}/> Create User</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                                <form onSubmit={submitCreate} className="space-y-4 py-4">
                                    <div className="space-y-1">
                                        <Input placeholder="Full Name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input type="email" placeholder="Email" value={data.email} onChange={e => setData('email', e.target.value)} />
                                        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Input type="password" placeholder="Password" value={data.password} onChange={e => setData('password', e.target.value)} />
                                        {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                    </div>
                                    <Select value={data.role} onValueChange={val => setData('role', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DialogFooter><Button type="submit" disabled={processing} className="w-full">Save User</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>User Directory</CardTitle>
                        <CardDescription>Manage permissions and view customer activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Activity</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                                                {user.email_verified_at && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><ShieldCheck size={10}/> Verified</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{user.orders_count} Bookings</div>
                                            <div className="text-[10px] text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{formatIDR(user.total_spent)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleRoleUpdate(user, user.role === 'admin' ? 'client' : 'admin')}>
                                                        <ShieldAlert className="mr-2 h-4 w-4" /> Change to {user.role === 'admin' ? 'Client' : 'Admin'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" disabled={user.id === auth.user.id} onClick={() => handleDelete(user.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={users.links} />
            </div>
        </AuthenticatedLayout>
    );
}
