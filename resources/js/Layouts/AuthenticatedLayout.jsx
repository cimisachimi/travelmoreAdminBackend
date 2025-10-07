import { SidebarProvider, SidebarTrigger } from '@/Components/ui/sidebar';
import { AppSidebar } from '@/Components/AppSidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { User as UserIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function AuthenticatedLayout({ user, header, children }) {
    return (
        <SidebarProvider>
            <div className="min-h-screen w-full bg-muted/40">
                <AppSidebar user={user} />
                <main className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16 data-[collapsed=false]:sm:pl-64 transition-all duration-300">
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        <SidebarTrigger />
                        {header}

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
                    <div className="p-4 sm:px-6 sm:py-0">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}