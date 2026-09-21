import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PatientRow {
  id: string;
  full_name: string;
  patient_id_number: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
}

export function usePatients(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? false;
  return useQuery({
    queryKey: ["patients", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("id, full_name, patient_id_number, date_of_birth, phone, address, active")
        .order("full_name", { ascending: true });
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as PatientRow[];
    },
  });
}
