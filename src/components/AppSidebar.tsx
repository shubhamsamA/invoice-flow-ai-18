import {
  LayoutDashboard,
  ReceiptText,
  FileText,
  Users,
  Palette,
  Sparkles,
  Settings,
  Plus,
  PenTool,
  UtensilsCrossed,
  Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
   SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/route-prefetch";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Create Clients", url: "/clients", icon: Users },
  { title: "Builder", url: "/invoices/builder", icon: PenTool },
  { title: "Templates", url: "/templates", icon: Palette },
  { title: "AI Generator", url: "/ai-generator", icon: Sparkles },
  { title: "Restaurant Bills", url: "/restaurant-bills", icon: UtensilsCrossed },
  { title: "Inventory", url: "/inventory", icon: Package },
];

const secondaryNav = [{ title: "Business Profile ", url: "/settings", icon: Settings }];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const handleLinkClick = () => {
    // no-op: keep sidebar open on navigation
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 ">
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3",
          !collapsed && "border-b border-sidebar-border/50 pb-4"
        )}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-sidebar-border bg-sidebar-accent/20">
            <ReceiptText className="h-5 w-5 text-sidebar-ring" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-[11px] font-mono font-bold tracking-[0.2em] text-sidebar-accentforeground uppercase">
                Invoice_Build
              </h1>
            
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {!collapsed && (
          <div className="px-4 py-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-none border-sidebar-border bg-sidebar-accent/10 text-[10px] font-mono  font-bold uppercase tracking-widest text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
              asChild
              onClick={handleLinkClick}
            >
              <NavLink to="/invoices/new" activeClassName="">
                <Plus className="h-3.5 w-3.5" />
                New_Invoice
              </NavLink>
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/90 mb-2">
            navigation_main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNav.map((item, idx) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={handleLinkClick}
                      className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/90 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-ring"
                    >
                      {!collapsed && (
                        <span className="w-4 opacity-20 group-hover:opacity-100 transition-opacity text-[8px]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                      <item.icon className={cn("h-4 w-4 shrink-0", collapsed && "mx-auto")} />
                      {!collapsed && <span>{item.title.replace(" ", "_")}</span>}
                      
                      {/* Hover indicator */}
                      <div className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-1 bg-sidebar-ring transition-all" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/90 mb-2">
            system_profile
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent">
                    <NavLink
                      to={item.url}
                      onClick={handleLinkClick}
                      className="group relative flex w-full items-center gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider  font-bold  text-sidebar-foreground/90 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-ring"
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", collapsed && "mx-auto")} />
                      {!collapsed && <span>{item.title.trim().replace(" ", "_")}</span>}
                      <div className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-1 bg-sidebar-ring transition-all" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        <div className="flex justify-center">
           <SidebarTrigger className="text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
