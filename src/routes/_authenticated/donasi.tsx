import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { HandCoins, HeartHandshake, Loader2, Store, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/donasi")({
  head: () => ({
    meta: [
      { title: "Donasi, Wakaf & Unit Usaha · MSQ" },
      {
        name: "description",
        content:
          "Kelola program donasi dan wakaf, catat donasi masuk, serta pantau pemasukan unit usaha Ma'had Sabilul Qur'an.",
      },
      { property: "og:title", content: "Donasi, Wakaf & Unit Usaha · MSQ" },
      {
        property: "og:description",
        content: "Program wakaf, donasi masuk, dan laba rugi unit usaha pesantren MSQ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DonasiPage,
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const JENIS_PROGRAM = ["donasi", "wakaf", "zakat", "infaq"] as const;
const tanggalID = (d: string) => format(new Date(d), "d MMM yyyy", { locale: idLocale });

function DonasiPage() {
  const { data: me } = useCurrentUser();
  const isAdmin = me ? primaryRole(me.roles) === "admin" : false;
  const qc = useQueryClient();

  const programQ = useQuery({
    queryKey: ["program-donasi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_donasi")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const donasiQ = useQuery({
    queryKey: ["donasi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donasi")
        .select("id, tanggal, jumlah, metode, status, nama_donatur, catatan, program_id, program:program_id(nama)")
        .order("tanggal", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unitQ = useQuery({
    queryKey: ["unit-usaha"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unit_usaha").select("*").order("nama");
      if (error) throw error;
      return data ?? [];
    },
  });

  const trxQ = useQuery({
    queryKey: ["transaksi-usaha"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaksi_usaha")
        .select("id, tanggal, jenis, kategori, jumlah, keterangan, unit_id, unit:unit_id(nama)")
        .order("tanggal", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const terkumpulPerProgram = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of donasiQ.data ?? []) {
      if (!d.program_id || d.status !== "terverifikasi") continue;
      map.set(d.program_id, (map.get(d.program_id) ?? 0) + Number(d.jumlah));
    }
    return map;
  }, [donasiQ.data]);

  const totalDonasi = useMemo(
    () =>
      (donasiQ.data ?? [])
        .filter((d) => d.status === "terverifikasi")
        .reduce((a, d) => a + Number(d.jumlah), 0),
    [donasiQ.data],
  );

  const usahaTotals = useMemo(() => {
    const rows = trxQ.data ?? [];
    const masuk = rows.filter((r) => r.jenis === "pemasukan").reduce((a, r) => a + Number(r.jumlah), 0);
    const keluar = rows.filter((r) => r.jenis === "pengeluaran").reduce((a, r) => a + Number(r.jumlah), 0);
    return { masuk, keluar, laba: masuk - keluar };
  }, [trxQ.data]);

  const [pForm, setPForm] = useState({ nama: "", jenis: "donasi", target: "", tanggal_selesai: "", deskripsi: "" });
  const createProgram = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("program_donasi").insert({
        nama: pForm.nama,
        jenis: pForm.jenis as (typeof JENIS_PROGRAM)[number],
        target: Number(pForm.target || 0),
        tanggal_selesai: pForm.tanggal_selesai || null,
        deskripsi: pForm.deskripsi || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Program ditambahkan");
      setPForm({ nama: "", jenis: "donasi", target: "", tanggal_selesai: "", deskripsi: "" });
      qc.invalidateQueries({ queryKey: ["program-donasi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [dForm, setDForm] = useState({
    program_id: "",
    nama_donatur: "",
    jumlah: "",
    metode: "tunai",
    tanggal: new Date().toISOString().slice(0, 10),
    no_referensi: "",
    catatan: "",
  });
  const createDonasi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("donasi").insert({
        program_id: dForm.program_id || null,
        nama_donatur: dForm.nama_donatur || "Hamba Allah",
        jumlah: Number(dForm.jumlah || 0),
        metode: dForm.metode,
        tanggal: dForm.tanggal,
        no_referensi: dForm.no_referensi || null,
        catatan: dForm.catatan || null,
        dicatat_oleh: me?.user.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Donasi dicatat");
      setDForm((f) => ({ ...f, nama_donatur: "", jumlah: "", no_referensi: "", catatan: "" }));
      qc.invalidateQueries({ queryKey: ["donasi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [uForm, setUForm] = useState({ nama: "", jenis: "", deskripsi: "" });
  const createUnit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("unit_usaha").insert({
        nama: uForm.nama,
        jenis: uForm.jenis || null,
        deskripsi: uForm.deskripsi || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unit usaha ditambahkan");
      setUForm({ nama: "", jenis: "", deskripsi: "" });
      qc.invalidateQueries({ queryKey: ["unit-usaha"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [tForm, setTForm] = useState({
    unit_id: "",
    jenis: "pemasukan",
    kategori: "",
    jumlah: "",
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: "",
  });
  const createTrx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transaksi_usaha").insert({
        unit_id: tForm.unit_id,
        jenis: tForm.jenis as "pemasukan" | "pengeluaran",
        kategori: tForm.kategori || null,
        jumlah: Number(tForm.jumlah || 0),
        tanggal: tForm.tanggal,
        keterangan: tForm.keterangan || null,
        dicatat_oleh: me?.user.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transaksi dicatat");
      setTForm((f) => ({ ...f, kategori: "", jumlah: "", keterangan: "" }));
      qc.invalidateQueries({ queryKey: ["transaksi-usaha"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Donasi, Wakaf &amp; Unit Usaha</h1>
        <p className="text-muted-foreground">Program penggalangan dana dan pendapatan mandiri ma'had</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HeartHandshake} label="Total donasi terverifikasi" value={rupiah(totalDonasi)} />
        <StatCard
          icon={HandCoins}
          label="Program aktif"
          value={String((programQ.data ?? []).filter((p) => p.status === "aktif").length)}
        />
        <StatCard icon={TrendingUp} label="Pemasukan unit usaha" value={rupiah(usahaTotals.masuk)} />
        <StatCard icon={TrendingDown} label="Laba bersih unit usaha" value={rupiah(usahaTotals.laba)} />
      </div>
      <Tabs defaultValue="program">
        <TabsList>
          <TabsTrigger value="program">Program</TabsTrigger>
          <TabsTrigger value="donasi">Donasi masuk</TabsTrigger>
          <TabsTrigger value="usaha">Unit usaha</TabsTrigger>
        </TabsList>
        <TabsContent value="program" className="space-y-4 pt-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Program baru</CardTitle>
                <CardDescription>Buat program donasi, wakaf, zakat, atau infaq</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama program</Label>
                  <Input
                    value={pForm.nama}
                    onChange={(e) => setPForm({ ...pForm, nama: e.target.value })}
                    placeholder="Wakaf pembangunan masjid"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select value={pForm.jenis} onValueChange={(v) => setPForm({ ...pForm, jenis: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_PROGRAM.map((j) => (
                        <SelectItem key={j} value={j} className="capitalize">
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target dana (Rp)</Label>
                  <Input type="number" value={pForm.target} onChange={(e) => setPForm({ ...pForm, target: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal selesai</Label>
                  <Input
                    type="date"
                    value={pForm.tanggal_selesai}
                    onChange={(e) => setPForm({ ...pForm, tanggal_selesai: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Deskripsi</Label>
                  <Textarea value={pForm.deskripsi} onChange={(e) => setPForm({ ...pForm, deskripsi: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={!pForm.nama || createProgram.isPending} onClick={() => createProgram.mutate()}>
                    {createProgram.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Simpan program
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {(programQ.data ?? []).map((p) => {
              const terkumpul = terkumpulPerProgram.get(p.id) ?? 0;
              const target = Number(p.target) || 0;
              const pct = target > 0 ? Math.min((terkumpul / target) * 100, 100) : 0;
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base">{p.nama}</CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {p.jenis}
                      </Badge>
                    </div>
                    <CardDescription>{p.deskripsi ?? "—"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={pct} />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{rupiah(terkumpul)}</span>
                      <span className="text-muted-foreground">dari {rupiah(target)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mulai {tanggalID(p.tanggal_mulai)} · status {p.status}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {programQ.isLoading && <p className="text-sm text-muted-foreground">Memuat program…</p>}
          </div>
        </TabsContent>
        <TabsContent value="donasi" className="space-y-4 pt-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Catat donasi masuk</CardTitle>
                <CardDescription>Donasi tercatat langsung terverifikasi</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={dForm.program_id} onValueChange={(v) => setDForm({ ...dForm, program_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih program" />
                    </SelectTrigger>
                    <SelectContent>
                      {(programQ.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama donatur</Label>
                  <Input
                    value={dForm.nama_donatur}
                    onChange={(e) => setDForm({ ...dForm, nama_donatur: e.target.value })}
                    placeholder="Hamba Allah"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input type="number" value={dForm.jumlah} onChange={(e) => setDForm({ ...dForm, jumlah: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Metode</Label>
                  <Select value={dForm.metode} onValueChange={(v) => setDForm({ ...dForm, metode: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tunai">Tunai</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input type="date" value={dForm.tanggal} onChange={(e) => setDForm({ ...dForm, tanggal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>No. referensi</Label>
                  <Input value={dForm.no_referensi} onChange={(e) => setDForm({ ...dForm, no_referensi: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Catatan</Label>
                  <Textarea value={dForm.catatan} onChange={(e) => setDForm({ ...dForm, catatan: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={!dForm.jumlah || createDonasi.isPending} onClick={() => createDonasi.mutate()}>
                    {createDonasi.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Simpan donasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Riwayat donasi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Donatur</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(donasiQ.data ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{tanggalID(d.tanggal)}</TableCell>
                      <TableCell className="font-medium">{d.nama_donatur ?? "Hamba Allah"}</TableCell>
                      <TableCell>{(d.program as { nama: string } | null)?.nama ?? "—"}</TableCell>
                      <TableCell className="capitalize">{d.metode}</TableCell>
                      <TableCell className="text-right">{rupiah(Number(d.jumlah))}</TableCell>
                    </TableRow>
                  ))}
                  {(donasiQ.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Belum ada donasi tercatat
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usaha" className="space-y-4 pt-4">
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Unit usaha baru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama unit</Label>
                    <Input
                      value={uForm.nama}
                      onChange={(e) => setUForm({ ...uForm, nama: e.target.value })}
                      placeholder="Koperasi Santri"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis usaha</Label>
                    <Input
                      value={uForm.jenis}
                      onChange={(e) => setUForm({ ...uForm, jenis: e.target.value })}
                      placeholder="retail / produksi / jasa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea value={uForm.deskripsi} onChange={(e) => setUForm({ ...uForm, deskripsi: e.target.value })} />
                  </div>
                  <Button disabled={!uForm.nama || createUnit.isPending} onClick={() => createUnit.mutate()}>
                    {createUnit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Simpan unit
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Catat transaksi</CardTitle>
                  <CardDescription>Pemasukan atau pengeluaran unit usaha</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Unit usaha</Label>
                    <Select value={tForm.unit_id} onValueChange={(v) => setTForm({ ...tForm, unit_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {(unitQ.data ?? []).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <Select value={tForm.jenis} onValueChange={(v) => setTForm({ ...tForm, jenis: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pemasukan">Pemasukan</SelectItem>
                        <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Rp)</Label>
                    <Input type="number" value={tForm.jumlah} onChange={(e) => setTForm({ ...tForm, jumlah: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Input
                      value={tForm.kategori}
                      onChange={(e) => setTForm({ ...tForm, kategori: e.target.value })}
                      placeholder="penjualan / bahan baku"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input type="date" value={tForm.tanggal} onChange={(e) => setTForm({ ...tForm, tanggal: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Keterangan</Label>
                    <Textarea value={tForm.keterangan} onChange={(e) => setTForm({ ...tForm, keterangan: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      disabled={!tForm.unit_id || !tForm.jumlah || createTrx.isPending}
                      onClick={() => createTrx.mutate()}
                    >
                      {createTrx.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Simpan transaksi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Store className="size-4 text-primary" /> Daftar unit usaha
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(unitQ.data ?? []).map((u) => (
                <div key={u.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{u.nama}</span>
                    <Badge variant={u.status === "aktif" ? "default" : "secondary"}>{u.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{u.jenis ?? "—"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{u.deskripsi ?? ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Riwayat transaksi usaha</CardTitle>
                <CardDescription>
                  Pemasukan {rupiah(usahaTotals.masuk)} · Pengeluaran {rupiah(usahaTotals.keluar)} · Laba{" "}
                  {rupiah(usahaTotals.laba)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(trxQ.data ?? []).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{tanggalID(t.tanggal)}</TableCell>
                        <TableCell>{(t.unit as { nama: string } | null)?.nama ?? "—"}</TableCell>
                        <TableCell>{t.kategori ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={t.jenis === "pemasukan" ? "default" : "secondary"} className="capitalize">
                            {t.jenis}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{rupiah(Number(t.jumlah))}</TableCell>
                      </TableRow>
                    ))}
                    {(trxQ.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          Belum ada transaksi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-display text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}