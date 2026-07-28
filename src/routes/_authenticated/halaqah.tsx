import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Plus, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/halaqah")({
  head: () => ({
    meta: [
      { title: "Halaqah · MSQ" },
      { name: "description", content: "Kelola kelompok halaqah tahfizh dan sebaran santri di Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "Halaqah · MSQ" },
      { property: "og:description", content: "Kelola kelompok halaqah tahfizh dan sebaran santri Ma'had Sabilul Qur'an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HalaqahPage,
});

function HalaqahPage() {
  const { data: me } = useCurrentUser();
  const isAdmin = me ? primaryRole(me.roles) === "admin" : false;
  const qc = useQueryClient();
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const halaqahQ = useQuery({
    queryKey: ["halaqah-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("halaqah").select("id, nama, deskripsi").order("nama");
      if (error) throw error;
      return data ?? [];
    },
  });

  const santriQ = useQuery({
    queryKey: ["halaqah-santri"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("santri")
        .select("id, nama_lengkap, nis, halaqah_id, status")
        .order("nama_lengkap");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createHalaqah = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("halaqah").insert({ nama, deskripsi: deskripsi || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Halaqah ditambahkan");
      setNama("");
      setDeskripsi("");
      qc.invalidateQueries({ queryKey: ["halaqah-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const santri = santriQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Halaqah</h1>
        <p className="text-muted-foreground">Kelompok tahfizh dan sebaran santri per halaqah</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Tambah halaqah</CardTitle>
            <CardDescription>Buat kelompok halaqah baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                createHalaqah.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nama">Nama halaqah</Label>
                <Input id="nama" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Halaqah Al-Fatih" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea id="deskripsi" rows={1} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
              </div>
              <Button type="submit" disabled={createHalaqah.isPending}>
                <Plus className="mr-1 size-4" /> Tambah
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {halaqahQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat halaqah…</p>
      ) : (halaqahQ.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada halaqah{isAdmin ? ". Tambahkan lewat form di atas." : "."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(halaqahQ.data ?? []).map((h) => {
            const anggota = santri.filter((s) => s.halaqah_id === h.id);
            return (
              <Card key={h.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 font-display text-lg">
                        <BookOpen className="size-4 text-primary" /> {h.nama}
                      </CardTitle>
                      <CardDescription>{h.deskripsi || "Tanpa deskripsi"}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <Users className="mr-1 size-3" /> {anggota.length} santri
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {anggota.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada santri di halaqah ini.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {anggota.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2">
                          <span>{s.nama_lengkap}</span>
                          <span className="text-xs text-muted-foreground">{s.nis}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}