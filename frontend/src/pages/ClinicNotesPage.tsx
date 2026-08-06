import { useTranslation } from "react-i18next";
import { ClinicNotesList } from "@/components/notes/ClinicNotesList";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StickyNoteIcon } from "lucide-react";

export function ClinicNotesPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={StickyNoteIcon}
        title={t("clinicNotes.title")}
        description={t("clinicNotes.description")}
      />
      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover animate-stagger-1">
        <CardContent className="p-4">
          <ClinicNotesList />
        </CardContent>
      </Card>
    </div>
  );
}
