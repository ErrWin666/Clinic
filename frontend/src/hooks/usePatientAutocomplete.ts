import { useQuery } from "@tanstack/react-query";
import { PatientService } from "@/services/PatientService";
import type { AutocompleteResult } from "@/services/PatientService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PATIENT_AUTOCOMPLETE_KEY = "patient-autocomplete";

export function usePatientAutocomplete(search: string, enabled = true) {
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: [PATIENT_AUTOCOMPLETE_KEY, debouncedSearch],
    queryFn: () => PatientService.autocomplete(debouncedSearch),
    enabled: enabled && debouncedSearch.trim().length > 0,
    staleTime: 30 * 1000,
  });

  return {
    results: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

export function usePatientById(id: number | null | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ["patient", id],
    queryFn: () => PatientService.getById(id as number),
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });

  return {
    patient: query.data?.data,
    isLoading: query.isLoading,
  };
}

export type { AutocompleteResult };
