import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { SessionExpiredDialog } from "@/components/common/SessionExpiredDialog";
import { SessionTimeoutWarning } from "@/components/common/SessionTimeoutWarning";

export function AppLayout() {
  const { t } = useTranslation();
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main id="main-content" className="flex flex-1 flex-col gap-6 p-4 pt-6 sm:p-6" role="main" aria-label="Main content">
          <div className="mx-auto w-full max-w-[1400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      <SessionExpiredDialog />
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}
