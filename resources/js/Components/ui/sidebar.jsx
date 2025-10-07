import React, { createContext, useContext, useState, forwardRef } from 'react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronsLeft } from 'lucide-react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
}

// --- New, simplified trigger button ---
export function SidebarTrigger({ className, ...props }) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={() => setIsCollapsed(!isCollapsed)}
      {...props}
    >
      <ChevronsLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
    </Button>
  );
}


export function Sidebar({ className, children }) {
  const { isCollapsed } = useSidebar();
  return (
    <aside
      className={cn(
        "hidden sm:flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children }) {
  const { isCollapsed } = useSidebar();
  return (
    <div className={cn("flex h-14 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between", className)}>
      {children}
    </div>
  );
}

export function SidebarContent({ className, children }) {
  return <div className={cn("flex-1 overflow-y-auto p-2", className)}>{children}</div>;
}

export function SidebarFooter({ className, children }) {
  const { isCollapsed } = useSidebar();
  return (
    <div className={cn("flex items-center border-t p-4 mt-auto", isCollapsed ? "justify-center" : "", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({ className, children }) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function SidebarMenu({ className, children }) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function SidebarMenuItem({ className, children }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export const SidebarMenuButton = forwardRef(({ className, children, active, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
        active && "bg-accent text-accent-foreground",
        isCollapsed ? "justify-center" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});