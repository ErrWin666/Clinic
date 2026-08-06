import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  Settings,
  BarChart3,
  ShieldCheck,
  Package,
  Truck,
  ShoppingCart,
  StickyNote,
  BookOpen,
} from "lucide-react";
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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Logo from "@/components/shadcn-studio/logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { key: "navigation.dashboard", path: "/dashboard", icon: LayoutDashboard },
  { key: "navigation.patients", path: "/patients", icon: Users },
  { key: "navigation.appointments", path: "/appointments", icon: Calendar },
  { key: "navigation.invoices", path: "/invoices", icon: Receipt },
  { key: "navigation.reports", path: "/reports", icon: BarChart3 },
  { key: "navigation.users", path: "/users", icon: ShieldCheck },
  { key: "navigation.clinicNotes", path: "/clinic-notes", icon: StickyNote },
];

const inventoryNavItems = [
  { key: "navigation.inventory", path: "/inventory", icon: Package },
  { key: "navigation.suppliers", path: "/suppliers", icon: Truck },
  { key: "navigation.purchaseOrders", path: "/purchase-orders", icon: ShoppingCart },
  { key: "navigation.inventoryGuide", path: "/inventory/guide", icon: BookOpen },
];

const systemNavItems = [
  { key: "navigation.settings", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  return (
    <Sidebar collapsible="icon" side={isRtl ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border px-3 pb-3 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
                <Logo />
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{t("navigation.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path} className="mb-0.5">
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={t(item.key)}
                      render={<Link to={item.path} />}
                      className="relative h-10 rounded-lg transition-all duration-300 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:ring-1 data-[active=true]:ring-primary/15 data-[active=true]:shadow-glow hover:bg-muted/60 hover:shadow-soft"
                    >
                      {isActive && (
                        <span className="absolute inset-y-1.5 -start-px w-1 rounded-full bg-gradient-to-b from-primary to-primary/60" />
                      )}
                      <Icon className="size-4.5 transition-transform duration-300 group-data-[active=true]:scale-110" />
                      <span>{t(item.key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        {/* Inventory Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{t("navigation.inventoryTitle")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path} className="mb-0.5">
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={t(item.key)}
                      render={<Link to={item.path} />}
                      className="relative h-10 rounded-lg transition-all duration-300 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:ring-1 data-[active=true]:ring-primary/15 data-[active=true]:shadow-glow hover:bg-muted/60 hover:shadow-soft"
                    >
                      {isActive && (
                        <span className="absolute inset-y-1.5 -start-px w-1 rounded-full bg-gradient-to-b from-primary to-primary/60" />
                      )}
                      <Icon className="size-4.5 transition-transform duration-300 group-data-[active=true]:scale-110" />
                      <span>{t(item.key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer pushes System group to the bottom */}
        <div className="flex-1" />

        {/* System Group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path} className="mb-0.5">
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={t(item.key)}
                      render={<Link to={item.path} />}
                      className="relative h-10 rounded-lg transition-all duration-300 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:ring-1 data-[active=true]:ring-primary/15 data-[active=true]:shadow-glow hover:bg-muted/60 hover:shadow-soft"
                    >
                      {isActive && (
                        <span className="absolute inset-y-1.5 -start-px w-1 rounded-full bg-gradient-to-b from-primary to-primary/60" />
                      )}
                      <Icon className="size-4.5 transition-transform duration-300 group-data-[active=true]:scale-110" />
                      <span>{t(item.key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-3">
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
