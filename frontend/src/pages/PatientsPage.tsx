import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { usePatients } from "@/hooks/usePatients";
import { PatientService } from "@/services/PatientService";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientForm, type PatientFormValues } from "@/components/patients/PatientForm";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, DownloadIcon, UsersIcon } from "lucide-react";
import type { Patient } from "@/types/models";

export function PatientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [patientType, setPatientType] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const {
    patients,
    pagination,
    isLoading,
    isFetching,
    isError,
    refetch,
    createPatient,
    updatePatient,
    deletePatient,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePatients({ search, patientType, gender, page });

  const handleClearFilters = () => {
    setSearch("");
    setPatientType("");
    setGender("");
    setPage(1);
  };

  const handleAdd = () => {
    setEditingPatient(null);
    setFormOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormOpen(true);
  };

  const handleRowClick = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handleDelete = (patient: Patient) => {
    setDeleteTarget(patient);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deletePatient(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormSubmit = async (data: PatientFormValues, isEdit: boolean) => {
    if (isEdit && editingPatient) {
      await updatePatient({ id: editingPatient.id, data });
    } else {
      await createPatient(data);
    }
  };

  const handleExport = () => {
    PatientService.export({
      search: search || undefined,
      patientType: patientType || undefined,
      gender: gender || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={UsersIcon}
        title={t("patients.title")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="size-4" />
              {t("patients.export")}
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <PlusIcon className="size-4" />
              {t("patients.add")}
            </Button>
          </>
        }
      />

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
        <CardContent className="flex flex-col gap-4 p-4">
          <PatientFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            patientType={patientType}
            onTypeChange={(v) => {
              setPatientType(v);
              setPage(1);
            }}
            gender={gender}
            onGenderChange={(v) => {
              setGender(v);
              setPage(1);
            }}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60 transition-all duration-300 hover:shadow-hover overflow-hidden">
        <CardContent className="p-0">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <PatientTable
              data={patients}
              pagination={pagination}
              onPageChange={setPage}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isFetching={isFetching}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      <PatientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        patient={editingPatient}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.fullName ?? ""}
        itemType="patients.singular"
        isPending={isDeleting}
      />
    </div>
  );
}
