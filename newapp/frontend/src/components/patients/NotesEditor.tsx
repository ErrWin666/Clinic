import { useCallback } from "react";
import {
  Editor,
  type ImagePickerContext,
  type ImagePickerResult,
  type FileInsertHandler,
} from "@/components/ui/editor";
import type { Editor as TiptapEditor } from "@tiptap/core";
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
  uploadContext?:
    | { kind: "patient"; patientId: number }
    | { kind: "clinic" }
    | { kind: "none" };
  showToolbar?: boolean;
  editorClassName?: string;
}

export function NotesEditor({
  value,
  onChange,
  patientId,
  uploadContext,
  showToolbar = true,
  editorClassName,
}: NotesEditorProps) {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const queryClient = useQueryClient();

  const ctx = uploadContext ?? (patientId ? { kind: "patient" as const, patientId } : { kind: "none" as const });
  const canUpload = ctx.kind !== "none";
  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!canUpload) return null;
      try {
        const response = ctx.kind === "patient"
          ? await UploadService.uploadImage(ctx.patientId, file)
          : await UploadService.uploadGeneralImage(file);
        if (response.success && response.data?.src) {
          return { src: response.data.src, alt: file.name };
        }
      } catch {
        return null;
      }
      return null;
    },
    [canUpload, ctx]
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
          if (!canUpload) {
            resolve(null);
            return;
          }
          try {
            const response = ctx.kind === "patient"
              ? await UploadService.uploadImage(ctx.patientId, file)
              : await UploadService.uploadGeneralImage(file);
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
    [canUpload, ctx]
  );

  const handleRequestFile = useCallback<FileInsertHandler>(
    (editor: TiptapEditor) => {
      if (!canUpload) return;
      const currentPatientId = ctx.kind === "patient" ? ctx.patientId : undefined;
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
            if (currentPatientId) {
              const response = await FileService.uploadFile(currentPatientId, file, null);
              if (response.success && response.data) {
                const downloadUrl = FileService.getFileDownloadUrl(currentPatientId, response.data.id);
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: file.name,
                        marks: [{ type: "link", attrs: { href: downloadUrl, target: "_blank" } }],
                      },
                    ],
                  })
                  .run();
                toast.success(t("notes.fileAttached"));
                void queryClient.invalidateQueries({ queryKey: ["files", currentPatientId] });
              }
            } else {
              const response = await UploadService.uploadGeneralFile(file);
              if (response.success && response.data?.src) {
                const fileUrl = response.data.src;
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: file.name,
                        marks: [{ type: "link", attrs: { href: fileUrl, target: "_blank" } }],
                      },
                    ],
                  })
                  .run();
                toast.success(t("notes.fileAttached"));
              }
            }
          } catch (error) {
            handleApiError(error);
          }
          resolve();
        };
        input.click();
      });
    },
    [canUpload, ctx, queryClient, t, handleApiError]
  );

  return (
    <Editor
      value={value}
      onChange={onChange}
      format="markdown"
      enableImages={canUpload}
      enableImagePasteDrop={canUpload}
      onUploadImage={handleUploadImage}
      onRequestImage={handleRequestImage}
      onRequestFile={canUpload ? handleRequestFile : undefined}
      imageFallback="none"
      showToolbar={showToolbar}
      editorClassName={editorClassName ?? "min-h-[120px] max-h-[300px] overflow-y-auto"}
    />
  );
}
