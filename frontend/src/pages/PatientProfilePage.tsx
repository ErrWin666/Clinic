import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { usePatientDetail } from "@/hooks/usePatientDetail";
import { PatientService } from "@/services/PatientService";
import { PatientProfileTabs } from "@/components/patients/PatientProfileTabs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, UserIcon, FileTextIcon } from "lucide-react";

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = Number(id);

  const { patient, isLoading, isError, refetch } = usePatientDetail(patientId);

  if (isLoading) {
    return <LoadingState variant="full-page" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UserIcon}
        title={patient.fullName}
        description={patient.displayId}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => PatientService.getSummaryPDF(patientId)}
            >
              <FileTextIcon className="size-4" />
              {t("patientProfile.printSummary")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/patients")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4 rtl:rotate-180" />
              {t("patientProfile.backToPatients")}
            </Button>
          </div>
        }
      />

      <PatientProfileTabs patient={patient} />
    </div>
  );
}
