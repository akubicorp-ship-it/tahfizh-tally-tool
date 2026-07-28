import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const DEMO_PASSWORD = "MsqDemo#2026";
const DEMO_ACCOUNTS = [
  { role: "Admin / TU", email: "admin@msq.demo", desc: "Akses penuh semua modul" },
  { role: "Ustadz", email: "ustadz@msq.demo", desc: "Setoran hafalan & halaqah" },
  { role: "Wali Santri", email: "wali@msq.demo", desc: "Progres anak & tagihan" },
  { role: "Santri", email: "santri@msq.demo", desc: "Progres & tagihan pribadi" },
];

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Masuk · MSQ" },
      { name: "description", content: "Masuk atau daftar ke sistem informasi Ma'had Sabilul Qur'an." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Selamat datang kembali");
    navigate({ to: "/dashboard" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signupName },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: signupName });
    }
    setLoading(false);
    if (data.session) {
      toast.success("Akun dibuat. Selamat datang!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Akun dibuat. Silakan cek email untuk konfirmasi.");
    }
  };

  const loginAs = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Masuk sebagai ${email}`);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Ma'had Sabilul Qur'an</h1>
          <p className="text-sm text-muted-foreground">Sistem Informasi Pesantren</p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display">Masuk ke akun Anda</CardTitle>
            <CardDescription>Gunakan email dan kata sandi yang terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" required value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Kata sandi</Label>
                    <Input id="login-password" type="password" required value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Masuk
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama lengkap</Label>
                    <Input id="signup-name" required value={signupName}
                      onChange={(e) => setSignupName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" required value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)} autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Kata sandi</Label>
                    <Input id="signup-password" type="password" required minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)} autoComplete="new-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Buat akun
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Akun baru default berperan sebagai <b>santri</b>. Admin dapat mengubah peran.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-6 w-full max-w-md border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Sparkles className="size-4 text-primary" /> Akun demo
            </CardTitle>
            <CardDescription>
              Klik salah satu untuk langsung masuk. Kata sandi semua akun: <b>{DEMO_PASSWORD}</b>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={loading}
                onClick={() => loginAs(a.email)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left transition hover:border-primary hover:bg-accent/40 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{a.role}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.email} · {a.desc}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-primary">Masuk →</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}