import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { roleLabel, type AppRole } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ROLES: AppRole[] = ["admin", "ustadz", "wali", "santri"];

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Manajemen Pengguna · MSQ" },
      { name: "description", content: "Kelola peran pengguna sistem informasi Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "Manajemen Pengguna · MSQ" },
      { property: "og:description", content: "Kelola peran pengguna sistem informasi Ma'had Sabilul Qur'an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();

  const usersQ = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Peran diperbarui");
      qc.invalidateQueries({ queryKey: ["users-roles"] });
      qc.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">Atur peran setiap akun pengguna sistem</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Shield className="size-4 text-primary" /> Daftar pengguna
          </CardTitle>
          <CardDescription>Klik peran untuk memberikan atau mencabutnya</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat pengguna…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran aktif</TableHead>
                  <TableHead className="text-right">Ubah peran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersQ.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="space-x-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Tanpa peran</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge key={r} variant="secondary">
                            {roleLabel(r)}
                          </Badge>
                        ))
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {ROLES.map((r) => {
                          const has = u.roles.includes(r);
                          return (
                            <Button
                              key={r}
                              size="sm"
                              variant={has ? "default" : "outline"}
                              disabled={toggleRole.isPending}
                              onClick={() => toggleRole.mutate({ userId: u.id, role: r, has })}
                            >
                              {r}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}