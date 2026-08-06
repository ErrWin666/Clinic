import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useFiles } from "@/hooks/useFiles";
import { useApiError } from "@/hooks/useApiError";
import { FileService } from "@/services/FileService";
import { formatFileSize, isImageType, isPdfType, truncateFileName } from "@/lib/fileUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { SecureImage } from "@/components/common/SecureImage";
import {
  PaperclipIcon,
  FileIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  CalendarIcon,
} from "lucide-react";
import { ENUMS } from "@/types/enums";
import type { FileEntry } from "@/types/models";

interface ExaminationAttachmentsProps {
  patientId: number;
  examinationId?: number | null;
}

export function ExaminationAttachments({ patientId, examinationId = null }: ExaminationAttachmentsProps) {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const queryClient = useQueryClient();
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files } = useFiles(patientId, null, { pageSize: 100 }, undefined, examinationId);

  const handleUploadFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setIsUploading(true);
      try {
        for (const file of Array.from(fileList)) {
          await FileService.uploadFile(patientId, file, null, examinationId);
        }
        toast.success(t("notes.filesUploaded"));
        void queryClient.invalidateQueries({ queryKey: ["files", patientId] });
      } catch (error) {
        handleApiError(error);
      } finally {
        setIsUploading(false);
      }
    },
    [patientId, examinationId, queryClient, t, handleApiError]
  );

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
    <>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PaperclipIcon className="size-4" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">{t("notes.attachments")}</h3>
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
            {isUploading ? (
              <Spinner className="size-3.5" />
            ) : (
              <UploadIcon className="size-3.5" />
            )}
            {t("notes.uploadFiles")}
          </Button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-wrap gap-2 p-3 transition-colors ${
            isDragOver ? "bg-primary/5" : ""
          }`}
        >
          {files.length === 0 ? (
            <span className="w-full py-2 text-center text-xs text-muted-foreground">
              {t("notes.noAttachments")}
            </span>
          ) : (
            files.map((file) => {
              const previewUrl = FileService.getFilePreviewUrl(patientId, file.id);
              const downloadUrl = FileService.getFileDownloadUrl(patientId, file.id);
              return (
                <div
                  key={file.id}
                  className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5 text-xs transition-all hover:shadow-sm hover:border-primary/40"
                >
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2"
                    onClick={() => setPreviewFile(file)}
                  >
                    {isImageType(file.type) ? (
                      <SecureImage
                        src={previewUrl}
                        alt={file.name}
                        className="size-8 shrink-0 rounded object-cover"
                        fallback={
                          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                        }
                      />
                    ) : isPdfType(file.type) ? (
                      <FileTextIcon className="size-4 shrink-0 text-red-500" />
                    ) : (
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex min-w-0 flex-col overflow-hidden">
                      <span
                        className="max-w-[150px] truncate font-medium group-hover:text-primary"
                        title={file.name}
                      >
                        {truncateFileName(file.name)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarIcon className="size-3" />
                        {dayjs(file.createdAt).format("YYYY-MM-DD")}
                        <span>·</span>
                        {formatFileSize(file.size)}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 shrink-0"
                    aria-label={t("files.download")}
                    onClick={() => window.open(downloadUrl, "_blank")}
                  >
                    <DownloadIcon className="size-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        patientId={patientId}
      />
    </>
  );
}
