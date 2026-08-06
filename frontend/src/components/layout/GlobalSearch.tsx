import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PatientService, type AutocompleteResult } from "@/services/PatientService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SearchIcon, UserIcon } from "lucide-react";

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<AutocompleteResult[]>({
    queryKey: ["patient-search", debouncedQuery],
    queryFn: async () => {
      const res = await PatientService.autocomplete(debouncedQuery, 8);
      return res.data ?? [];
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient: AutocompleteResult) => {
    navigate(`/patients/${patient.id}`);
    setQuery("");
    setOpen(false);
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={t("common.globalSearch")}
          aria-label={t("common.globalSearch")}
          className="h-9 w-56 rounded-lg border border-border/60 bg-muted/40 ps-9 pe-3 text-sm transition-all placeholder:text-muted-foreground focus:w-72 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 w-full min-w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg z-50">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {t("common.globalSearchSearching")}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {t("common.globalSearchNoResults")}
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-muted/60"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {patient.fullName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {patient.displayId} · {patient.phoneNumber}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
