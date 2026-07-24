import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "ustadz" | "wali" | "santri";

export type CurrentUser = {
  user: User;
  roles: AppRole[];
  fullName: string;
};

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;

  const [{ data: rolesRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  return {
    user,
    roles: (rolesRows ?? []).map((r) => r.role as AppRole),
    fullName: profile?.full_name || (user.email?.split("@")[0] ?? "Pengguna"),
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 30_000,
  });
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("ustadz")) return "ustadz";
  if (roles.includes("wali")) return "wali";
  if (roles.includes("santri")) return "santri";
  return "santri";
}

export function roleLabel(role: AppRole): string {
  return {
    admin: "Admin / TU",
    ustadz: "Ustadz / Musyrif",
    wali: "Wali Santri",
    santri: "Santri",
  }[role];
}