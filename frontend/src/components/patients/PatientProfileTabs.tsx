import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PatientOverviewTab } from "@/components/patients/OverviewTab";
import { PatientNotesList } from "@/components/notes/PatientNotesList";
import { PatientTimeline } from "@/components/patients/PatientTimeline";
import { ExaminationList } from "@/components/examinations/ExaminationList";
import { FileManager } from "@/components/files/FileManager";
import { FamilyTab } from "@/components/relationships/FamilyTab";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import type { PatientDetail } from "@/types/models";
import {
  LayoutDashboardIcon,
  EyeIcon,
  CalendarIcon,
  ReceiptIcon,
  FolderIcon,
  UsersIcon,
  StickyNoteIcon,
  ClockIcon,
} from "lucide-react";

interface PatientProfileTabsProps {
  patient: PatientDetail;
}

export function PatientProfileTabs({ patient }: PatientProfileTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="overview">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="overview">
          <LayoutDashboardIcon className="size-4" />
          {t("patientProfile.tabs.overview")}
        </TabsTrigger>
        <TabsTrigger value="examinations">
          <EyeIcon className="size-4" />
          {t("patientProfile.tabs.examinations")}
        </TabsTrigger>
        <TabsTrigger value="appointments">
          <CalendarIcon className="size-4" />
          {t("patientProfile.tabs.appointments")}
        </TabsTrigger>
        <TabsTrigger value="invoices">
          <ReceiptIcon className="size-4" />
          {t("patientProfile.tabs.invoices")}
        </TabsTrigger>
        <TabsTrigger value="files">
          <FolderIcon className="size-4" />
          {t("patientProfile.tabs.files")}
        </TabsTrigger>
        <TabsTrigger value="family">
          <UsersIcon className="size-4" />
          {t("patientProfile.tabs.family")}
        </TabsTrigger>
        <TabsTrigger value="notes">
          <StickyNoteIcon className="size-4" />
          {t("patientProfile.tabs.notes")}
        </TabsTrigger>
        <TabsTrigger value="timeline">
          <ClockIcon className="size-4" />
          {t("patientProfile.tabs.timeline")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="animate-in fade-in duration-200 mt-4">
        <PatientOverviewTab patient={patient} />
      </TabsContent>
      <TabsContent value="examinations" className="animate-in fade-in duration-200 mt-4">
        <ExaminationList patientId={patient.id} />
      </TabsContent>
      <TabsContent value="appointments" className="animate-in fade-in duration-200 mt-4">
        <AppointmentList patientId={patient.id} />
      </TabsContent>
      <TabsContent value="invoices" className="animate-in fade-in duration-200 mt-4">
        <InvoiceList patientId={patient.id} />
      </TabsContent>
      <TabsContent value="files" className="animate-in fade-in duration-200 mt-4">
        <FileManager patientId={patient.id} />
      </TabsContent>
      <TabsContent value="family" className="animate-in fade-in duration-200 mt-4">
        <FamilyTab patientId={patient.id} />
      </TabsContent>
      <TabsContent value="notes" className="animate-in fade-in duration-200 mt-4">
        <PatientNotesList patientId={patient.id} />
      </TabsContent>
      <TabsContent value="timeline" className="animate-in fade-in duration-200 mt-4">
        <PatientTimeline patient={patient} />
      </TabsContent>
    </Tabs>
  );
}

