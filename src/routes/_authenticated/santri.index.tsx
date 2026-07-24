import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/santri/")({
  head: () => ({ meta: [{ title: "Data Santri · MSQ" }] }),
  component: SantriList,
});

function SantriList() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";
  const [q, setQ] = useState("");

  const { data: santriRows, isLoading } = useQuery({
    queryKey: ["santri-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("santri")
        .select("id, nis, nama_lengkap, angkatan, status, halaqah:halaqah_id(nama)")
        .order("nama_lengkap");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (santriRows ?? []).filter(
    (s) =>
      s.nama_lengkap.toLowerCase().includes(q.toLowerCase()) ||
      s.nis.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Data Santri</h1>
          <p className="text-muted-foreground">
            {role === "wali" ? "Daftar anak yang terhubung dengan akun Anda" : "Data induk seluruh santri"}
          </p>
        </div>
        {role === "admin" && (
          <Button asChild>
            <Link to="/santri/new"><Plus className="mr-1 size-4" /> Tambah santri</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Halaqah</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Memuat...</TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Belum ada data santri.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                    <TableCell className="font-medium">{s.nama_lengkap}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(s.halaqah as { nama: string } | null)?.nama ?? "—"}
                    </TableCell>
                    <TableCell>{s.angkatan ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "aktif" ? "secondary" : "outline"} className="capitalize">{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/santri/$id" params={{ id: s.id }}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}