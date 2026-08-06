import { memo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { Patient } from "@/types/models";
import type { Pagination } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getUploadsUrl } from "@/lib/urls";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";

interface PatientTableProps {
  data: Patient[];
  pagination?: Pagination;
  onPageChange: (page: number) => void;
  onRowClick: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  isFetching: boolean;
  isLoading: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function GenderBadge({ gender }: { gender: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant={gender === "male" ? "default" : "secondary"}>
      {t(`patients.genders.${gender}`)}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const variant =
    type === "guardian"
      ? "default"
      : type === "child"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{t(`patients.types.${type}`)}</Badge>;
}

export const PatientTable = memo(function PatientTable({
  data,
  pagination,
  onPageChange,
  onRowClick,
  onEdit,
  onDelete,
  isFetching,
  isLoading,
}: PatientTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="size-7" />}
        title="patients.empty"
        description="patients.emptyDescription"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t("patients.fields.displayId")}</TableHead>
            <TableHead>{t("patients.fields.fullName")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("patients.fields.phoneNumber")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("patients.fields.gender")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("patients.fields.patientType")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("patients.fields.age")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("patients.fields.createdAt")}</TableHead>
            <TableHead className="w-[50px] text-end">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((patient, index) => (
            <TableRow
              key={patient.id}
              onClick={() => onRowClick(patient)}
              className={`cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-200 ${isFetching ? "opacity-60" : ""}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                {patient.displayId}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    {patient.profileImage && (
                      <AvatarImage src={getUploadsUrl(patient.profileImage)} alt={patient.fullName} />
                    )}
                    <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{patient.fullName}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {patient.phoneNumber}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <GenderBadge gender={patient.gender} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <TypeBadge type={patient.patientType} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {patient.age ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {dayjs(patient.createdAt).format("YYYY-MM-DD")}
              </TableCell>
              <TableCell className="text-end">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.actions")}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    }
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onRowClick(patient);
                      }}
                    >
                      <EyeIcon className="size-4" />
                      {t("common.view")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onEdit(patient);
                      }}
                    >
                      <PencilIcon className="size-4" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDelete(patient);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("common.pagination.page", { current: pagination.currentPage, total: pagination.totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1 || isFetching}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || isFetching}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
