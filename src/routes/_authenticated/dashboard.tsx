import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ClipboardCheck, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, primaryRole, roleLabel } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · MSQ" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";

  const stats = useQuery({
    queryKey: ["dashboard-stats", role, me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [santri, halaqah, setoran] = await Promise.all([
        supabase.from("santri").select("id, status", { count: "exact", head: false }),
        supabase.from("halaqah").select("id", { count: "exact", head: true }),
        supabase.from("setoran_hafalan").select("id", { count: "exact", head: true }),
      ]);
      const activeSantri = (santri.data ?? []).filter((s) => s.status === "aktif").length;
      return {
        totalSantri: santri.data?.length ?? 0,
        activeSantri,
        totalHalaqah: halaqah.count ?? 0,
        totalSetoran: setoran.count ?? 0,
      };
    },
  });

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
        <StatCard icon={GraduationCap} label="Santri aktif" value={stats.data?.activeSantri ?? "—"} sub={`dari ${stats.data?.totalSantri ?? 0} total`} />
        <StatCard icon={BookOpen} label="Halaqah" value={stats.data?.totalHalaqah ?? "—"} sub="kelompok belajar" />
        <StatCard icon={ClipboardCheck} label="Total setoran" value={stats.data?.totalSetoran ?? "—"} sub="sepanjang waktu" />
        <StatCard icon={Users} label="Peran Anda" value={me?.roles.length ?? 0} sub="peran aktif" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Aksi cepat</CardTitle>
            <CardDescription>Pintasan berdasarkan peran Anda</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(role === "admin" || role === "ustadz") && (
              <Button asChild variant="secondary">
                <Link to="/setoran">Catat setoran <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
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
            <CardDescription>Fondasi MVP — modul lain menyusul</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <ModuleRow name="Auth & Peran" status="Aktif" />
            <ModuleRow name="Data Induk Santri" status="Aktif" />
            <ModuleRow name="Akademik & Tahfizh" status="Aktif" />
            <ModuleRow name="Keuangan & SPP" status="Menyusul" muted />
            <ModuleRow name="SDM & Kepegawaian" status="Menyusul" muted />
            <ModuleRow name="Donasi & Wakaf" status="Menyusul" muted />
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