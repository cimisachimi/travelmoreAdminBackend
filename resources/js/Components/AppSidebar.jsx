import { Link } from '@inertiajs/react';
import { Home, Package, Users, User as UserIcon } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/Components/ui/sidebar";

const menuItems = [
  { name: 'dashboard', title: "Dashboard", url: route('dashboard'), icon: Home },
  { name: 'admin.users.index', title: "Users", url: route('admin.users.index'), icon: Users },
  { name: 'admin.packages.index', title: "Packages", url: route('admin.packages.index'), icon: Package },
];

export function AppSidebar({ user }) {
  const { isCollapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ApplicationLogo className="h-6 w-6" />
          {!isCollapsed && <span className="text-lg font-semibold">TravelMore</span>}
        </div>
        {/* The trigger button has been removed from here */}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <TooltipProvider delayDuration={0}>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.url}>
                        <SidebarMenuButton active={route().current(item.name)}>
                          <item.icon className="h-5 w-5" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </TooltipProvider>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserIcon className="h-6 w-6" />
        {!isCollapsed && (
          <div className="flex flex-col text-left ml-2">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}