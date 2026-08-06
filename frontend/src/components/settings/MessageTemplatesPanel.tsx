import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareIcon, RotateCcwIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { FormSection } from "@/components/common/FormSection";
import {
  useNotificationTemplates,
  useUpdateTemplate,
  useResetTemplate,
} from "@/hooks/useNotificationTemplates";

interface TemplateData {
  text: string;
  html: string;
  whatsappParams: string[];
}

export function MessageTemplatesPanel() {
  const { t } = useTranslation();
  const { templates, types, whatsappCloudDefinitions, isLoading } = useNotificationTemplates();
  const { updateTemplate, isSaving } = useUpdateTemplate();
  const { resetTemplate } = useResetTemplate();
  const [savingType, setSavingType] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, TemplateData>>({});

  const getTemplate = (type: string): TemplateData => {
    return edited[type] || templates[type] || { text: "", html: "", whatsappParams: [] };
  };

  const handleEdit = (type: string, field: keyof TemplateData, value: string) => {
    const current = getTemplate(type);
    setEdited({ ...edited, [type]: { ...current, [field]: value } });
  };

  const handleSave = async (type: string) => {
    setSavingType(type);
    try {
      const tpl = getTemplate(type);
      await updateTemplate({ type, payload: { text: tpl.text, html: tpl.html } });
      const newEdited = { ...edited };
      delete newEdited[type];
      setEdited(newEdited);
    } finally {
      setSavingType(null);
    }
  };

  const handleReset = async (type: string) => {
    await resetTemplate(type);
    const newEdited = { ...edited };
    delete newEdited[type];
    setEdited(newEdited);
  };

  if (isLoading) {
    return (
      <Card className="shadow-card border-border/60">
        <CardContent className="flex h-32 items-center justify-center">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/60">
      <CardContent>
        <FieldGroup className="gap-5">
          <FormSection
            icon={MessageSquareIcon}
            title={t("settings.templates.title")}
            accentClass="bg-primary/10 text-primary"
          >
            <FieldDescription>
              {t("settings.templates.description")}
            </FieldDescription>
          </FormSection>

          {types.map((type) => {
            const tpl = getTemplate(type);
            const isEdited = !!edited[type];
            return (
              <div key={type} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t(`settings.templates.types.${type}`, type)}
                    </span>
                    {isEdited && (
                      <Badge variant="outline" className="text-xs">
                        {t("settings.templates.edited")}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset(type)}
                    className="h-7 gap-1 text-xs text-muted-foreground"
                  >
                    <RotateCcwIcon className="size-3" />
                    {t("settings.templates.reset")}
                  </Button>
                </div>

                <Field>
                  <FieldLabel htmlFor={`tpl-text-${type}`}>
                    {t("settings.templates.textLabel")}
                  </FieldLabel>
                  <Textarea
                    id={`tpl-text-${type}`}
                    rows={2}
                    value={tpl.text}
                    onChange={(e) => handleEdit(type, "text", e.target.value)}
                    className="text-sm"
                  />
                  <FieldDescription>
                    {t("settings.templates.textHint")}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`tpl-html-${type}`}>
                    {t("settings.templates.htmlLabel")}
                  </FieldLabel>
                  <Textarea
                    id={`tpl-html-${type}`}
                    rows={3}
                    value={tpl.html}
                    onChange={(e) => handleEdit(type, "html", e.target.value)}
                    className="text-sm font-mono"
                  />
                  <FieldDescription>
                    {t("settings.templates.htmlHint")}
                  </FieldDescription>
                </Field>

                {isEdited && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(type)}
                    disabled={savingType === type || isSaving}
                    className="w-fit"
                  >
                    {savingType === type && <Spinner className="size-3.5" />}
                    {t("common.save")}
                  </Button>
                )}
              </div>
            );
          })}

          {whatsappCloudDefinitions.length > 0 && (
            <FormSection
              icon={MessageSquareIcon}
              title={t("settings.templates.whatsappCloudTitle")}
              accentClass="bg-green-500/10 text-green-600 dark:text-green-400"
            >
              <FieldDescription>
                {t("settings.templates.whatsappCloudHint")}
              </FieldDescription>
              <div className="space-y-2">
                {whatsappCloudDefinitions.map((def) => (
                  <div key={def.name} className="rounded-md border p-2 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{def.name}</span>
                      <Badge variant="secondary" className="text-xs">{def.language}</Badge>
                    </div>
                    <p className="text-muted-foreground font-mono">{def.body}</p>
                  </div>
                ))}
              </div>
            </FormSection>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
