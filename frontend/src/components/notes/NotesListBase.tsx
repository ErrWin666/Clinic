import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NoteCard } from "./NoteCard";
import { NoteFormDialog } from "./NoteFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PaginationBar } from "@/components/common/PaginationBar";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { PlusIcon, SearchIcon, StickyNoteIcon } from "lucide-react";
import type { NoteAttachment } from "@/types/models";

export interface NoteItem {
  id: number;
  title: string | null;
  content: string;
  createdAt: string;
  attachments?: NoteAttachment[];
}

export interface NotesListBaseProps {
  notes: NoteItem[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploading: boolean;
  isDeletingAttachment: boolean;
  onCreate: (data: { title: string | null; content: string }) => Promise<void>;
  onUpdate: (id: number, data: { title: string | null; content: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUploadAttachments: (noteId: number, files: File[]) => Promise<void>;
  onDeleteAttachment: (noteId: number, fileId: number) => Promise<void>;
  getAttachmentUrl: (noteId: number, fileId: number) => string;
  getAttachmentPreviewUrl: (noteId: number, fileId: number) => string;
  uploadContext: { kind: "patient"; patientId: number } | { kind: "clinic" } | { kind: "none" };
  searchPlaceholderKey: string;
  newNoteKey: string;
  noNotesKey: string;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}

export function NotesListBase({
  notes,
  pagination,
  isLoading,
  isError,
  refetch,
  isCreating,
  isUpdating,
  isDeleting,
  isUploading,
  isDeletingAttachment,
  onCreate,
  onUpdate,
  onDelete,
  onUploadAttachments,
  onDeleteAttachment,
  getAttachmentUrl,
  getAttachmentPreviewUrl,
  uploadContext,
  searchPlaceholderKey,
  newNoteKey,
  noNotesKey,
  search,
  onSearchChange,
  page,
  onPageChange,
}: NotesListBaseProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string | null } | null>(null);
  const [editingNote, setEditingNote] = useState<{
    id: number;
    title: string | null;
    content: string;
  } | null>(null);

  const totalCount = useMemo(() => pagination?.totalItems ?? notes.length, [pagination, notes.length]);

  const handleCreate = () => {
    setEditingNote(null);
    setDialogOpen(true);
  };

  const handleEdit = (note: NoteItem) => {
    setEditingNote({ id: note.id, title: note.title, content: note.content });
    setDialogOpen(true);
  };

  const handleDelete = (id: number, title: string | null) => {
    setDeleteTarget({ id, title });
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (data: { title: string | null; content: string }) => {
    if (editingNote) {
      await onUpdate(editingNote.id, data);
    } else {
      await onCreate(data);
    }
  };

  const handleUploadAttachments = async (noteId: number, files: File[]) => {
    await onUploadAttachments(noteId, files);
  };

  const handleDeleteAttachment = async (noteId: number, fileId: number) => {
    await onDeleteAttachment(noteId, fileId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
            placeholder={t(searchPlaceholderKey)}
            className="ps-8"
          />
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="size-4" />
          {t(newNoteKey)}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState variant="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<StickyNoteIcon className="size-8" />}
          title={noNotesKey}
        />
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            {t("common.pagination.showing", { current: notes.length, total: totalCount })}
          </div>
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => handleEdit(note)}
                onDelete={() => handleDelete(note.id, note.title)}
                onUploadAttachments={(files) => handleUploadAttachments(note.id, files)}
                onDeleteAttachment={(fileId) => handleDeleteAttachment(note.id, fileId)}
                isUploading={isUploading}
                isDeletingAttachment={isDeletingAttachment}
                getAttachmentUrl={(fileId) => getAttachmentUrl(note.id, fileId)}
                getAttachmentPreviewUrl={(fileId) => getAttachmentPreviewUrl(note.id, fileId)}
              />
            ))}
          </div>
        </>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationBar
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}

      <NoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTitle={editingNote?.title}
        initialContent={editingNote?.content}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        uploadContext={uploadContext}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.title ?? t("notes.untitledNote")}
        itemType="notes.note"
        isPending={isDeleting}
      />
    </div>
  );
}
