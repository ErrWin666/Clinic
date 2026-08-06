import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePatientDetail } from "@/hooks/usePatientDetail";
import {
  useDeletePatient,
  useUpdatePatient,
  useSendTelegramInvite,
} from "@/hooks/usePatientMutations";
import { PatientForm, type PatientFormValues } from "@/components/patients/PatientForm";
import { PatientActivityCards } from "@/components/patients/PatientActivityCards";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getUploadsUrl } from "@/lib/urls";
import { toast } from "sonner";
import {
  PencilIcon,
  Trash2Icon,
  CameraIcon,
  XIcon,
  SendIcon,
  MessageCircleIcon,
} from "lucide-react";
import type { PatientDetail } from "@/types/models";
import type { PatientUpdateData } from "@/services/PatientService";

interface OverviewTabProps {
  patient: PatientDetail;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PatientOverviewTab({ patient }: OverviewTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { uploadImage, deleteImage, isUploadingImage } = usePatientDetail(
    patient.id
  );
  const { deletePatient, isDeleting } = useDeletePatient();
  const { updatePatient } = useUpdatePatient();
  const { sendTelegramInvite, isSending: sendingInvite } = useSendTelegramInvite();

  const lastExam = patient.eyeExaminations?.[0];
  const lastInvoice = patient.invoices?.[0];
  const nextAppointment = patient.appointments
    ?.filter((a) => new Date(a.appointmentDate) >= new Date())
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage({ id: patient.id, file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageDelete = async () => {
    await deleteImage(patient.id);
  };

  const handleEdit = () => setFormOpen(true);

  const handleDelete = async () => {
    try {
      await deletePatient(patient.id);
      navigate("/patients");
    } catch {
      setDeleteOpen(false);
    }
  };

  const handleFormSubmit = async (data: PatientFormValues, _isEdit: boolean) => {
    const payload: PatientUpdateData = {
      ...data,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
    };
    await updatePatient({ id: patient.id, data: payload });
    setFormOpen(false);
    window.location.reload();
  };

  const handleSendTelegramInvite = async () => {
    try {
      const res = await sendTelegramInvite(patient.id);
      if (res.data?.smsSent) {
        toast.success(t("patientProfile.telegramInviteSent"));
      } else {
        toast.warning(t("patientProfile.telegramInviteFailed"));
      }
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative group">
              <Avatar size="xl">
                {patient.profileImage && (
                  <AvatarImage
                    src={getUploadsUrl(patient.profileImage)}
                    alt={patient.fullName}
                  />
                )}
                <AvatarFallback className="text-lg">
                  {getInitials(patient.fullName)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <CameraIcon className="size-3.5" />
              </Button>
              {patient.profileImage && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="absolute bottom-0 left-0 rounded-full"
                  onClick={handleImageDelete}
                  disabled={isUploadingImage}
                >
                  <XIcon className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{patient.fullName}</h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {patient.displayId}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {t(`patients.genders.${patient.gender}`)}
                </Badge>
                <Badge variant="outline">
                  {t(`patients.types.${patient.patientType}`)}
                </Badge>
                {patient.age !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {patient.age} {t("patients.fields.age")}
                  </span>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {t("patients.fields.phoneNumber")}
                  </span>
                  <span>{patient.phoneNumber}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {t("patients.fields.email")}
                  </span>
                  <span>{patient.email || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {t("patients.fields.birthDate")}
                  </span>
                  <span>
                    {dayjs(patient.birthDate).format("YYYY-MM-DD")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {t("patients.fields.address")}
                  </span>
                  <span>{patient.address || "—"}</span>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("patientProfile.telegramStatus")}:
                </span>
                {patient.telegramChatId ? (
                  <Badge variant="secondary" className="gap-1">
                    <SendIcon className="size-3" />
                    {t("patientProfile.telegramConnected")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <MessageCircleIcon className="size-3" />
                    {t("patientProfile.telegramNotConnected")}
                  </Badge>
                )}
                {!patient.telegramChatId && patient.phoneNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTelegramInvite}
                    disabled={sendingInvite}
                  >
                    <SendIcon className="size-3.5" />
                    {t("patientProfile.sendTelegramInvite")}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <PencilIcon className="size-4" />
                {t("patientProfile.editPatient")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="size-4" />
                {t("patientProfile.deletePatient")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm border-border/40">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-heading font-bold text-foreground">
              {patient.appointments?.length ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("patientProfile.totalVisits")}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/40">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-heading font-bold text-foreground">
              {(patient.invoices ?? []).reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0).toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("patientProfile.totalSpent")}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/40">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-heading font-bold text-foreground">
              {patient.eyeExaminations?.length ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("patientProfile.timelineExamination")}
            </span>
          </CardContent>
        </Card>
      </div>

      <PatientActivityCards
        lastExam={lastExam}
        lastInvoice={lastInvoice}
        nextAppointment={nextAppointment}
      />

      <PatientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={patient}
        onSubmit={handleFormSubmit}
        isPending={false}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        itemName={patient.fullName}
        itemType="patients.singular"
        isPending={isDeleting}
      />
    </div>
  );
}
