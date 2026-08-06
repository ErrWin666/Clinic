import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { FolderTree, type ExamFolder } from "@/components/files/FolderTree";
import {
  FolderIcon,
  FolderPlusIcon,
  PlusIcon,
  PencilIcon,
} from "lucide-react";
import type { Folder } from "@/types/models";

interface FolderSidebarProps {
  folders: Folder[];
  examFolders: ExamFolder[];
  selectedFolderId: number | string | null;
  isLoadingFolders: boolean;
  isErrorFolders: boolean;
  isCreatingFolder: boolean;
  isRenamingFolder: boolean;
  showNewFolderInput: boolean;
  newFolderName: string;
  renamingFolder: Folder | null;
  renameValue: string;
  onSelectFolder: (folderId: number | null) => void;
  onSelectExamFolder: (examId: number) => void;
  onCreateFolderAt: (parentFolderId: number | null) => void;
  onRenameFolderAt: (folder: Folder) => void;
  onDeleteFolderAt: (folder: Folder) => void;
  onRetry: () => void;
  onNewFolderNameChange: (value: string) => void;
  onCreateFolder: () => void;
  onCancelNewFolder: () => void;
  onRenameValueChange: (value: string) => void;
  onRenameFolder: () => void;
  onCancelRename: () => void;
}

export function FolderSidebar({
  folders,
  examFolders,
  selectedFolderId,
  isLoadingFolders,
  isErrorFolders,
  isCreatingFolder,
  isRenamingFolder,
  showNewFolderInput,
  newFolderName,
  renamingFolder,
  renameValue,
  onSelectFolder,
  onSelectExamFolder,
  onCreateFolderAt,
  onRenameFolderAt,
  onDeleteFolderAt,
  onRetry,
  onNewFolderNameChange,
  onCreateFolder,
  onCancelNewFolder,
  onRenameValueChange,
  onRenameFolder,
  onCancelRename,
}: FolderSidebarProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FolderIcon className="size-4" />
        </div>
        <h3 className="text-sm font-semibold tracking-tight">{t("files.folders")}</h3>
      </div>
      <CardContent className="flex flex-col gap-2 p-3">
        {showNewFolderInput && (
          <div className="flex gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => onNewFolderNameChange(e.target.value)}
              placeholder={t("files.folderName")}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateFolder();
                if (e.key === "Escape") onCancelNewFolder();
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        )}

        {renamingFolder && (
          <div className="flex gap-2">
            <Input
              value={renameValue}
              onChange={(e) => onRenameValueChange(e.target.value)}
              placeholder={t("files.folderName")}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameFolder();
                if (e.key === "Escape") onCancelRename();
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="outline"
              onClick={onRenameFolder}
              disabled={isRenamingFolder || !renameValue.trim()}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          </div>
        )}

        {isErrorFolders ? (
          <ErrorState onRetry={onRetry} />
        ) : isLoadingFolders ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground py-2">
              {t("files.noFolders")}
            </span>
            <Button variant="outline" size="sm" onClick={() => onCreateFolderAt(null)}>
              <FolderPlusIcon className="size-4" />
              {t("files.newFolder")}
            </Button>
          </div>
        ) : (
          <FolderTree
            folders={folders}
            examFolders={examFolders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onSelectExamFolder={onSelectExamFolder}
            onCreateFolder={onCreateFolderAt}
            onRenameFolder={onRenameFolderAt}
            onDeleteFolder={onDeleteFolderAt}
            isCreatingFolder={isCreatingFolder}
          />
        )}
      </CardContent>
    </Card>
  );
}
