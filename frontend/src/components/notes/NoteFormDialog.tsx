import { useState, useRef, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DialogHeaderWithIcon } from "@/components/common/DialogHeaderWithIcon";
import { FormFooter } from "@/components/common/FormFooter";
import { StickyNoteIcon } from "lucide-react";

const NotesEditor = lazy(() =>
  import("@/components/patients/NotesEditor").then((m) => ({ default: m.NotesEditor }))
);

interface NoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string | null;
  initialContent?: string;
  onSubmit: (data: { title: string | null; content: string }) => Promise<void>;
  isSubmitting?: boolean;
  patientId?: number;
}

function NoteFormContent({
  initialTitle,
  initialContent,
  onSubmit,
  onDone,
  isSubmitting,
  patientId,
}: {
  initialTitle?: string | null;
  initialContent?: string;
  onSubmit: (data: { title: string | null; content: string }) => Promise<void>;
  onDone: () => void;
  isSubmitting?: boolean;
  patientId?: number;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [content, setContent] = useState(initialContent ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit({ title: title.trim() || null, content });
    onDone();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (content.trim()) {
        void onSubmit({ title: title.trim() || null, content }).then(onDone);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field className="gap-2">
          <FieldLabel htmlFor="note-title">{t("notes.title")}</FieldLabel>
          <Input
            id="note-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notes.titlePlaceholder")}
            maxLength={255}
            autoFocus
          />
          {title.length > 200 && (
            <span className="text-xs text-muted-foreground">{title.length}/255</span>
          )}
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor="note-content">{t("notes.content")}</FieldLabel>
          <Suspense
            fallback={
              <div className="h-[200px] rounded-lg border border-border/60 animate-pulse bg-muted/30" />
            }
          >
            <NotesEditor
              value={content}
              onChange={setContent}
              patientId={patientId}
            />
          </Suspense>
        </Field>
      </FieldGroup>
      <FormFooter
        onCancel={onDone}
        isSubmitting={isSubmitting || !content.trim()}
        submitLabel={initialContent ? t("common.save") : t("common.create")}
      />
    </form>
  );
}

export function NoteFormDialog({
  open,
  onOpenChange,
  initialTitle,
  initialContent,
  onSubmit,
  isSubmitting,
  patientId,
}: NoteFormDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col sm:max-w-2xl" data-slot="note-form-dialog">
        <DialogHeaderWithIcon
          icon={StickyNoteIcon}
          variant="primary"
          title={initialContent ? t("notes.editNote") : t("notes.newNote")}
          description={t("notes.formDescription")}
          headerClassName="px-6 py-4 border-b border-border/50 shrink-0"
        />
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {open && (
            <NoteFormContent
              initialTitle={initialTitle}
              initialContent={initialContent}
              onSubmit={onSubmit}
              onDone={() => onOpenChange(false)}
              isSubmitting={isSubmitting}
              patientId={patientId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
