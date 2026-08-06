import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileTextIcon, GlassesIcon } from "lucide-react";
import { ExaminationService } from "@/services/ExaminationService";
import type { Examination } from "@/types/models";
import { EXAM_STATUS_VARIANT } from "@/components/examinations/examination-constants";
import { ExaminationDetailAccordion } from "@/components/examinations/ExaminationDetailAccordion";

interface ExaminationDetailProps {
  exam: Examination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExaminationDetail({
  exam,
  open,
  onOpenChange,
}: ExaminationDetailProps) {
  const { t } = useTranslation();

  if (!exam) return null;

  const handlePDF = () => {
    window.open(ExaminationService.getPDFUrl(exam.id), "_blank");
  };

  const handlePrescriptionPDF = () => {
    window.open(ExaminationService.getPrescriptionPDFUrl(exam.id), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeaderWithIcon
          icon={FileTextIcon}
          variant="primary"
          title={exam.displayId}
          titleExtra={
            <Badge variant={EXAM_STATUS_VARIANT[exam.examStatus]}>
              {t(`examinations.statuses.${exam.examStatus}`)}
            </Badge>
          }
          description={dayjs(exam.examDate).format("YYYY-MM-DD")}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 min-h-0">
            {/* Metadata card */}
            <div className="rounded-lg border border-border/40 bg-muted/30 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    {t("examinations.fields.examDate")}
                  </span>
                  <span className="text-sm font-medium">
                    {dayjs(exam.examDate).format("YYYY-MM-DD")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePDF}>
                    <FileTextIcon className="size-4" />
                    {t("examinations.downloadPDF")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrescriptionPDF}>
                    <GlassesIcon className="size-4" />
                    {t("examinations.printPrescription")}
                  </Button>
                </div>
              </div>
            </div>

            <ExaminationDetailAccordion exam={exam} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
