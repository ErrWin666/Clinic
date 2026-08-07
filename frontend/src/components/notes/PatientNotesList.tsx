import { useState, useDeferredValue } from "react";
import { usePatientNotes } from "@/hooks/usePatientNotes";
import { PatientNoteService } from "@/services/PatientNoteService";
import { NotesListBase } from "./NotesListBase";

interface PatientNotesListProps {
  patientId: number;
}

export function PatientNotesList({ patientId }: PatientNotesListProps) {
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
  } = usePatientNotes(patientId, { search: deferredSearch || undefined, page, pageSize: 10 });

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
        PatientNoteService.getAttachmentDownloadUrl(patientId, noteId, fileId)
      }
      getAttachmentPreviewUrl={(noteId, fileId) =>
        PatientNoteService.getAttachmentPreviewUrl(patientId, noteId, fileId)
      }
      uploadContext={{ kind: "patient", patientId }}
      searchPlaceholderKey="patientNotes.searchPlaceholder"
      newNoteKey="patientNotes.newNote"
      noNotesKey="patientNotes.noNotes"
      search={search}
      onSearchChange={setSearch}
      page={page}
      onPageChange={setPage}
    />
  );
}
