import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar'; // Import SidebarTrigger
import { AppSidebar } from '@/Components/AppSidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { User as UserIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function AuthenticatedLayout({ user, header, children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-muted/40">
                <AppSidebar user={user} />
                <div className="flex flex-col flex-1">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                        {/* The trigger is now here, and will always be visible */}
                        <SidebarTrigger />

                        {header && <div className="font-semibold">{header}</div>}
                        <div className="ml-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                        <UserIcon className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild><Link href={route('profile.edit')}>Profile</Link></DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild><Link href={route('logout')} method="post" as="button" className="w-full text-left">Logout</Link></DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}