import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Heart, Loader2, Store, Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/transparansi")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Transparansi Donasi · Ma'had Sabilul Qur'an" },
      { name: "description", content: "Laporan transparansi donasi, wakaf, dan unit usaha Ma'had Sabilul Qur'an — terbuka untuk umum." },
      { property: "og:title", content: "Transparansi Donasi · Ma'had Sabilul Qur'an" },
      { property: "og:description", content: "Total donasi terverifikasi, progres program, dan pemasukan unit usaha Ma'had Sabilul Qur'an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransparansiPage,
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

type ProgramRow = {
  id: string;
  nama: string;
  jenis: string;
  target: number;
  terkumpul: number;
  deskripsi: string | null;
};

type Summary = {
  total_donasi: number;
  jumlah_donasi: number;
  jumlah_donatur: number;
  total_target_aktif: number;
  total_pemasukan_usaha: number;
  program_aktif: ProgramRow[] | null;
};

const JENIS_LABEL: Record<string, string> = {
  donasi: "Donasi",
  wakaf: "Wakaf",
  zakat: "Zakat",
  infak: "Infak",
};

function TransparansiPage() {
  const summaryQ = useQuery({
    queryKey: ["transparansi-publik"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("transparansi_publik").single<Summary>();
      if (error) throw error;
      return data;
    },
  });

  const s = summaryQ.data;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold">Ma'had Sabilul Qur'an</div>
              <div className="text-xs text-muted-foreground">Transparansi Publik</div>
            </div>
          </Link>
          <Button asChild variant="ghost">
            <Link to="/">Beranda</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <Heart className="size-3.5 text-accent" />
            Laporan terbuka untuk umum
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Transparansi Donasi &amp; Wakaf</h1>
          <p className="mt-3 text-muted-foreground">
            Kami percaya amanah harus bisa diperiksa. Berikut rekap dana umat yang masuk dan program yang sedang berjalan
            di Ma'had Sabilul Qur'an.
          </p>
        </div>

        {summaryQ.isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {s && (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Heart} label="Donasi terkumpul" value={rupiah(Number(s.total_donasi))} sub={`${s.jumlah_donasi} transaksi terverifikasi`} />
              <StatCard icon={Users} label="Donatur" value={String(s.jumlah_donatur)} sub="partisipan tercatat" />
              <StatCard icon={Target} label="Target program aktif" value={rupiah(Number(s.total_target_aktif))} sub="seluruh program berjalan" />
              <StatCard icon={Store} label="Pemasukan unit usaha" value={rupiah(Number(s.total_pemasukan_usaha))} sub="kantin, percetakan, dll." />
            </div>

            <h2 className="mt-14 font-display text-2xl font-semibold">Program yang sedang berjalan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Progres penghimpunan per program donasi dan wakaf.</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(s.program_aktif ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada program aktif saat ini.</p>
              )}
              {(s.program_aktif ?? []).map((p) => {
                const pct = p.target > 0 ? Math.min((Number(p.terkumpul) / Number(p.target)) * 100, 100) : 0;
                return (
                  <Card key={p.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="font-display">{p.nama}</CardTitle>
                        <Badge variant="secondary">{JENIS_LABEL[p.jenis] ?? p.jenis}</Badge>
                      </div>
                      {p.deskripsi && <CardDescription className="line-clamp-2">{p.deskripsi}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Progress value={pct} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{rupiah(Number(p.terkumpul))}</span>
                        <span>target {rupiah(Number(p.target))}</span>
                      </div>
                      <div className="text-right text-xs font-medium text-primary">{Math.round(pct)}%</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="mt-12 text-center text-xs text-muted-foreground">
              Data diperbarui otomatis dari sistem keuangan ma'had. Ingin berdonasi? Hubungi kantor Ma'had Sabilul Qur'an.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate font-display text-lg font-semibold">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}
