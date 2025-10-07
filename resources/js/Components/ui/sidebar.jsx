import React, { createContext, useContext, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronsLeft } from 'lucide-react';

// Create a context for the sidebar state
const SidebarContext = createContext();

// Provider component to wrap your layout
export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className={cn("flex h-full", { 'is-collapsed': isCollapsed })}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// Custom hook to use the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

// --- Structural Components ---

export function Sidebar({ className, children }) {
  const { isCollapsed } = useSidebar();
  return (
    <aside
      className={cn(
        "hidden sm:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
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
    <div className={cn("flex h-16 items-center border-b p-4", isCollapsed ? "justify-center" : "justify-between", className)}>
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
    <div className={cn("flex items-center border-t p-4", isCollapsed ? "justify-center" : "", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({ className, children }) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function SidebarGroupLabel({ className, children }) {
  const { isCollapsed } = useSidebar();
  if (isCollapsed) return null;
  return <h3 className={cn("px-4 text-xs font-medium uppercase text-muted-foreground", className)}>{children}</h3>;
}

export function SidebarGroupContent({ className, children }) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function SidebarMenu({ className, children }) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function SidebarMenuItem({ className, children }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function SidebarMenuButton({ className, children }) {
  const { isCollapsed } = useSidebar();
  return (
    <div className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isCollapsed ? "justify-center" : "", className
    )}>
      {children}
    </div>
  );
}

export function SidebarTrigger() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      <ChevronsLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
    </Button>
  );
}