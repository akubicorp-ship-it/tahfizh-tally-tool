import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Wallet, Receipt, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/keuangan")({
  head: () => ({
    meta: [
      { title: "Keuangan & SPP · MSQ" },
      { name: "description", content: "Kelola tagihan SPP santri, catat pembayaran, dan pantau tunggakan Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "Keuangan & SPP · MSQ" },
      { property: "og:description", content: "Tagihan SPP, pencatatan pembayaran, dan rekap tunggakan santri MSQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KeuanganPage,
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_LABEL: Record<string, string> = {
  belum_bayar: "Belum bayar",
  sebagian: "Sebagian",
  lunas: "Lunas",
  dibatalkan: "Dibatalkan",
};

function KeuanganPage() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [payFor, setPayFor] = useState<{ id: string; judul: string; sisa: number } | null>(null);

  const jenisQ = useQuery({
    queryKey: ["jenis-biaya"],
    queryFn: async () => (await supabase.from("jenis_biaya").select("*").order("nama")).data ?? [],
  });

  const santriQ = useQuery({
    queryKey: ["santri-select"],
    queryFn: async () =>
      (await supabase.from("santri").select("id, nama_lengkap, nis").eq("status", "aktif").order("nama_lengkap")).data ?? [],
    enabled: isAdmin,
  });

  const tagihanQ = useQuery({
    queryKey: ["tagihan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tagihan")
        .select("id, judul, periode, nominal, jatuh_tempo, status, keterangan, santri:santri_id(nama_lengkap, nis), pembayaran(jumlah)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    return (tagihanQ.data ?? []).map((t) => {
      const dibayar = ((t.pembayaran as { jumlah: number }[] | null) ?? []).reduce((a, p) => a + Number(p.jumlah), 0);
      return { ...t, dibayar, sisa: Math.max(Number(t.nominal) - dibayar, 0) };
    });
  }, [tagihanQ.data]);

  const filtered = rows.filter((r) => statusFilter === "semua" || r.status === statusFilter);

  const totals = useMemo(() => {
    const aktif = rows.filter((r) => r.status !== "dibatalkan");
    return {
      tagih: aktif.reduce((a, r) => a + Number(r.nominal), 0),
      masuk: aktif.reduce((a, r) => a + r.dibayar, 0),
      tunggakan: aktif.reduce((a, r) => a + r.sisa, 0),
      lunas: aktif.filter((r) => r.status === "lunas").length,
    };
  }, [rows]);

  const [form, setForm] = useState({
    santri_id: "",
    jenis_biaya_id: "",
    judul: "",
    periode: new Date().toISOString().slice(0, 7),
    nominal: "",
    jatuh_tempo: "",
    keterangan: "",
  });

  const createTagihan = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tagihan").insert({
        santri_id: form.santri_id,
        jenis_biaya_id: form.jenis_biaya_id || null,
        judul: form.judul,
        periode: form.periode || null,
        nominal: Number(form.nominal || 0),
        jatuh_tempo: form.jatuh_tempo || null,
        keterangan: form.keterangan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tagihan dibuat");
      queryClient.invalidateQueries({ queryKey: ["tagihan"] });
      setForm({ ...form, judul: "", nominal: "", keterangan: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [bayar, setBayar] = useState({ tanggal: new Date().toISOString().slice(0, 10), jumlah: "", metode: "tunai", no_referensi: "", catatan: "" });

  const createPembayaran = useMutation({
    mutationFn: async () => {
      if (!payFor || !me) throw new Error("Tagihan tidak dipilih");
      const { error } = await supabase.from("pembayaran").insert({
        tagihan_id: payFor.id,
        tanggal: bayar.tanggal,
        jumlah: Number(bayar.jumlah || 0),
        metode: bayar.metode,
        no_referensi: bayar.no_referensi || null,
        catatan: bayar.catatan || null,
        dicatat_oleh: me.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pembayaran tercatat");
      queryClient.invalidateQueries({ queryKey: ["tagihan"] });
      setPayFor(null);
      setBayar({ tanggal: new Date().toISOString().slice(0, 10), jumlah: "", metode: "tunai", no_referensi: "", catatan: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Keuangan &amp; SPP</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Buat tagihan, catat pembayaran, dan pantau tunggakan." : "Rincian tagihan dan pembayaran Anda."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total tagihan", value: rupiah(totals.tagih), icon: Receipt },
          { label: "Sudah dibayar", value: rupiah(totals.masuk), icon: Wallet },
          { label: "Tunggakan", value: rupiah(totals.tunggakan), icon: AlertTriangle },
          { label: "Tagihan lunas", value: String(totals.lunas), icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <s.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="truncate font-display text-lg font-semibold">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {isAdmin && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">Buat tagihan</CardTitle>
              <CardDescription>Pilih jenis biaya untuk mengisi nominal otomatis.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.santri_id) return toast.error("Pilih santri terlebih dahulu");
                  if (!form.judul) return toast.error("Judul tagihan wajib diisi");
                  createTagihan.mutate();
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
                <div className="space-y-2">
                  <Label>Jenis biaya</Label>
                  <Select
                    value={form.jenis_biaya_id}
                    onValueChange={(v) => {
                      const j = (jenisQ.data ?? []).find((x) => x.id === v);
                      setForm({
                        ...form,
                        jenis_biaya_id: v,
                        judul: j?.nama ?? form.judul,
                        nominal: j ? String(j.nominal_default) : form.nominal,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih jenis biaya" /></SelectTrigger>
                    <SelectContent>
                      {(jenisQ.data ?? []).map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Judul tagihan</Label>
                  <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="SPP Bulanan" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Periode</Label>
                    <Input type="month" value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Jatuh tempo</Label>
                    <Input type="date" value={form.jatuh_tempo} onChange={(e) => setForm({ ...form, jatuh_tempo: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nominal (Rp)</Label>
                  <Input type="number" min={0} value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Textarea rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Opsional" />
                </div>
                <Button type="submit" className="w-full" disabled={createTagihan.isPending}>
                  {createTagihan.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Simpan tagihan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={isAdmin ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display">Daftar tagihan</CardTitle>
              <CardDescription>{filtered.length} tagihan ditampilkan</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua status</SelectItem>
                <SelectItem value="belum_bayar">Belum bayar</SelectItem>
                <SelectItem value="sebagian">Sebagian</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            {tagihanQ.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            {!tagihanQ.isLoading && filtered.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">Belum ada tagihan.</p>
            )}
            {filtered.map((t) => {
              const santri = t.santri as { nama_lengkap: string; nis: string } | null;
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{santri?.nama_lengkap ?? "—"} · {t.judul}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.periode ?? "—"} · {rupiah(Number(t.nominal))}
                      {t.sisa > 0 ? ` · sisa ${rupiah(t.sisa)}` : ""}
                      {t.jatuh_tempo && ` · tempo ${format(new Date(t.jatuh_tempo), "d MMM yyyy", { locale: idLocale })}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={t.status === "lunas" ? "secondary" : t.status === "belum_bayar" ? "destructive" : "outline"}
                    >
                      {STATUS_LABEL[t.status]}
                    </Badge>
                    {isAdmin && t.status !== "lunas" && t.status !== "dibatalkan" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPayFor({ id: t.id, judul: `${santri?.nama_lengkap ?? ""} · ${t.judul}`, sisa: t.sisa });
                          setBayar((b) => ({ ...b, jumlah: String(t.sisa) }));
                        }}
                      >
                        Catat bayar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Catat pembayaran</DialogTitle>
            <DialogDescription>{payFor?.judul} — sisa {rupiah(payFor?.sisa ?? 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={bayar.tanggal} onChange={(e) => setBayar({ ...bayar, tanggal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input type="number" min={0} value={bayar.jumlah} onChange={(e) => setBayar({ ...bayar, jumlah: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Metode</Label>
                <Select value={bayar.metode} onValueChange={(v) => setBayar({ ...bayar, metode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer bank</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. referensi</Label>
                <Input value={bayar.no_referensi} onChange={(e) => setBayar({ ...bayar, no_referensi: e.target.value })} placeholder="Opsional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea rows={2} value={bayar.catatan} onChange={(e) => setBayar({ ...bayar, catatan: e.target.value })} placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (!Number(bayar.jumlah)) return toast.error("Jumlah pembayaran wajib diisi");
                createPembayaran.mutate();
              }}
              disabled={createPembayaran.isPending}
            >
              {createPembayaran.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
