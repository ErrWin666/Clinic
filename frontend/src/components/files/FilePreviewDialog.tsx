import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FileIcon, FileTextIcon, Maximize2Icon, ImageIcon } from "lucide-react";
import { FileService } from "@/services/FileService";
import { SecureImage } from "@/components/common/SecureImage";
import { isImageType, isPdfType } from "@/lib/fileUtils";
import type { FileEntry } from "@/types/models";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileEntry | null;
  patientId: number;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  patientId,
}: FilePreviewDialogProps) {
  const { t } = useTranslation();

  if (!file) return null;

  const previewUrl = FileService.getFilePreviewUrl(patientId, file.id);
  const downloadUrl = FileService.getFileDownloadUrl(patientId, file.id);

  const isImage = isImageType(file.type);
  const isPdf = isPdfType(file.type);

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 p-2 overflow-hidden shadow-sm">
          <SecureImage
            src={previewUrl}
            alt={file.name}
            className="max-h-[60vh] max-w-full rounded-lg object-contain"
            fallback={
              <div className="flex flex-col items-center gap-3 p-12">
                <FileIcon className="size-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("files.previewNotAvailable")}</p>
              </div>
            }
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm">
          <iframe
            src={previewUrl}
            title={file.name}
            className="h-[60vh] w-full"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-12 shadow-sm">
        <FileIcon className="size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("files.previewNotAvailable")}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-fit max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 min-w-0 overflow-hidden pr-8">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/50 shadow-soft ${isImage ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : isPdf ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>
              {isImage ? <ImageIcon className="size-5" /> : isPdf ? <FileTextIcon className="size-5" /> : <FileIcon className="size-5" />}
            </div>
            <span className="truncate min-w-0" title={file.name}>{file.name}</span>
          </DialogTitle>
          <DialogDescription>
            {file.type.toUpperCase()} · {(file.size / 1024).toFixed(1)} KB
          </DialogDescription>
        </DialogHeader>

        {renderPreview()}

        <div className="flex items-center justify-end gap-2">
          {isImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <Maximize2Icon className="size-4" />
              {t("files.openInNewTab")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(downloadUrl, "_blank")}
          >
            <DownloadIcon className="size-4" />
            {t("files.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
