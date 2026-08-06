import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GitCompareIcon } from "lucide-react";
import type { Examination } from "@/types/models";

interface ExaminationComparisonProps {
  examinations: Examination[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMPARISON_FIELDS: { key: keyof Examination; labelKey: string }[] = [
  { key: "examDate", labelKey: "examinations.fields.examDate" },
  { key: "examStatus", labelKey: "examinations.fields.examStatus" },
  { key: "rightEyeWithoutCorrection", labelKey: "examinations.fields.rightEyeWithoutCorrection" },
  { key: "rightEyeWithCorrection", labelKey: "examinations.fields.rightEyeWithCorrection" },
  { key: "rightEyePressure", labelKey: "examinations.fields.rightEyePressure" },
  { key: "leftEyeWithoutCorrection", labelKey: "examinations.fields.leftEyeWithoutCorrection" },
  { key: "leftEyeWithCorrection", labelKey: "examinations.fields.leftEyeWithCorrection" },
  { key: "leftEyePressure", labelKey: "examinations.fields.leftEyePressure" },
  { key: "rightEyeSphericalPower", labelKey: "examinations.fields.rightEyeSphericalPower" },
  { key: "rightEyeCylindricalPower", labelKey: "examinations.fields.rightEyeCylindricalPower" },
  { key: "rightEyeAxis", labelKey: "examinations.fields.rightEyeAxis" },
  { key: "leftEyeSphericalPower", labelKey: "examinations.fields.leftEyeSphericalPower" },
  { key: "leftEyeCylindricalPower", labelKey: "examinations.fields.leftEyeCylindricalPower" },
  { key: "leftEyeAxis", labelKey: "examinations.fields.leftEyeAxis" },
  { key: "rightEyeRetinaExamination", labelKey: "examinations.fields.rightEyeRetinaExamination" },
  { key: "leftEyeRetinaExamination", labelKey: "examinations.fields.leftEyeRetinaExamination" },
  { key: "generalNotes", labelKey: "examinations.fields.generalNotes" },
];

export function ExaminationComparison({
  examinations,
  open,
  onOpenChange,
}: ExaminationComparisonProps) {
  const { t } = useTranslation();
  const [examAId, setExamAId] = useState<string>("");
  const [examBId, setExamBId] = useState<string>("");

  const examA = useMemo(
    () => examinations.find((e) => String(e.id) === examAId) ?? null,
    [examinations, examAId]
  );
  const examB = useMemo(
    () => examinations.find((e) => String(e.id) === examBId) ?? null,
    [examinations, examBId]
  );

  const formatValue = (exam: Examination | null, key: keyof Examination): string => {
    if (!exam) return "—";
    const val = exam[key];
    if (val === undefined || val === null || val === "") return "—";
    if (key === "examDate") return dayjs(val as string).format("YYYY-MM-DD");
    return String(val);
  };

  const hasBoth = examA && examB && examA.id !== examB.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareIcon className="size-5" />
            {t("examinations.compareTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("examinations.compareSelect")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("examinations.compareExamA")}
            </label>
            <Select value={examAId} onValueChange={(v) => setExamAId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("examinations.compareExamA")} />
              </SelectTrigger>
              <SelectContent>
                {examinations.map((exam) => (
                  <SelectItem key={exam.id} value={String(exam.id)}>
                    {exam.displayId} · {dayjs(exam.examDate).format("YYYY-MM-DD")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("examinations.compareExamB")}
            </label>
            <Select value={examBId} onValueChange={(v) => setExamBId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("examinations.compareExamB")} />
              </SelectTrigger>
              <SelectContent>
                {examinations.map((exam) => (
                  <SelectItem key={exam.id} value={String(exam.id)}>
                    {exam.displayId} · {dayjs(exam.examDate).format("YYYY-MM-DD")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasBoth ? (
          <div className="mt-4 rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">{t("examinations.compareField")}</TableHead>
                  <TableHead className="font-medium">
                    {examA.displayId}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {dayjs(examA.examDate).format("YYYY-MM-DD")}
                    </span>
                  </TableHead>
                  <TableHead className="font-medium">
                    {examB.displayId}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {dayjs(examB.examDate).format("YYYY-MM-DD")}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON_FIELDS.map((field) => {
                  const valA = formatValue(examA, field.key);
                  const valB = formatValue(examB, field.key);
                  const isDifferent = valA !== valB && valA !== "—" && valB !== "—";
                  return (
                    <TableRow key={field.key}>
                      <TableCell className="text-sm text-muted-foreground">
                        {t(field.labelKey)}
                      </TableCell>
                      <TableCell className={`text-sm ${isDifferent ? "font-medium" : ""}`}>
                        {valA}
                      </TableCell>
                      <TableCell className={`text-sm ${isDifferent ? "font-medium text-primary" : ""}`}>
                        {valB}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : examAId || examBId ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("examinations.compareNeedTwo")}
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("examinations.compareNoSelection")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
