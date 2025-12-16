import { Link, usePage } from '@inertiajs/react';
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
  Newspaper,
  RefreshCcw,
  Map,
  Image
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
// ✅ NOTE: Using '.*' wildcard ensures sub-pages (Create, Edit) keep the menu highlighted
const serviceItems = [
  { name: 'admin.planners.*', title: "Trip Planners", url: route('admin.planners.index'), icon: FileText },
  { name: 'admin.packages.*', title: "Holiday Packages", url: route('admin.packages.index'), icon: Package },
  { name: 'admin.rentals.*', title: "Car Rentals", url: route('admin.rentals.index'), icon: Car },
  { name: 'admin.activities.*', title: "Activities", url: route('admin.activities.index'), icon: Activity },
  { name: 'admin.open-trips.*', title: "Open Trips", url: route('admin.open-trips.index'), icon: Map },
];

// 3. Management Group
const managementItems = [
  { name: 'admin.orders.*', title: "Orders", url: route('admin.orders.index'), icon: ShoppingCart },
  { name: 'admin.discount-codes.*', title: "Discount Codes", url: route('admin.discount-codes.index'), icon: TicketPercent },
  { name: 'admin.posts.*', title: "Blog Posts", url: route('admin.posts.index'), icon: Newspaper },
  { name: 'admin.galleries.*', title: "Gallery", url: route('admin.galleries.index'), icon: Image },
  { name: 'admin.transactions.*', title: "Transactions", url: route('admin.transactions.index'), icon: CreditCard },
  { name: 'admin.users.*', title: "Users", url: route('admin.users.index'), icon: Users },
  { name: 'admin.refunds.*', title: "Refunds", url: route('admin.refunds.index'), icon: RefreshCcw },
];

export function AppSidebar({ user }) {
  const { isCollapsed } = useSidebar();
  const { auth } = usePage().props;
  const currentUser = user || auth.user || { name: 'User', email: '' };

  const renderMenuItems = (items) => (
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={item.url}>
              {/* ✅ FIXED: Changed 'isActive' to 'active' to match your SidebarMenuButton component */}
              <SidebarMenuButton active={route().current(item.name)}>
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
                <span className="text-sm font-semibold truncate">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
            </div>
            )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
