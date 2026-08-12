import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useUpdatePatient } from "@/hooks/usePatientMutations";
import { useFiles } from "@/hooks/useFiles";
import { formatFileSize, isImageType, isPdfType } from "@/lib/fileUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { SecureImage } from "@/components/common/SecureImage";
import {
  SaveIcon,
  PaperclipIcon,
  FileIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { ENUMS } from "@/types/enums";
import type { PatientDetail, FileEntry } from "@/types/models";
import { FileService } from "@/services/FileService";

const NotesEditor = lazy(() => import("@/components/patients/NotesEditor").then(m => ({ default: m.NotesEditor })));

interface NotesTabProps {
  patient: PatientDetail;
}

export function NotesTab({ patient }: NotesTabProps) {
  const { t } = useTranslation();
  const { updatePatient } = useUpdatePatient();
  const [notes, setNotes] = useState(patient.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filesPage, setFilesPage] = useState(1);
  const filesPageSize = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPatientNotesRef = useRef(patient.notes);

  const isDirty = notes !== (patient.notes ?? "");

  const { files, filesPagination, uploadFile, isUploading } = useFiles(patient.id, null, { page: filesPage, pageSize: filesPageSize }, undefined, null);

  useEffect(() => {
    if (lastPatientNotesRef.current !== patient.notes) {
      lastPatientNotesRef.current = patient.notes;
      setNotes(patient.notes ?? "");
    }
  }, [patient.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePatient({ id: patient.id, data: { notes: notes || null } });
      toast.success(t("patientProfile.notesSaved"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      await uploadFile({ patientId: patient.id, file, folderId: null });
    }
  }, [patient.id, uploadFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleUploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    void handleUploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <Suspense fallback={<div className="h-[200px] rounded-lg border border-border/60 animate-pulse bg-muted/30" />}>
          <NotesEditor
            value={notes}
            onChange={setNotes}
            patientId={patient.id}
          />
        </Suspense>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <PaperclipIcon className="size-3.5" />
              {t("notes.attachments")}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              accept={ENUMS.ALLOWED_FILE_TYPES.map((ext) => `.${ext}`).join(",")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Spinner className="size-3.5" /> : <UploadIcon className="size-3.5" />}
              {t("notes.uploadFiles")}
            </Button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-wrap gap-2 rounded-lg border-2 border-dashed p-3 transition-colors ${
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            }`}
          >
            {files.length === 0 ? (
              <span className="w-full py-2 text-center text-xs text-muted-foreground">
                {t("notes.noAttachments")}
              </span>
            ) : (
              files.map((file) => {
                const previewUrl = FileService.getFilePreviewUrl(patient.id, file.id);
                const downloadUrl = FileService.getFileDownloadUrl(patient.id, file.id);
                return (
                  <div
                    key={file.id}
                    className="group flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-xs transition-all hover:shadow-sm hover:border-primary/40"
                  >
                    <button
                      className="flex items-center gap-2 overflow-hidden"
                      onClick={() => setPreviewFile(file)}
                    >
                      {isImageType(file.type) ? (
                        <SecureImage
                          src={previewUrl}
                          alt={file.name}
                          className="size-8 shrink-0 rounded object-cover"
                          fallback={<FileIcon className="size-4 shrink-0 text-muted-foreground" />}
                        />
                      ) : isPdfType(file.type) ? (
                        <FileTextIcon className="size-4 shrink-0 text-red-500" />
                      ) : (
                        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex flex-col overflow-hidden">
                        <span className="max-w-[150px] truncate font-medium group-hover:text-primary">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground">
                          {formatFileSize(file.size)} · {dayjs(file.createdAt).format("YYYY-MM-DD")}
                        </span>
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-6 shrink-0"
                      onClick={() => window.open(downloadUrl, "_blank")}
                    >
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {filesPagination && filesPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {t("common.pagination.page", {
                  current: filesPagination.currentPage,
                  total: filesPagination.totalPages,
                })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filesPagination.currentPage <= 1}
                  onClick={() => setFilesPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon className="size-4 rtl:rotate-180" />
                </Button>
                <span className="px-2 text-sm font-medium">
                  {filesPagination.currentPage} / {filesPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filesPagination.currentPage >= filesPagination.totalPages}
                  onClick={() =>
                    setFilesPage((p) =>
                      Math.min(filesPagination!.totalPages, p + 1)
                    )
                  }
                >
                  <ChevronRightIcon className="size-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-2">
          {isDirty && (
            <span className="text-xs text-warning">{t("patientProfile.unsavedChanges")}</span>
          )}
          <Button onClick={handleSave} disabled={isSaving || !isDirty} size="sm">
            {isSaving && <Spinner className="size-4" />}
            <SaveIcon className="size-4" />
            {t("patientProfile.saveNotes")}
          </Button>
        </div>
      </CardContent>

      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        patientId={patient.id}
      />
    </Card>
  );
}
