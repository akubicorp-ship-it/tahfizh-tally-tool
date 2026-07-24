import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { BookOpen, Heart, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Ma'had Sabilul Qur'an · ERP Pesantren Tahfizh" },
      {
        name: "description",
        content:
          "Sistem informasi Ma'had Sabilul Qur'an untuk pengelolaan santri, hafalan, keuangan, dan kepegawaian dalam satu tempat.",
      },
      { property: "og:title", content: "Ma'had Sabilul Qur'an · ERP Pesantren" },
      { property: "og:description", content: "Platform terpadu untuk mengelola pesantren tahfizh modern." },
    ],
  }),
  component: Landing,
});

function Landing() {
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
              <div className="text-xs text-muted-foreground">Sistem Informasi Pesantren</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Masuk</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Buat akun</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 50% 0%, oklch(0.9 0.06 150 / 0.5), transparent), radial-gradient(40% 40% at 80% 40%, oklch(0.9 0.08 85 / 0.35), transparent)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-accent" />
            Fondasi MVP: Akademik & Tahfizh
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Satu tempat untuk mengelola{" "}
            <span className="text-primary">rumah Qur'an</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Data induk santri, setoran hafalan, keuangan SPP, dan donasi — terintegrasi
            dalam satu sistem yang mudah dipakai oleh ustadz, wali, dan santri.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Mulai sekarang</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ma'had Sabilul Qur'an. Barakallahu fiikum.
        </div>
      </footer>
    </main>
  );
}

const features = [
  { icon: Users, title: "Data Induk Santri", desc: "Satu database pusat untuk semua modul." },
  { icon: BookOpen, title: "Akademik & Tahfizh", desc: "Catat setoran, munaqasyah, dan progres per juz." },
  { icon: Sparkles, title: "Keuangan SPP", desc: "Tagihan otomatis, verifikasi pembayaran, laporan kas." },
  { icon: Heart, title: "Donasi & Wakaf", desc: "Transparansi donasi untuk kepercayaan umat." },
];