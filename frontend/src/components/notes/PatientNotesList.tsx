import { useState, useDeferredValue, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePatientNotes } from "@/hooks/usePatientNotes";
import { PatientNoteService } from "@/services/PatientNoteService";
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

interface PatientNotesListProps {
  patientId: number;
}

export function PatientNotesList({ patientId }: PatientNotesListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string | null } | null>(null);
  const [editingNote, setEditingNote] = useState<{
    id: number;
    title: string | null;
    content: string;
  } | null>(null);

  const { notes, pagination, isLoading, isError, refetch, isCreating, isUpdating, isDeleting, isUploading, isDeletingAttachment,
    createNote, updateNote, deleteNote, uploadAttachments, deleteAttachment } =
    usePatientNotes(patientId, { search: deferredSearch || undefined, page, pageSize: 10 });

  const totalCount = useMemo(() => pagination?.totalItems ?? notes.length, [pagination, notes.length]);

  const handleCreate = () => {
    setEditingNote(null);
    setDialogOpen(true);
  };

  const handleEdit = (note: typeof notes[0]) => {
    setEditingNote({ id: note.id, title: note.title, content: note.content });
    setDialogOpen(true);
  };

  const handleDelete = (id: number, title: string | null) => {
    setDeleteTarget({ id, title });
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteNote(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (data: { title: string | null; content: string }) => {
    if (editingNote) {
      await updateNote({ id: editingNote.id, data });
    } else {
      await createNote(data);
    }
  };

  const handleUploadAttachments = async (noteId: number, files: File[]) => {
    await uploadAttachments({ noteId, files });
  };

  const handleDeleteAttachment = async (noteId: number, fileId: number) => {
    await deleteAttachment({ noteId, fileId });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("patientNotes.searchPlaceholder")}
            className="ps-8"
          />
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="size-4" />
          {t("patientNotes.newNote")}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState variant="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<StickyNoteIcon className="size-8" />}
          title="patientNotes.noNotes"
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
              getAttachmentUrl={(fileId) =>
                PatientNoteService.getAttachmentDownloadUrl(patientId, note.id, fileId)
              }
              getAttachmentPreviewUrl={(fileId) =>
                PatientNoteService.getAttachmentPreviewUrl(patientId, note.id, fileId)
              }
            />
          ))}
          </div>
        </>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationBar
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      <NoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTitle={editingNote?.title}
        initialContent={editingNote?.content}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        patientId={patientId}
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
