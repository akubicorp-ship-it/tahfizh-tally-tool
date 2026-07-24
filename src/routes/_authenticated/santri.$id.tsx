import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/santri/$id")({
  head: () => ({ meta: [{ title: "Detail Santri · MSQ" }] }),
  component: SantriDetail,
});

function SantriDetail() {
  const { id } = useParams({ from: "/_authenticated/santri/$id" });

  const santriQ = useQuery({
    queryKey: ["santri", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("santri")
        .select("*, halaqah:halaqah_id(nama)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const setoranQ = useQuery({
    queryKey: ["setoran", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setoran_hafalan")
        .select("id, tanggal, juz, surah, halaman, ayat_dari, ayat_sampai, kualitas, catatan")
        .eq("santri_id", id)
        .order("tanggal", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const munaqasyahQ = useQuery({
    queryKey: ["munaqasyah", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("munaqasyah")
        .select("id, juz, tanggal, nilai, catatan")
        .eq("santri_id", id)
        .order("tanggal", { ascending: false });
      return data ?? [];
    },
  });

  const santri = santriQ.data;
  const juzCompleted = new Set((munaqasyahQ.data ?? []).filter((m) => (m.nilai ?? 0) >= 70).map((m) => m.juz));
  const juzWithSetoran = new Set((setoranQ.data ?? []).map((s) => s.juz));
  const juzProgress = juzCompleted.size;

  if (santriQ.isLoading) return <div className="p-8 text-muted-foreground">Memuat...</div>;
  if (!santri) return <div className="p-8 text-muted-foreground">Santri tidak ditemukan.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/santri"><ArrowLeft className="mr-1 size-4" /> Kembali</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">{santri.nama_lengkap}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{santri.nis}</span>
              <span>·</span>
              <Badge variant={santri.status === "aktif" ? "secondary" : "outline"} className="capitalize">{santri.status}</Badge>
              {(santri.halaqah as { nama: string } | null)?.nama && (
                <>
                  <span>·</span>
                  <span>{(santri.halaqah as { nama: string }).nama}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Progres hafalan</CardTitle>
            <CardDescription>
              {juzProgress} dari 30 juz selesai munaqasyah · {juzWithSetoran.size} juz sudah pernah disetorkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progres 30 Juz</span>
                <span>{Math.round((juzProgress / 30) * 100)}%</span>
              </div>
              <Progress value={(juzProgress / 30) * 100} />
            </div>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const done = juzCompleted.has(juz);
                const started = juzWithSetoran.has(juz);
                return (
                  <div
                    key={juz}
                    className={`grid aspect-square place-items-center rounded-md text-xs font-medium ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : started
                        ? "bg-accent/50 text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    title={done ? `Juz ${juz} — selesai` : started ? `Juz ${juz} — sedang berjalan` : `Juz ${juz}`}
                  >
                    {juz}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <Legend swatch="bg-primary" label="Selesai munaqasyah" />
              <Legend swatch="bg-accent/50" label="Sedang berjalan" />
              <Legend swatch="bg-muted" label="Belum" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Data pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Tanggal lahir" v={santri.tanggal_lahir ? format(new Date(santri.tanggal_lahir), "d MMM yyyy", { locale: idLocale }) : "—"} />
            <Row k="Angkatan" v={santri.angkatan ?? "—"} />
            <Row k="Alamat" v={santri.alamat ?? "—"} />
            <Row k="Nama wali" v={santri.nama_wali ?? "—"} />
            <Row k="No HP wali" v={santri.no_hp_wali ?? "—"} />
            <Row k="Hubungan wali" v={santri.hubungan_wali ?? "—"} />
            <Row k="Tanggal masuk" v={santri.tanggal_masuk ? format(new Date(santri.tanggal_masuk), "d MMM yyyy", { locale: idLocale }) : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Riwayat setoran terakhir</CardTitle>
          <CardDescription>50 setoran terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          {setoranQ.data?.length === 0 && <p className="py-4 text-sm text-muted-foreground">Belum ada setoran tercatat.</p>}
          <div className="space-y-2">
            {(setoranQ.data ?? []).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">Juz {s.juz}</Badge>
                  <span className="text-muted-foreground">{format(new Date(s.tanggal), "d MMM yyyy", { locale: idLocale })}</span>
                  {s.surah && <span>{s.surah}</span>}
                  {s.ayat_dari && s.ayat_sampai && <span className="text-muted-foreground">ayat {s.ayat_dari}–{s.ayat_sampai}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.kualitas === "lancar" ? "secondary" : s.kualitas === "perlu_ulang" ? "outline" : "destructive"} className="capitalize">
                    {s.kualitas.replace("_", " ")}
                  </Badge>
                  {s.catatan && <span className="text-xs italic text-muted-foreground">"{s.catatan}"</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-b border-dashed py-1 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5"><span className={`inline-block size-3 rounded ${swatch}`} /> {label}</span>
  );
}