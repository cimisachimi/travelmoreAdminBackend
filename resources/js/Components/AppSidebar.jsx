import { Link, usePage } from '@inertiajs/react'; // 1. Added usePage
import {
  Home,
  Package,
  Users,
  FileText,
  CreditCard,
  ShoppingCart,
  User as UserIcon,
  Car,
  Activity,
  TicketPercent,
  Newspaper
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/Components/ui/sidebar";

// 1. Dashboard (Single Item)
const dashboardItem = { name: 'dashboard', title: "Dashboard", url: route('dashboard'), icon: Home };

// 2. Services Group
const serviceItems = [
  { name: 'admin.planners.index', title: "Trip Planners", url: route('admin.planners.index'), icon: FileText },
  { name: 'admin.packages.index', title: "Holiday Packages", url: route('admin.packages.index'), icon: Package },
  { name: 'admin.rentals.index', title: "Car Rentals", url: route('admin.rentals.index'), icon: Car },
  { name: 'admin.activities.index', title: "Activities", url: route('admin.activities.index'), icon: Activity },
  { name: 'admin.open-trips.index', title: "Open Trips", url: route('admin.open-trips.index'), icon: Activity },
];

// 3. Management Group
const managementItems = [
  { name: 'admin.orders.index', title: "Orders", url: route('admin.orders.index'), icon: ShoppingCart },
  { name: 'admin.discount-codes.index', title: "Discount Codes", url: route('admin.discount-codes.index'), icon: TicketPercent },
  { name: 'admin.posts.index', title: "Blog Posts", url: route('admin.posts.index'), icon: Newspaper },
  { name: 'admin.transactions.index', title: "Transactions", url: route('admin.transactions.index'), icon: CreditCard },
  { name: 'admin.users.index', title: "Users", url: route('admin.users.index'), icon: Users },
];

export function AppSidebar({ user }) {
  const { isCollapsed } = useSidebar();

  // 2. Get auth user directly from Inertia global props
  const { auth } = usePage().props;

  // 3. Use the prop if available, otherwise fall back to the global auth user
  // This safeguards against the "undefined" error if a page forgets to pass the user prop.
  const currentUser = user || auth.user || { name: 'User', email: '' };

  // Helper to render a list of menu items
  const renderMenuItems = (items) => (
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.url}>
              <SidebarMenuButton isActive={route().current(item.name)}>
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.title}</span>}
              </SidebarMenuButton>
            </Link>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
        </Tooltip>
      </SidebarMenuItem>
    ))
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ApplicationLogo className="h-6 w-6" />
          {!isCollapsed && <span className="text-lg font-semibold">TravelMore</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <TooltipProvider delayDuration={0}>

          {/* Group 1: Dashboard */}
          <SidebarGroup>
            <SidebarMenu>
                {renderMenuItems([dashboardItem])}
            </SidebarMenu>
          </SidebarGroup>

          {/* Group 2: Services */}
          <SidebarGroup>
            <SidebarGroupLabel>Services</SidebarGroupLabel>
            <SidebarMenu>
              {renderMenuItems(serviceItems)}
            </SidebarMenu>
          </SidebarGroup>

          {/* Group 3: Management */}
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
              {renderMenuItems(managementItems)}
            </SidebarMenu>
          </SidebarGroup>

        </TooltipProvider>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
            <UserIcon className="h-6 w-6" />
            {!isCollapsed && (
            <div className="flex flex-col text-left ml-2 overflow-hidden">
                {/* 4. Use currentUser here */}
                <span className="text-sm font-semibold truncate">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
            </div>
            )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
