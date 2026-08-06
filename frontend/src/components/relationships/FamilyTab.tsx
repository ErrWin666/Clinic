import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useRelationships } from "@/hooks/useRelationships";
import { PatientService, type AutocompleteResult } from "@/services/PatientService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { FamilyTree } from "@/components/relationships/FamilyTree";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UsersIcon,
  LinkIcon,
  UnlinkIcon,
  SearchIcon,
  ExternalLinkIcon,
  NetworkIcon,
  ListIcon,
} from "lucide-react";
import { ENUMS, type RelationType } from "@/types/enums";
import type { Relationship } from "@/types/models";
import { cn } from "@/lib/utils";

type ViewMode = "tree" | "list";

interface FamilyTabProps {
  patientId: number;
}

export function FamilyTab({ patientId }: FamilyTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AutocompleteResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<AutocompleteResult | null>(null);
  const [relationType, setRelationType] = useState<RelationType | "">("");
  const [deleteTarget, setDeleteTarget] = useState<Relationship | null>(null);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const {
    relationships,
    isLoading,
    isError,
    refetch,
    createRelationship,
    deleteRelationship,
    isCreating,
    isDeleting,
  } = useRelationships(patientId);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimer) clearTimeout(searchTimer);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await PatientService.autocomplete(value);
      setSearchResults(results.data ?? []);
    }, 300);
    setSearchTimer(timer);
  };

  const handleLink = async () => {
    if (!selectedPatient || !relationType) return;
    await createRelationship({
      patientId,
      data: {
        relatedPatientId: selectedPatient.id,
        relationType: relationType as RelationType,
      },
    });
    setSelectedPatient(null);
    setSearchQuery("");
    setSearchResults([]);
    setRelationType("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteRelationship({ patientId, relationshipId: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-sm overflow-visible">
        <CardContent className="flex flex-col gap-3 p-4">
          <h3 className="text-sm font-medium">{t("relationships.link")}</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("relationships.searchPatient")}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="ps-8"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => {
                        setSelectedPatient(result);
                        setSearchQuery(result.fullName);
                        setSearchResults([]);
                      }}
                    >
                      <span className="font-medium">{result.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.displayId} · {result.phoneNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select
              value={relationType || "none"}
              onValueChange={(v) =>
                setRelationType(v === "none" ? "" : (v as RelationType))
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t("relationships.selectRelationType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("relationships.selectRelationType")}
                </SelectItem>
                {ENUMS.RELATION_TYPE.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`relationships.relationTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleLink}
              disabled={!selectedPatient || !relationType || isCreating}
              size="sm"
            >
              <LinkIcon className="size-4" />
              {t("relationships.link")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : relationships.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="size-7" />}
              title="relationships.empty"
              description="relationships.emptyDescription"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* View toggle */}
              <div className="flex items-center justify-end gap-1 rounded-lg bg-muted/50 p-1 w-fit ml-auto">
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "tree"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setViewMode("tree")}
                >
                  <NetworkIcon className="size-3.5" />
                  {t("relationships.treeView")}
                </button>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon className="size-3.5" />
                  {t("relationships.listView")}
                </button>
              </div>

              {/* Tree view */}
              {viewMode === "tree" && (
                <FamilyTree
                  relationships={relationships}
                  patientId={patientId}
                  onUnlink={(rel) => setDeleteTarget(rel)}
                />
              )}

              {/* List view */}
              {viewMode === "list" && (
                <div className="flex flex-col gap-2">
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        {(() => {
                          const isGuardian = rel.guardianId === patientId;
                          const relatedId = isGuardian ? rel.childId : rel.guardianId;
                          const relatedName = isGuardian ? rel.child?.fullName : rel.guardian?.fullName;
                          const relatedDisplayId = isGuardian ? rel.child?.displayId : rel.guardian?.displayId;
                          const relatedPatientType = isGuardian ? rel.child?.patientType : rel.guardian?.patientType;
                          return (
                            <>
                              <button
                                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                                onClick={() => navigate(`/patients/${relatedId}`)}
                              >
                                {relatedName ?? `#${relatedId}`}
                                <ExternalLinkIcon className="size-3 opacity-60" />
                              </button>
                              {relatedDisplayId && (
                                <span className="text-xs text-muted-foreground">
                                  {relatedDisplayId}
                                </span>
                              )}
                              {relatedPatientType && relatedPatientType !== "regular" && (
                                <Badge variant="outline" className="text-[10px]">
                                  {t(`relationships.role.${relatedPatientType}`)}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                        <Badge variant="outline">
                          {t(`relationships.relationTypes.${rel.relationType}`)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(rel)}
                      >
                        <UnlinkIcon className="size-4" />
                        {t("relationships.unlink")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        itemName={
          deleteTarget
            ? deleteTarget.guardianId === patientId
              ? (deleteTarget.child?.fullName ?? `#${deleteTarget.childId}`)
              : (deleteTarget.guardian?.fullName ?? `#${deleteTarget.guardianId}`)
            : ""
        }
        itemType="relationships.title"
        isPending={isDeleting}
      />
    </div>
  );
}
