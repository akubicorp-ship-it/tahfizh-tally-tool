import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/santri/new")({
  head: () => ({ meta: [{ title: "Tambah Santri · MSQ" }] }),
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userRes.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw redirect({ to: "/santri" });
  },
  component: NewSantriPage,
});

function NewSantriPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: halaqahList } = useQuery({
    queryKey: ["halaqah-list"],
    queryFn: async () => (await supabase.from("halaqah").select("id, nama").order("nama")).data ?? [],
  });

  const [form, setForm] = useState({
    nis: "",
    nama_lengkap: "",
    tanggal_lahir: "",
    alamat: "",
    halaqah_id: "",
    angkatan: "",
    nama_wali: "",
    no_hp_wali: "",
    hubungan_wali: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        nis: form.nis,
        nama_lengkap: form.nama_lengkap,
        tanggal_lahir: form.tanggal_lahir || null,
        alamat: form.alamat || null,
        halaqah_id: form.halaqah_id || null,
        angkatan: form.angkatan || null,
        nama_wali: form.nama_wali || null,
        no_hp_wali: form.no_hp_wali || null,
        hubungan_wali: form.hubungan_wali || null,
      };
      const { data, error } = await supabase.from("santri").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["santri-list"] });
      toast.success(`Santri ${data.nama_lengkap} ditambahkan`);
      navigate({ to: "/santri/$id", params: { id: data.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="font-display text-3xl font-semibold">Tambah Santri</h1>
      <p className="text-muted-foreground">Isi data induk santri baru.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display">Data pribadi</CardTitle>
          <CardDescription>Wajib: NIS dan nama lengkap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Field label="NIS *"><Input required value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} /></Field>
            <Field label="Nama lengkap *"><Input required value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} /></Field>
            <Field label="Tanggal lahir"><Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} /></Field>
            <Field label="Angkatan"><Input placeholder="2024" value={form.angkatan} onChange={(e) => setForm({ ...form, angkatan: e.target.value })} /></Field>
            <Field label="Halaqah" className="sm:col-span-2">
              <Select value={form.halaqah_id} onValueChange={(v) => setForm({ ...form, halaqah_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih halaqah (opsional)" /></SelectTrigger>
                <SelectContent>
                  {(halaqahList ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alamat" className="sm:col-span-2">
              <Textarea rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            </Field>
            <Field label="Nama wali"><Input value={form.nama_wali} onChange={(e) => setForm({ ...form, nama_wali: e.target.value })} /></Field>
            <Field label="No HP wali"><Input value={form.no_hp_wali} onChange={(e) => setForm({ ...form, no_hp_wali: e.target.value })} /></Field>
            <Field label="Hubungan wali" className="sm:col-span-2"><Input placeholder="Ayah / Ibu / Paman..." value={form.hubungan_wali} onChange={(e) => setForm({ ...form, hubungan_wali: e.target.value })} /></Field>

            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: "/santri" })}>Batal</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}