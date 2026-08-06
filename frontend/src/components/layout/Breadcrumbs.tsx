import React from "react";
import { useLocation, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { usePatient } from "@/hooks/usePatients";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  dashboard: "navigation.dashboard",
  patients: "navigation.patients",
  appointments: "navigation.appointments",
  invoices: "navigation.invoices",
  settings: "navigation.settings",
};

export function Breadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const segments = location.pathname.split("/").filter(Boolean);

  const patientId = segments.length >= 2 && segments[0] === "patients" && /^\d+$/.test(segments[1])
    ? Number(segments[1])
    : null;

  const { data: patientData } = usePatient(patientId);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const path = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const labelKey = routeLabels[segment];
          let label = labelKey ? t(labelKey) : segment;

          if (!labelKey && /^\d+$/.test(segment) && segments[index - 1] === "patients") {
            const cached = queryClient.getQueryData<{ data: { fullName: string } }>(["patient", Number(segment)]);
            const fullName = patientData?.data?.fullName || cached?.data?.fullName;
            if (fullName) {
              label = fullName;
            }
          }

          return (
            <React.Fragment key={path}>
              {index > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={path} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
