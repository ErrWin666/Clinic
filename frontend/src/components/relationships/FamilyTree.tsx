import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLinkIcon,
  ShieldIcon,
  BabyIcon,
  UserIcon,
  CalendarIcon,
  UnlinkIcon,
} from "lucide-react";
import { config } from "@/lib/config";
import type { Relationship } from "@/types/models";
import { cn } from "@/lib/utils";

interface FamilyTreeProps {
  relationships: Relationship[];
  patientId: number;
  onUnlink?: (rel: Relationship) => void;
}

type TreeNode = {
  id: number;
  name: string;
  displayId: string;
  profileImage?: string | null;
  gender?: string;
  birthDate?: string;
  patientType?: string;
  relationType?: string;
  role: "guardian" | "child" | "self";
};

const RELATION_BADGE_COLORS: Record<string, string> = {
  father: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  mother: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  guardian: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "single-father": "bg-teal-500/10 text-teal-600 border-teal-500/20",
  "single-mother": "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getProfileImageUrl(profileImage?: string | null): string | undefined {
  if (!profileImage) return undefined;
  if (profileImage.startsWith("http") || profileImage.startsWith("/uploads")) {
    return profileImage;
  }
  return `${config.uploadsUrl}/${profileImage}`;
}

function buildTreeNodes(relationships: Relationship[], patientId: number) {
  const guardians: TreeNode[] = [];
  const children: TreeNode[] = [];

  for (const rel of relationships) {
    if (rel.childId === patientId && rel.guardian) {
      guardians.push({
        id: rel.guardian.id,
        name: rel.guardian.fullName,
        displayId: rel.guardian.displayId,
        profileImage: rel.guardian.profileImage,
        gender: rel.guardian.gender,
        birthDate: rel.guardian.birthDate,
        patientType: rel.guardian.patientType,
        relationType: rel.relationType,
        role: "guardian",
      });
    }
    if (rel.guardianId === patientId && rel.child) {
      children.push({
        id: rel.child.id,
        name: rel.child.fullName,
        displayId: rel.child.displayId,
        profileImage: rel.child.profileImage,
        gender: rel.child.gender,
        birthDate: rel.child.birthDate,
        patientType: rel.child.patientType,
        relationType: rel.relationType,
        role: "child",
      });
    }
  }

  return { guardians, children };
}

function FamilyTreeNode({
  node,
  isRoot,
  index = 0,
  onNavigate,
}: {
  node: TreeNode;
  isRoot?: boolean;
  index?: number;
  onNavigate: (id: number) => void;
}) {
  const { t } = useTranslation();
  const imgUrl = getProfileImageUrl(node.profileImage);

  const roleConfig = {
    guardian: {
      icon: ShieldIcon,
      label: t("relationships.role.guardian"),
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    child: {
      icon: BabyIcon,
      label: t("relationships.role.child"),
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    self: {
      icon: UserIcon,
      label: t("relationships.role.self"),
      className: "bg-primary/10 text-primary border-primary/20",
    },
  };

  const role = roleConfig[node.role];
  const RoleIcon = role.icon;

  return (
    <div
      className={cn(
        "group relative flex w-[200px] flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300",
        isRoot && "border-primary ring-2 ring-primary/20 shadow-sm",
        !isRoot && "hover:border-primary/40"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative">
        <Avatar size="lg" className="ring-2 ring-border">
          {imgUrl && <AvatarImage src={imgUrl} alt={node.name} />}
          <AvatarFallback>{getInitials(node.name)}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background ring-2 ring-border">
          <RoleIcon className="size-3 text-muted-foreground" />
        </div>
      </div>

      <button
        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        onClick={() => onNavigate(node.id)}
      >
        {node.name}
        <ExternalLinkIcon className="size-3 opacity-50 group-hover:opacity-100" />
      </button>

      <span className="text-xs text-muted-foreground">{node.displayId}</span>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {node.relationType && (
          <Badge
            variant="outline"
            className={cn(
              "border",
              RELATION_BADGE_COLORS[node.relationType] ??
                "bg-muted text-muted-foreground border-border"
            )}
          >
            {t(`relationships.relationTypes.${node.relationType}`)}
          </Badge>
        )}
        <Badge variant="outline" className={cn("border", role.className)}>
          <RoleIcon className="size-2.5" />
          {role.label}
        </Badge>
      </div>

      {node.birthDate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="size-3" />
          {new Date(node.birthDate).toLocaleDateString()}
          {node.patientType && node.patientType !== "regular" && (
            <Badge variant="outline" className="ml-1 text-[10px]">
              {t(`relationships.role.${node.patientType}`)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export function FamilyTree({ relationships, patientId, onUnlink }: FamilyTreeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { guardians, children } = buildTreeNodes(relationships, patientId);

  const handleNavigate = (id: number) => navigate(`/patients/${id}`);

  const selfNode: TreeNode = {
    id: patientId,
    name: t("relationships.role.self"),
    displayId: "",
    role: "self",
  };

  return (
    <div className="flex flex-col items-center gap-0 py-6">
      {/* Guardians row */}
      {guardians.length > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-4">
          {guardians.map((node, idx) => (
            <FamilyTreeNode
              key={`g-${node.id}`}
              node={node}
              index={idx}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      {/* Connector: guardians → root */}
      {guardians.length > 0 && (
        <div className="h-8 w-px bg-border" />
      )}

      {/* Root (current patient) */}
      <FamilyTreeNode
        node={selfNode}
        isRoot
        index={guardians.length}
        onNavigate={handleNavigate}
      />

      {/* Connector: root → children */}
      {children.length > 0 && (
        <div className="h-8 w-px bg-border" />
      )}

      {/* Children busbar (if more than 1 child) */}
      {children.length > 1 && (
        <div className="relative h-4 w-full max-w-md">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
          <div
            className="absolute top-0 h-px bg-border"
            style={{
              left: `${100 / (children.length + 1)}%`,
              right: `${100 / (children.length + 1)}%`,
            }}
          />
          {children.map((_, idx) => (
            <div
              key={`busbar-${idx}`}
              className="absolute top-0 h-full w-px bg-border"
              style={{
                left: `${(100 * (idx + 1)) / (children.length + 1)}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Children row */}
      {children.length > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-4 pt-4">
          {children.map((node, idx) => (
            <FamilyTreeNode
              key={`c-${node.id}`}
              node={node}
              index={guardians.length + 1 + idx}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      {/* Unlink button for each relationship */}
      {onUnlink && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {relationships.map((rel) => {
            const isGuardian = rel.guardianId === patientId;
            const relatedName = isGuardian
              ? rel.child?.fullName
              : rel.guardian?.fullName;
            return (
              <Button
                key={`unlink-${rel.id}`}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onUnlink(rel)}
              >
                <UnlinkIcon className="size-3" />
                {t("relationships.unlink")} {relatedName}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
