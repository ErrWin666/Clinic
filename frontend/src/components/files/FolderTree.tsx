import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  FolderPlusIcon,
  StethoscopeIcon,
} from "lucide-react";
import type { Folder } from "@/types/models";

export interface ExamFolder {
  id: number;
  label: string;
}

interface FolderTreeProps {
  folders: Folder[];
  examFolders?: ExamFolder[];
  selectedFolderId: number | string | null;
  onSelectFolder: (folderId: number | null) => void;
  onSelectExamFolder?: (examId: number) => void;
  onCreateFolder: (parentFolderId: number | null) => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  isCreatingFolder: boolean;
}

interface TreeNode {
  folder: Folder;
  children: TreeNode[];
  depth: number;
}

function buildTree(folders: Folder[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const folder of folders) {
    map.set(folder.id, { folder, children: [], depth: 0 });
  }

  for (const folder of folders) {
    const node = map.get(folder.id)!;
    if (folder.parentFolderId && map.has(folder.parentFolderId)) {
      const parent = map.get(folder.parentFolderId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function TreeItem({
  node,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  expandedIds,
  toggleExpand,
}: {
  node: TreeNode;
  selectedFolderId: number | string | null;
  onSelectFolder: (folderId: number | null) => void;
  onCreateFolder: (parentFolderId: number | null) => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
}) {
  const { t } = useTranslation();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.folder.id);
  const isSelected = selectedFolderId === node.folder.id;

  return (
    <div className="flex flex-col">
      <div
        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted ${isSelected ? "bg-muted font-medium" : ""}`}
        style={{ paddingLeft: `${8 + node.depth * 16}px` }}
      >
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.folder.id)}
              className={`shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-90 rtl:-rotate-90" : "rtl:rotate-180"}`}
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <button
            className="flex flex-1 items-center gap-2 overflow-hidden"
            onClick={() => onSelectFolder(node.folder.id)}
          >
            {isExpanded && hasChildren ? (
              <FolderOpenIcon className="size-4 shrink-0 text-primary/70" />
            ) : (
              <FolderIcon className="size-4 shrink-0 text-primary/70" />
            )}
            <span className="truncate">{node.folder.name}</span>
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("common.actions")}
                className="opacity-0 group-hover:opacity-100"
              />
            }
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onCreateFolder(node.folder.id)}
            >
              <FolderPlusIcon className="size-4" />
              {t("files.newSubfolder")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRenameFolder(node.folder)}
            >
              <PencilIcon className="size-4" />
              {t("files.renameFolder")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteFolder(node.folder)}
            >
              <Trash2Icon className="size-4" />
              {t("files.deleteFolder")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <TreeItem
              key={child.folder.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  examFolders = [],
  selectedFolderId,
  onSelectFolder,
  onSelectExamFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  isCreatingFolder,
}: FolderTreeProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [showRootInput, setShowRootInput] = useState(false);
  const [rootFolderName, setRootFolderName] = useState("");

  const tree = useMemo(() => buildTree(folders), [folders]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateRootFolder = () => {
    if (!rootFolderName.trim()) return;
    onCreateFolder(null);
    setRootFolderName("");
    setShowRootInput(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("files.folders")}</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("files.createFolder")}
          onClick={() => setShowRootInput(!showRootInput)}
        >
          <FolderPlusIcon className="size-4" />
        </Button>
      </div>

      {showRootInput && (
        <div className="flex gap-2">
          <Input
            value={rootFolderName}
            onChange={(e) => setRootFolderName(e.target.value)}
            placeholder={t("files.folderName")}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateRootFolder();
              if (e.key === "Escape") {
                setShowRootInput(false);
                setRootFolderName("");
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateRootFolder}
            disabled={isCreatingFolder || !rootFolderName.trim()}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
      )}

      <ScrollArea className="h-[300px] rounded-lg border p-1">
        <div className="flex flex-col gap-0.5">
          <button
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted ${selectedFolderId === null ? "bg-muted font-medium" : ""}`}
            onClick={() => onSelectFolder(null)}
          >
            <FolderIcon className="size-4" />
            {t("files.allFiles")}
          </button>
          {tree.map((node) => (
            <TreeItem
              key={node.folder.id}
              node={node}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
          {examFolders.length > 0 && (
            <>
              <div className="mt-2 mb-1 px-2 text-xs font-medium text-muted-foreground">
                {t("examinations.title")}
              </div>
              {examFolders.map((exam) => (
                <button
                  key={exam.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted ${selectedFolderId === `exam-${exam.id}` ? "bg-muted font-medium" : ""}`}
                  onClick={() => onSelectExamFolder?.(exam.id)}
                >
                  <StethoscopeIcon className="size-4 shrink-0 text-primary/70" />
                  <span className="truncate">{exam.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
