import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PersonKind = "patient" | "employee";

export interface PatientRow {
  id: string;
  full_name: string;
  patient_id_number: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  kind: PersonKind;
}

/** People notes can be about. Pass `kind` to limit to patients or employees. */
export function usePatients(options?: { activeOnly?: boolean; kind?: PersonKind }) {
  const activeOnly = options?.activeOnly ?? false;
  const kind = options?.kind ?? null;
  return useQuery({
    queryKey: ["patients", activeOnly, kind],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("id, full_name, patient_id_number, date_of_birth, phone, address, active, kind")
        .order("full_name", { ascending: true })
        .limit(2000);
      if (activeOnly) query = query.eq("active", true);
      if (kind) query = query.eq("kind", kind);
      const { data, error } = await query;
      if (error) throw error;
      return data as PatientRow[];
    },
  });
}
