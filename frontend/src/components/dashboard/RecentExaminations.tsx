import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Examination } from "@/types/models";
import { EXAM_STATUS_VARIANT } from "@/components/examinations/examination-constants";

interface RecentExaminationsProps {
  examinations: Examination[];
}

export function RecentExaminations({ examinations }: RecentExaminationsProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="font-heading text-base font-semibold">
            {t("dashboard.recentExaminations")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.recentExaminationsDescription")}
          </CardDescription>
        </div>
        <Link
          to="/patients"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("common.viewAll")}
        </Link>
      </CardHeader>
      <CardContent>
        {examinations.length === 0 ? (
          <EmptyState title={t("dashboard.noExaminations")} />
        ) : (
          <div className="flex flex-col gap-2">
            {examinations.map((exam) => {
              const name = exam.patient?.fullName || "—";
              const initial = name.charAt(0).toUpperCase();
              return (
                <Link
                  key={exam.id}
                  to={`/patients/${exam.patientId}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3 transition-all duration-200 hover:border-border/80 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initial}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dayjs(exam.examDate).format("YYYY-MM-DD")}
                      </span>
                    </div>
                  </div>
                  <Badge variant={EXAM_STATUS_VARIANT[exam.examStatus]}>
                    {t(`examinations.statuses.${exam.examStatus}`)}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
