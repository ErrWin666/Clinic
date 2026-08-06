import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useFiles } from "@/hooks/useFiles";
import { useExaminationsSimple } from "@/hooks/useExaminations";
import { FileService } from "@/services/FileService";
import { FolderSidebar } from "@/components/files/FolderSidebar";
import { FilesPanel } from "@/components/files/FilesPanel";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import type { ExamFolder } from "@/components/files/FolderTree";
import { ENUMS } from "@/types/enums";
import type { Folder, FileEntry } from "@/types/models";

interface FileManagerProps {
  patientId: number;
}

export function FileManager({ patientId }: FileManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<number | string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<number | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileEntry | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filesPage, setFilesPage] = useState(1);
  const filesPageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilesPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    folders,
    files,
    filesPagination,
    isLoadingFolders,
    isLoadingFiles,
    isErrorFolders,
    isErrorFiles,
    refetchFolders,
    refetchFiles,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFile,
    deleteFile,
    isCreatingFolder,
    isRenamingFolder,
    isDeletingFolder,
    isUploading,
    isDeletingFile,
  } = useFiles(patientId, selectedFolderId, {
    search: debouncedSearch || undefined,
    page: filesPage,
    pageSize: filesPageSize,
  }, undefined, selectedExamId ?? null);

  const { data: examsData } = useExaminationsSimple(selectedExamId !== null ? patientId : null);

  const examFolders: ExamFolder[] = useMemo(() => {
    const exams = examsData?.data ?? [];
    return exams.map((exam) => ({
      id: exam.id,
      label: `${dayjs(exam.examDate).format("YYYY-MM-DD")} (${exam.displayId})`,
    }));
  }, [examsData]);

  const handleSelectExamFolder = (examId: number) => {
    setSelectedExamId(examId);
    setSelectedFolderId(`exam-${examId}`);
  };

  const handleSelectRegularFolder = (folderId: number | null) => {
    setSelectedExamId(null);
    setSelectedFolderId(folderId);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({
      patientId,
      data: { name: newFolderName.trim(), parentFolderId: newFolderParentId },
    });
    setNewFolderName("");
    setShowNewFolderInput(false);
    setNewFolderParentId(null);
  };

  const handleCreateFolderAt = (parentFolderId: number | null) => {
    setNewFolderParentId(parentFolderId);
    setShowNewFolderInput(true);
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renameValue.trim()) return;
    await renameFolder({ folderId: renamingFolder.id, name: renameValue.trim() });
    setRenamingFolder(null);
    setRenameValue("");
  };

  const handleRenameFolderAt = (folder: Folder) => {
    setRenamingFolder(folder);
    setRenameValue(folder.name);
  };

  const handleDeleteFolderAt = (folder: Folder) => {
    setDeleteFolderTarget(folder);
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderTarget) return;
    await deleteFolder(deleteFolderTarget.id);
    if (selectedFolderId === deleteFolderTarget.id) {
      setSelectedFolderId(null);
    }
    setDeleteFolderTarget(null);
  };

  const handleDeleteFileConfirm = async () => {
    if (!deleteFileTarget) return;
    await deleteFile(deleteFileTarget.id);
    setDeleteFileTarget(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ENUMS.ALLOWED_FILE_TYPES.includes(ext as never)) {
      return;
    }
    if (file.size > ENUMS.MAX_FILE_SIZE) {
      return;
    }
    await uploadFile({
      patientId,
      file,
      folderId: typeof selectedFolderId === "number" ? selectedFolderId : null,
      examinationId: selectedExamId ?? null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (file: FileEntry) => {
    window.open(FileService.getFileDownloadUrl(patientId, file.id), "_blank");
  };

  const panelTitle = selectedExamId
    ? examFolders.find((e) => e.id === selectedExamId)?.label
    : selectedFolderId
      ? folders.find((f) => f.id === selectedFolderId)?.name
      : t("files.allFiles");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[250px_1fr]">
        <FolderSidebar
          folders={folders}
          examFolders={examFolders}
          selectedFolderId={selectedFolderId}
          isLoadingFolders={isLoadingFolders}
          isErrorFolders={isErrorFolders}
          isCreatingFolder={isCreatingFolder}
          isRenamingFolder={isRenamingFolder}
          showNewFolderInput={showNewFolderInput}
          newFolderName={newFolderName}
          renamingFolder={renamingFolder}
          renameValue={renameValue}
          onSelectFolder={handleSelectRegularFolder}
          onSelectExamFolder={handleSelectExamFolder}
          onCreateFolderAt={handleCreateFolderAt}
          onRenameFolderAt={handleRenameFolderAt}
          onDeleteFolderAt={handleDeleteFolderAt}
          onRetry={() => refetchFolders()}
          onNewFolderNameChange={setNewFolderName}
          onCreateFolder={handleCreateFolder}
          onCancelNewFolder={() => {
            setShowNewFolderInput(false);
            setNewFolderName("");
            setNewFolderParentId(null);
          }}
          onRenameValueChange={setRenameValue}
          onRenameFolder={handleRenameFolder}
          onCancelRename={() => {
            setRenamingFolder(null);
            setRenameValue("");
          }}
        />

        <FilesPanel
          title={panelTitle}
          files={files}
          isLoading={isLoadingFiles}
          isError={isErrorFiles}
          isUploading={isUploading}
          searchInput={searchInput}
          pagination={filesPagination}
          patientId={patientId}
          fileInputRef={fileInputRef}
          onSearchChange={setSearchInput}
          onUploadClick={() => fileInputRef.current?.click()}
          onFileUpload={handleFileUpload}
          onRetry={() => refetchFiles()}
          onPreview={setPreviewFile}
          onDownload={handleDownload}
          onDelete={setDeleteFileTarget}
          onPageChange={setFilesPage}
        />
      </div>

      <DeleteConfirmDialog
        open={!!deleteFolderTarget}
        onConfirm={handleDeleteFolderConfirm}
        onCancel={() => setDeleteFolderTarget(null)}
        itemName={deleteFolderTarget?.name ?? ""}
        itemType="files.deleteFolder"
        isPending={isDeletingFolder}
      />

      <DeleteConfirmDialog
        open={!!deleteFileTarget}
        onConfirm={handleDeleteFileConfirm}
        onCancel={() => setDeleteFileTarget(null)}
        itemName={deleteFileTarget?.name ?? ""}
        itemType="files.title"
        isPending={isDeletingFile}
      />

      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        patientId={patientId}
      />
    </div>
  );
}
