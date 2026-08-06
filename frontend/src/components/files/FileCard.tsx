import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { FileService } from "@/services/FileService";
import { formatFileSize, isImageType, isPdfType, truncateFileName } from "@/lib/fileUtils";
import { SecureImage } from "@/components/common/SecureImage";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  FileTextIcon,
  DownloadIcon,
  Trash2Icon,
  EyeIcon,
  CalendarIcon,
} from "lucide-react";
import type { FileEntry } from "@/types/models";

interface FileCardProps {
  file: FileEntry;
  patientId: number;
  onPreview: (file: FileEntry) => void;
  onDownload: (file: FileEntry) => void;
  onDelete: (file: FileEntry) => void;
}

export function FileCard({ file, patientId, onPreview, onDownload, onDelete }: FileCardProps) {
  const { t } = useTranslation();
  const previewUrl = FileService.getFilePreviewUrl(patientId, file.id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:shadow-md hover:border-primary/40">
      <button
        className="flex min-w-0 flex-col text-start"
        onClick={() => onPreview(file)}
      >
        {isImageType(file.type) ? (
          <div className="aspect-video w-full overflow-hidden bg-muted/30">
            <SecureImage
              src={previewUrl}
              alt={file.name}
              className="size-full object-cover transition-transform group-hover:scale-105"
              fallback={
                <div className="flex size-full items-center justify-center bg-muted/30">
                  <FileIcon className="size-8 text-muted-foreground" />
                </div>
              }
            />
          </div>
        ) : isPdfType(file.type) ? (
          <div className="flex h-24 items-center justify-center bg-red-500/5">
            <FileTextIcon className="size-8 text-red-500" />
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center bg-muted/30">
            <FileIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5 p-2.5">
          <span
            className="truncate text-sm font-medium group-hover:text-primary"
            title={file.name}
          >
            {truncateFileName(file.name)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" />
            {dayjs(file.createdAt).format("YYYY-MM-DD")}
            <span>·</span>
            {formatFileSize(file.size)}
          </span>
        </div>
      </button>
      <div className="flex items-center justify-end gap-1 border-t border-border/60 bg-muted/20 px-2 py-1.5">
        <Button variant="ghost" size="icon-sm" aria-label={t("common.view")} onClick={() => onPreview(file)}>
          <EyeIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={t("files.download")} onClick={() => onDownload(file)}>
          <DownloadIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={t("common.delete")} onClick={() => onDelete(file)}>
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
