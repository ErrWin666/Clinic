import { useCallback } from "react";
import {
  Editor,
  type ImagePickerContext,
  type ImagePickerResult,
  type FileInsertHandler,
} from "@/components/ui/editor";
import { UploadService } from "@/services/UploadService";
import { FileService } from "@/services/FileService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useApiError } from "@/hooks/useApiError";

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  patientId?: number;
  showToolbar?: boolean;
  editorClassName?: string;
}

export function NotesEditor({
  value,
  onChange,
  patientId,
  showToolbar = true,
  editorClassName,
}: NotesEditorProps) {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const queryClient = useQueryClient();
  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!patientId) return null;
      try {
        const response = await UploadService.uploadImage(patientId, file);
        if (response.success && response.data?.src) {
          return { src: response.data.src, alt: file.name };
        }
      } catch {
        return null;
      }
      return null;
    },
    [patientId]
  );

  const handleRequestImage = useCallback(
    (_context: ImagePickerContext): Promise<ImagePickerResult | null> => {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          if (!patientId) {
            resolve(null);
            return;
          }
          try {
            const response = await UploadService.uploadImage(patientId, file);
            if (response.success && response.data?.src) {
              resolve({
                kind: "url",
                src: response.data.src,
                alt: file.name,
              });
              return;
            }
          } catch {
            resolve(null);
          }
        };
        input.click();
      });
    },
    [patientId]
  );

  const handleRequestFile = useCallback<FileInsertHandler>(
    () => {
      if (!patientId) return;
      return new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve();
            return;
          }
          try {
            const response = await FileService.uploadFile(patientId, file, null);
            if (response.success && response.data) {
              const downloadUrl = FileService.getFileDownloadUrl(patientId, response.data.id);
              const markdownLink = `[${file.name}](${downloadUrl})`;
              const currentValue = value;
              const newValue = currentValue ? `${currentValue}\n\n${markdownLink}` : markdownLink;
              onChange(newValue);
              toast.success(t("notes.fileAttached"));
              void queryClient.invalidateQueries({ queryKey: ["files", patientId] });
            }
          } catch (error) {
            handleApiError(error);
          }
          resolve();
        };
        input.click();
      });
    },
    [patientId, value, onChange, queryClient, t, handleApiError]
  );

  return (
    <Editor
      value={value}
      onChange={onChange}
      format="markdown"
      enableImages={true}
      enableImagePasteDrop={true}
      onUploadImage={handleUploadImage}
      onRequestImage={handleRequestImage}
      onRequestFile={patientId ? handleRequestFile : undefined}
      imageFallback="none"
      showToolbar={showToolbar}
      editorClassName={editorClassName ?? "min-h-[120px] max-h-[300px] overflow-y-auto"}
    />
  );
}
