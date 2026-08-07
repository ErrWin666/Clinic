import { useState, useDeferredValue } from "react";
import { useClinicNotes } from "@/hooks/useClinicNotes";
import { ClinicNoteService } from "@/services/ClinicNoteService";
import { NotesListBase } from "./NotesListBase";

export function ClinicNotesList() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);

  const {
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
    createNote,
    updateNote,
    deleteNote,
    uploadAttachments,
    deleteAttachment,
  } = useClinicNotes({ search: deferredSearch || undefined, page, pageSize: 10 });

  return (
    <NotesListBase
      notes={notes}
      pagination={pagination}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      isCreating={isCreating}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
      isUploading={isUploading}
      isDeletingAttachment={isDeletingAttachment}
      onCreate={createNote}
      onUpdate={(id, data) => updateNote({ id, data })}
      onDelete={deleteNote}
      onUploadAttachments={(noteId, files) => uploadAttachments({ noteId, files })}
      onDeleteAttachment={(noteId, fileId) => deleteAttachment({ noteId, fileId })}
      getAttachmentUrl={(noteId, fileId) =>
        ClinicNoteService.getAttachmentDownloadUrl(noteId, fileId)
      }
      getAttachmentPreviewUrl={(noteId, fileId) =>
        ClinicNoteService.getAttachmentPreviewUrl(noteId, fileId)
      }
      uploadContext={{ kind: "clinic" }}
      searchPlaceholderKey="clinicNotes.searchPlaceholder"
      newNoteKey="clinicNotes.newNote"
      noNotesKey="clinicNotes.noNotes"
      search={search}
      onSearchChange={setSearch}
      page={page}
      onPageChange={setPage}
    />
  );
}
