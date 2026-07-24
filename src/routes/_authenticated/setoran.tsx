import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/setoran")({
  head: () => ({ meta: [{ title: "Setoran Hafalan · MSQ" }] }),
  component: SetoranPage,
});

function SetoranPage() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";
  const canInput = role === "admin" || role === "ustadz";
  const queryClient = useQueryClient();

  const santriQ = useQuery({
    queryKey: ["santri-select"],
    queryFn: async () => (await supabase.from("santri").select("id, nama_lengkap, nis").eq("status", "aktif").order("nama_lengkap")).data ?? [],
    enabled: canInput,
  });

  const recentQ = useQuery({
    queryKey: ["setoran-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("setoran_hafalan")
        .select("id, tanggal, juz, surah, ayat_dari, ayat_sampai, kualitas, catatan, santri:santri_id(nama_lengkap, nis)")
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    santri_id: "",
    tanggal: new Date().toISOString().slice(0, 10),
    juz: "1",
    surah: "",
    ayat_dari: "",
    ayat_sampai: "",
    kualitas: "lancar" as "lancar" | "perlu_ulang" | "kurang",
    catatan: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not authenticated");
      const { error } = await supabase.from("setoran_hafalan").insert({
        santri_id: form.santri_id,
        ustadz_id: me.user.id,
        tanggal: form.tanggal,
        juz: Number(form.juz),
        surah: form.surah || null,
        ayat_dari: form.ayat_dari ? Number(form.ayat_dari) : null,
        ayat_sampai: form.ayat_sampai ? Number(form.ayat_sampai) : null,
        kualitas: form.kualitas,
        catatan: form.catatan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Setoran tersimpan");
      queryClient.invalidateQueries({ queryKey: ["setoran-recent"] });
      queryClient.invalidateQueries({ queryKey: ["setoran"] });
      setForm({ ...form, surah: "", ayat_dari: "", ayat_sampai: "", catatan: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Setoran Hafalan</h1>
        <p className="text-muted-foreground">
          {canInput ? "Catat setoran hari ini dan lihat riwayat terbaru." : "Riwayat setoran terkini."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {canInput && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">Input setoran</CardTitle>
              <CardDescription>Cepat, satu setoran per santri per hari.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.santri_id) return toast.error("Pilih santri terlebih dahulu");
                  create.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Santri</Label>
                  <Select value={form.santri_id} onValueChange={(v) => setForm({ ...form, santri_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih santri" /></SelectTrigger>
                    <SelectContent>
                      {(santriQ.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nama_lengkap} · {s.nis}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Juz</Label>
                    <Input type="number" min={1} max={30} value={form.juz} onChange={(e) => setForm({ ...form, juz: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Surah</Label>
                  <Input placeholder="Al-Baqarah" value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ayat dari</Label>
                    <Input type="number" value={form.ayat_dari} onChange={(e) => setForm({ ...form, ayat_dari: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sampai</Label>
                    <Input type="number" value={form.ayat_sampai} onChange={(e) => setForm({ ...form, ayat_sampai: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Kualitas</Label>
                  <Select value={form.kualitas} onValueChange={(v) => setForm({ ...form, kualitas: v as typeof form.kualitas })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lancar">Lancar</SelectItem>
                      <SelectItem value="perlu_ulang">Perlu ulang</SelectItem>
                      <SelectItem value="kurang">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea rows={2} value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Opsional" />
                </div>
                <Button type="submit" className="w-full" disabled={create.isPending}>
                  {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Simpan setoran
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={canInput ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle className="font-display">Setoran terbaru</CardTitle>
            <CardDescription>30 catatan paling baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentQ.data?.length === 0 && <p className="py-4 text-sm text-muted-foreground">Belum ada data.</p>}
            {(recentQ.data ?? []).map((s) => {
              const santri = s.santri as { nama_lengkap: string; nis: string } | null;
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{santri?.nama_lengkap ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(s.tanggal), "d MMM yyyy", { locale: idLocale })} · Juz {s.juz}
                        {s.surah && ` · ${s.surah}`}
                        {s.ayat_dari && s.ayat_sampai && ` (${s.ayat_dari}–${s.ayat_sampai})`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={s.kualitas === "lancar" ? "secondary" : s.kualitas === "perlu_ulang" ? "outline" : "destructive"} className="capitalize">
                    {s.kualitas.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}