import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-md backdrop-saturate-150 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 [&]:after:absolute [&]:after:inset-x-0 [&]:after:bottom-0 [&]:after:h-px [&]:after:bg-gradient-to-r [&]:after:from-transparent [&]:after:via-primary/10 [&]:after:to-transparent">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 data-[orientation=vertical]:h-4" />
      <Breadcrumbs />

      <div className="ms-auto flex items-center gap-2">
        <GlobalSearch />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={t("common.toggleTheme")}
          className="transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-transform duration-500 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-transform duration-500 dark:rotate-0 dark:scale-100" />
        </Button>
        <LanguageSwitcher />
        <NotificationCenter />
      </div>
    </header>
  );
}
