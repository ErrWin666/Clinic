import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { ClinicTab } from "@/components/settings/ClinicTab";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { BackupTab } from "@/components/settings/BackupTab";
import { AuditLogTab } from "@/components/settings/AuditLogTab";
import { WhatsAppSettingsPanel } from "@/components/settings/WhatsAppSettingsPanel";
import { WhatsAppCloudPanel } from "@/components/settings/WhatsAppCloudPanel";
import { TelegramBotPanel } from "@/components/settings/TelegramBotPanel";
import { SmsMobileApiPanel } from "@/components/settings/SmsMobileApiPanel";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { SupportTab } from "@/components/settings/SupportTab";
import { DataLocationTab } from "@/components/settings/DataLocationTab";
import {
  UserIcon,
  BuildingIcon,
  PaletteIcon,
  BellIcon,
  ArchiveIcon,
  ScrollTextIcon,
  MessageCircleIcon,
  SettingsIcon,
  ShieldIcon,
  LifeBuoyIcon,
  HardDriveIcon,
} from "lucide-react";

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={SettingsIcon}
        title={t("settings.title")}
      />
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">
            <UserIcon className="size-4" />
            {t("settings.tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="clinic">
            <BuildingIcon className="size-4" />
            {t("settings.tabs.clinic")}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <PaletteIcon className="size-4" />
            {t("settings.tabs.appearance")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="size-4" />
            {t("settings.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="backup">
            <ArchiveIcon className="size-4" />
            {t("settings.tabs.backup")}
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircleIcon className="size-4" />
            {t("settings.tabs.whatsapp")}
          </TabsTrigger>
          <TabsTrigger value="auditLog">
            <ScrollTextIcon className="size-4" />
            {t("settings.tabs.auditLog")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldIcon className="size-4" />
            {t("settings.tabs.security")}
          </TabsTrigger>
          {typeof window !== "undefined" && window.electronAPI && (
            <TabsTrigger value="support">
              <LifeBuoyIcon className="size-4" />
              {t("settings.tabs.support")}
            </TabsTrigger>
          )}
          {typeof window !== "undefined" && window.electronAPI && (
            <TabsTrigger value="dataLocation">
              <HardDriveIcon className="size-4" />
              {t("settings.tabs.dataLocation")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in duration-200 mt-4">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="clinic" className="animate-in fade-in duration-200 mt-4">
          <ClinicTab />
        </TabsContent>
        <TabsContent value="appearance" className="animate-in fade-in duration-200 mt-4">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="notifications" className="animate-in fade-in duration-200 mt-4">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="backup" className="animate-in fade-in duration-200 mt-4">
          <BackupTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="animate-in fade-in duration-200 mt-4 space-y-4">
          <WhatsAppCloudPanel />
          <TelegramBotPanel />
          <SmsMobileApiPanel />
          <WhatsAppSettingsPanel />
        </TabsContent>
        <TabsContent value="auditLog" className="animate-in fade-in duration-200 mt-4">
          <AuditLogTab />
        </TabsContent>
        <TabsContent value="security" className="animate-in fade-in duration-200 mt-4">
          <SecurityTab />
        </TabsContent>
        {typeof window !== "undefined" && window.electronAPI && (
          <TabsContent value="support" className="animate-in fade-in duration-200 mt-4">
            <SupportTab />
          </TabsContent>
        )}
        {typeof window !== "undefined" && window.electronAPI && (
          <TabsContent value="dataLocation" className="animate-in fade-in duration-200 mt-4">
            <DataLocationTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
