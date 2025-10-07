import { Link } from '@inertiajs/react';
import { Home, Package, Users, User as UserIcon } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/Components/ui/sidebar";

// Define your menu items
const menuItems = [
  { title: "Dashboard", url: route('dashboard'), icon: Home },
  { title: "Users", url: route('admin.users.index'), icon: Users },
  { title: "Packages", url: route('admin.packages.index'), icon: Package },
];

export function AppSidebar({ user }) {
  const { isCollapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <ApplicationLogo className="h-6 w-6" />
        {!isCollapsed && <span className="text-lg font-semibold">TravelMore</span>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton active={route().current(item.url.split('/').pop())}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserIcon className="h-6 w-6" />
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}