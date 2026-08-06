import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { FileCard } from "@/components/files/FileCard";
import {
  FileIcon,
  UploadIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagesIcon,
} from "lucide-react";
import { ENUMS } from "@/types/enums";
import type { FileEntry } from "@/types/models";

interface FilesPanelProps {
  title: string | undefined;
  files: FileEntry[];
  isLoading: boolean;
  isError: boolean;
  isUploading: boolean;
  searchInput: string;
  pagination: { currentPage: number; totalPages: number } | null | undefined;
  patientId: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  onPreview: (file: FileEntry) => void;
  onDownload: (file: FileEntry) => void;
  onDelete: (file: FileEntry) => void;
  onPageChange: (page: number) => void;
}

export function FilesPanel({
  title,
  files,
  isLoading,
  isError,
  isUploading,
  searchInput,
  pagination,
  patientId,
  fileInputRef,
  onSearchChange,
  onUploadClick,
  onFileUpload,
  onRetry,
  onPreview,
  onDownload,
  onDelete,
  onPageChange,
}: FilesPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <ImagesIcon className="size-4" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      <CardContent className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("files.searchPlaceholder")}
                className="h-8 w-40 ps-7 text-sm"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onFileUpload}
              accept={ENUMS.ALLOWED_FILE_TYPES.map((ext) => `.${ext}`).join(",")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadClick}
              disabled={isUploading}
            >
              <UploadIcon className="size-4" />
              {t("files.upload")}
            </Button>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={onRetry} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyState icon={<FileIcon className="size-7" />} title="files.empty" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                patientId={patientId}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {t("common.pagination.page", {
                current: pagination.currentPage,
                total: pagination.totalPages,
              })}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
              >
                <ChevronLeftIcon className="size-4 rtl:rotate-180" />
              </Button>
              <span className="px-2 text-sm font-medium">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() =>
                  onPageChange(Math.min(pagination!.totalPages, pagination.currentPage + 1))
                }
              >
                <ChevronRightIcon className="size-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
