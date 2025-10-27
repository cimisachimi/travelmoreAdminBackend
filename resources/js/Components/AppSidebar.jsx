import { Link } from '@inertiajs/react';
// Imports cleaned up to match usage
import {
  Home,
  Package,
  Users,
  FileText,
  CreditCard,
  ShoppingCart,
  User as UserIcon,
  Car,
  Activity // This is the icon you used
} from 'lucide-react';
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
  { name: 'admin.orders.index', title: "Orders", url: route('admin.orders.index'), icon: ShoppingCart },
  { name: 'admin.planners.index', title: "Trip Planners", url: route('admin.planners.index'), icon: FileText },
  { name: 'admin.packages.index', title: "Holiday Packages", url: route('admin.packages.index'), icon: Package },
  { name: 'admin.rentals.index', title: "Car Rentals", url: route('admin.rentals.index'), icon: Car },
  { name: 'admin.activities.index', title: "Activities", url: route('admin.activities.index'), icon: Activity },
  { name: 'admin.transactions.index', title: "Transactions", url: route('admin.transactions.index'), icon: CreditCard },
  { name: 'admin.users.index', title: "Users", url: route('admin.users.index'), icon: Users },
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