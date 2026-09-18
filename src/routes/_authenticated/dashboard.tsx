import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ClipboardCheck, Users, ArrowRight, Wallet, HeartHandshake, Briefcase, AlertTriangle } from "lucide-react";
import { lazy, Suspense } from "react";
import type { TrendPoint } from "@/components/dashboard-charts";

const DashboardCharts = lazy(() => import("@/components/dashboard-charts"));
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, primaryRole, roleLabel } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Eksekutif · MSQ" },
      { name: "description", content: "Ringkasan santri, hafalan, keuangan, donasi, dan kepegawaian Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "Dashboard Eksekutif · MSQ" },
      { property: "og:description", content: "Ringkasan operasional pesantren tahfizh dalam satu halaman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function Dashboard() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";

  const stats = useQuery({
    queryKey: ["dashboard-stats", role, me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [santri, halaqah, setoranCount, setoranRecent, tagihan, pembayaran, donasi, pegawai] = await Promise.all([
        supabase.from("santri").select("id, status"),
        supabase.from("halaqah").select("id", { count: "exact", head: true }),
        supabase.from("setoran_hafalan").select("id", { count: "exact", head: true }),
        supabase.from("setoran_hafalan").select("tanggal").gte("tanggal", new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10)),
        supabase.from("tagihan").select("nominal, status"),
        supabase.from("pembayaran").select("jumlah, tanggal"),
        supabase.from("donasi").select("jumlah"),
        supabase.from("pegawai").select("id, status"),
      ]);
      const santriRows = santri.data ?? [];
      const tagihanRows = tagihan.data ?? [];
      const tunggakan = tagihanRows
        .filter((t) => t.status !== "lunas" && t.status !== "dibatalkan")
        .reduce((a, t) => a + Number(t.nominal), 0);

      const bulan = new Map<string, { setoran: number; kas: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        bulan.set(`${d.getFullYear()}-${d.getMonth()}`, { setoran: 0, kas: 0 });
      }
      for (const s of setoranRecent.data ?? []) {
        const d = new Date(s.tanggal);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        const e = bulan.get(k);
        if (e) e.setoran += 1;
      }
      for (const p of pembayaran.data ?? []) {
        const d = new Date(p.tanggal);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        const e = bulan.get(k);
        if (e) e.kas += Number(p.jumlah);
      }
      const trend = [...bulan.entries()].map(([k, v]) => {
        const [, m] = k.split("-");
        return { bulan: MONTHS[Number(m)], setoran: v.setoran, kas: v.kas };
      });

      return {
        totalSantri: santriRows.length,
        activeSantri: santriRows.filter((s) => s.status === "aktif").length,
        totalHalaqah: halaqah.count ?? 0,
        totalSetoran: setoranCount.count ?? 0,
        totalTagihan: tagihanRows.reduce((a, t) => a + Number(t.nominal), 0),
        tunggakan,
        kasMasuk: (pembayaran.data ?? []).reduce((a, p) => a + Number(p.jumlah), 0),
        donasi: (donasi.data ?? []).reduce((a, d) => a + Number(d.jumlah), 0),
        pegawaiAktif: (pegawai.data ?? []).filter((p) => p.status === "aktif").length,
        trend,
      };
    },
  });

  const s = stats.data;
  const isExec = role === "admin" || role === "ustadz";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">{roleLabel(role)}</Badge>
          {me?.roles.length === 0 && (
            <Badge variant="outline" className="rounded-full">Belum ada peran — hubungi admin</Badge>
          )}
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Assalamu'alaikum, {me?.fullName}
        </h1>
        <p className="text-muted-foreground">Ringkasan hari ini di Ma'had Sabilul Qur'an.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Santri aktif" value={s?.activeSantri ?? "—"} sub={`dari ${s?.totalSantri ?? 0} total`} />
        <StatCard icon={BookOpen} label="Halaqah" value={s?.totalHalaqah ?? "—"} sub="kelompok belajar" />
        <StatCard icon={ClipboardCheck} label="Total setoran" value={s?.totalSetoran ?? "—"} sub="sepanjang waktu" />
        <StatCard icon={Briefcase} label="Pegawai aktif" value={s?.pegawaiAktif ?? "—"} sub="ustadz & staf" />
      </div>

      {isExec && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Total tagihan" value={rupiah(s?.totalTagihan ?? 0)} sub="seluruh periode" />
            <StatCard icon={Wallet} label="Kas masuk SPP" value={rupiah(s?.kasMasuk ?? 0)} sub="pembayaran diterima" />
            <StatCard icon={AlertTriangle} label="Tunggakan" value={rupiah(s?.tunggakan ?? 0)} sub="belum lunas" />
            <StatCard icon={HeartHandshake} label="Donasi & wakaf" value={rupiah(s?.donasi ?? 0)} sub="terkumpul" />
          </div>

          <Suspense fallback={<div className="grid gap-4 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-xl border bg-muted/40" /><div className="h-64 animate-pulse rounded-xl border bg-muted/40" /></div>}>
            <DashboardCharts trend={(s?.trend ?? []) as TrendPoint[]} />
          </Suspense>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Aksi cepat</CardTitle>
            <CardDescription>Pintasan berdasarkan peran Anda</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isExec && (
              <>
                <Button asChild variant="secondary">
                  <Link to="/setoran">Catat setoran <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/laporan">Buka laporan</Link>
                </Button>
              </>
            )}
            {role === "admin" && (
              <>
                <Button asChild>
                  <Link to="/santri/new">Tambah santri</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/users">Kelola pengguna</Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline">
              <Link to="/santri">Lihat data santri</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Modul yang tersedia</CardTitle>
            <CardDescription>Semua modul inti sudah aktif</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <ModuleRow name="Auth & Peran" status="Aktif" />
            <ModuleRow name="Data Induk Santri" status="Aktif" />
            <ModuleRow name="Akademik & Tahfizh" status="Aktif" />
            <ModuleRow name="Keuangan & SPP" status="Aktif" />
            <ModuleRow name="SDM & Kepegawaian" status="Aktif" />
            <ModuleRow name="Donasi & Unit Usaha" status="Aktif" />
            <ModuleRow name="Laporan & Rekap" status="Aktif" />
          </CardContent>
        </Card>
      </div>
    </div>
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
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleRow({ name, status, muted }: { name: string; status: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className={muted ? "text-muted-foreground" : ""}>{name}</span>
      <Badge variant={muted ? "outline" : "secondary"}>{status}</Badge>
    </div>
  );
}