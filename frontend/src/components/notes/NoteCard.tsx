import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SecureImage } from "@/components/common/SecureImage";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { formatFileSize, isImageType, isPdfType } from "@/lib/fileUtils";
import { ENUMS } from "@/types/enums";
import type { NoteAttachment } from "@/types/models";
import {
  PaperclipIcon,
  FileIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

interface NoteCardProps {
  note: {
    id: number;
    title: string | null;
    content: string;
    createdAt: string;
    attachments?: NoteAttachment[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onUploadAttachments?: (files: File[]) => Promise<void>;
  onDeleteAttachment?: (fileId: number) => Promise<void>;
  isUploading?: boolean;
  isDeletingAttachment?: boolean;
  getAttachmentUrl: (fileId: number) => string;
  getAttachmentPreviewUrl?: (fileId: number) => string;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onUploadAttachments,
  onDeleteAttachment,
  isUploading,
  isDeletingAttachment,
  getAttachmentUrl,
  getAttachmentPreviewUrl,
}: NoteCardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<{ fileId: number; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadAttachments) {
      void onUploadAttachments(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 shadow-card transition-all duration-300 hover:shadow-hover hover:ring-1 hover:ring-primary/15 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.title && (
            <h3 className="mb-1 text-sm font-semibold truncate">{note.title}</h3>
          )}
          <div
            className={`prose prose-sm dark:prose-invert max-w-full text-sm text-muted-foreground break-words overflow-x-auto ${expanded ? "" : "max-h-24 overflow-hidden"}`}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
          {!expanded && (
            <div className="pointer-events-none -mt-4 h-4 bg-gradient-to-b from-transparent to-card" />
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="size-3" />
                {t("common.showLess")}
              </>
            ) : (
              <>
                <ChevronDownIcon className="size-3" />
                {t("common.showMore")}
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("common.edit")}
              onClick={onEdit}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label={t("common.delete")}
              onClick={onDelete}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClockIcon className="size-3" />
        {dayjs(note.createdAt).format("YYYY-MM-DD HH:mm")}
      </div>

      {onUploadAttachments && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PaperclipIcon className="size-3" />
              {t("notes.attachments")}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept={ENUMS.ALLOWED_FILE_TYPES.map((ext) => `.${ext}`).join(",")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Spinner className="size-3" /> : <UploadIcon className="size-3" />}
              {t("notes.uploadFiles")}
            </Button>
          </div>

          {note.attachments && note.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-lg border-2 border-dashed border-border/60 p-2 transition-colors duration-200 hover:border-primary/30">
              {note.attachments.map((file) => {
                const downloadUrl = getAttachmentUrl(file.id);
                const previewUrl = getAttachmentPreviewUrl?.(file.id) ?? downloadUrl;
                return (
                  <div
                    key={file.id}
                    className="group/file flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5 text-xs transition-all duration-200 hover:border-primary/30 hover:shadow-soft"
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
                    <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                    <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-6 shrink-0"
                      aria-label={t("common.download")}
                      onClick={() => window.open(downloadUrl, "_blank")}
                    >
                      <DownloadIcon className="size-3" />
                    </Button>
                    {onDeleteAttachment && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 shrink-0 text-destructive"
                        aria-label={t("common.delete")}
                        onClick={() => setDeleteAttachmentTarget({ fileId: file.id, name: file.name })}
                        disabled={isDeletingAttachment}
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <DeleteConfirmDialog
        open={!!deleteAttachmentTarget}
        onConfirm={async () => {
          if (deleteAttachmentTarget && onDeleteAttachment) {
            await onDeleteAttachment(deleteAttachmentTarget.fileId);
            setDeleteAttachmentTarget(null);
          }
        }}
        onCancel={() => setDeleteAttachmentTarget(null)}
        itemName={deleteAttachmentTarget?.name ?? ""}
        itemType="notes.attachment"
        isPending={isDeletingAttachment}
      />
    </div>
  );
}
