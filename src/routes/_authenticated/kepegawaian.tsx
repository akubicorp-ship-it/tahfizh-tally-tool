import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { BadgeCheck, CalendarCheck, Plus, Users, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/kepegawaian")({
  head: () => ({
    meta: [
      { title: "SDM & Kepegawaian · MSQ" },
      { name: "description", content: "Kelola data pegawai, absensi harian, dan penggajian Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "SDM & Kepegawaian · MSQ" },
      { property: "og:description", content: "Kelola data pegawai, absensi harian, dan penggajian Ma'had Sabilul Qur'an." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KepegawaianPage,
});

const JABATAN = ["pengasuh", "ustadz", "admin_tu", "keamanan", "dapur", "kebersihan", "lainnya"] as const;
const STATUS_PEGAWAI = ["aktif", "cuti", "nonaktif"] as const;
const STATUS_HADIR = ["hadir", "izin", "sakit", "alpa", "libur"] as const;

type Jabatan = (typeof JABATAN)[number];
type StatusPegawai = (typeof STATUS_PEGAWAI)[number];
type StatusHadir = (typeof STATUS_HADIR)[number];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const labelJabatan = (j: string) => (j === "admin_tu" ? "Admin / TU" : j.charAt(0).toUpperCase() + j.slice(1));

function KepegawaianPage() {
  const { data: me } = useCurrentUser();
  const role = me ? primaryRole(me.roles) : "santri";
  const isAdmin = role === "admin";
  const qc = useQueryClient();

  const pegawaiQ = useQuery({
    queryKey: ["pegawai-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pegawai")
        .select("id, nip, nama_lengkap, jabatan, status, no_hp, alamat, tanggal_masuk, gaji_pokok")
        .order("nama_lengkap");
      if (error) throw error;
      return data ?? [];
    },
  });

  const kehadiranQ = useQuery({
    queryKey: ["kehadiran-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kehadiran_pegawai")
        .select("id, tanggal, status, jam_masuk, jam_pulang, catatan, pegawai:pegawai_id(nama_lengkap)")
        .order("tanggal", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const gajiQ = useQuery({
    queryKey: ["penggajian-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penggajian")
        .select("id, periode, gaji_pokok, tunjangan, potongan, total, status, tanggal_bayar, pegawai:pegawai_id(nama_lengkap)")
        .order("periode", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pegawai = pegawaiQ.data ?? [];
  const aktif = pegawai.filter((p) => p.status === "aktif").length;
  const totalGajiPokok = pegawai.filter((p) => p.status === "aktif").reduce((s, p) => s + Number(p.gaji_pokok ?? 0), 0);
  const hadirHariIni = (kehadiranQ.data ?? []).filter(
    (k) => k.tanggal === new Date().toISOString().slice(0, 10) && k.status === "hadir",
  ).length;

  // ---- forms ----
  const [pf, setPf] = useState({
    nip: "",
    nama_lengkap: "",
    jabatan: "ustadz" as Jabatan,
    status: "aktif" as StatusPegawai,
    no_hp: "",
    alamat: "",
    tanggal_masuk: new Date().toISOString().slice(0, 10),
    gaji_pokok: "",
  });

  const addPegawai = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pegawai").insert({
        nip: pf.nip.trim(),
        nama_lengkap: pf.nama_lengkap.trim(),
        jabatan: pf.jabatan,
        status: pf.status,
        no_hp: pf.no_hp || null,
        alamat: pf.alamat || null,
        tanggal_masuk: pf.tanggal_masuk,
        gaji_pokok: Number(pf.gaji_pokok || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pegawai ditambahkan");
      setPf({ ...pf, nip: "", nama_lengkap: "", no_hp: "", alamat: "", gaji_pokok: "" });
      qc.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [af, setAf] = useState({
    pegawai_id: "",
    tanggal: new Date().toISOString().slice(0, 10),
    status: "hadir" as StatusHadir,
    jam_masuk: "",
    jam_pulang: "",
    catatan: "",
  });

  const addKehadiran = useMutation({
    mutationFn: async () => {
      if (!af.pegawai_id) throw new Error("Pilih pegawai terlebih dahulu");
      const { error } = await supabase.from("kehadiran_pegawai").upsert(
        {
          pegawai_id: af.pegawai_id,
          tanggal: af.tanggal,
          status: af.status,
          jam_masuk: af.jam_masuk || null,
          jam_pulang: af.jam_pulang || null,
          catatan: af.catatan || null,
        },
        { onConflict: "pegawai_id,tanggal" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Absensi tercatat");
      setAf({ ...af, jam_masuk: "", jam_pulang: "", catatan: "" });
      qc.invalidateQueries({ queryKey: ["kehadiran-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [gf, setGf] = useState({
    pegawai_id: "",
    periode: new Date().toISOString().slice(0, 7),
    gaji_pokok: "",
    tunjangan: "",
    potongan: "",
    catatan: "",
  });

  const addGaji = useMutation({
    mutationFn: async () => {
      if (!gf.pegawai_id) throw new Error("Pilih pegawai terlebih dahulu");
      const { error } = await supabase.from("penggajian").insert({
        pegawai_id: gf.pegawai_id,
        periode: gf.periode,
        gaji_pokok: Number(gf.gaji_pokok || 0),
        tunjangan: Number(gf.tunjangan || 0),
        potongan: Number(gf.potongan || 0),
        catatan: gf.catatan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slip gaji dibuat");
      setGf({ ...gf, gaji_pokok: "", tunjangan: "", potongan: "", catatan: "" });
      qc.invalidateQueries({ queryKey: ["penggajian-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tandaiDibayar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("penggajian")
        .update({ status: "dibayar", tanggal_bayar: new Date().toISOString().slice(0, 10) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gaji ditandai sudah dibayar");
      qc.invalidateQueries({ queryKey: ["penggajian-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">SDM & Kepegawaian</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Data pegawai, absensi harian, dan penggajian" : "Data kepegawaian Anda"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Pegawai aktif" value={String(aktif)} sub={`${pegawai.length} total pegawai`} />
        <Stat icon={CalendarCheck} label="Hadir hari ini" value={String(hadirHariIni)} sub="Berdasarkan absensi tercatat" />
        <Stat icon={Wallet} label="Gaji pokok / bulan" value={rupiah(totalGajiPokok)} sub="Total pegawai aktif" />
      </div>

      <Tabs defaultValue="pegawai">
        <TabsList>
          <TabsTrigger value="pegawai">Pegawai</TabsTrigger>
          <TabsTrigger value="absensi">Absensi</TabsTrigger>
          <TabsTrigger value="gaji">Penggajian</TabsTrigger>
        </TabsList>

        {/* PEGAWAI */}
        <TabsContent value="pegawai" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Tambah pegawai</CardTitle>
                <CardDescription>Data induk pegawai ma'had</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addPegawai.mutate();
                  }}
                >
                  <Field label="NIP">
                    <Input value={pf.nip} onChange={(e) => setPf({ ...pf, nip: e.target.value })} required />
                  </Field>
                  <Field label="Nama lengkap">
                    <Input
                      value={pf.nama_lengkap}
                      onChange={(e) => setPf({ ...pf, nama_lengkap: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Jabatan">
                    <Select value={pf.jabatan} onValueChange={(v) => setPf({ ...pf, jabatan: v as Jabatan })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {JABATAN.map((j) => (
                          <SelectItem key={j} value={j}>{labelJabatan(j)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select value={pf.status} onValueChange={(v) => setPf({ ...pf, status: v as StatusPegawai })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_PEGAWAI.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="No HP">
                    <Input value={pf.no_hp} onChange={(e) => setPf({ ...pf, no_hp: e.target.value })} />
                  </Field>
                  <Field label="Tanggal masuk">
                    <Input
                      type="date"
                      value={pf.tanggal_masuk}
                      onChange={(e) => setPf({ ...pf, tanggal_masuk: e.target.value })}
                    />
                  </Field>
                  <Field label="Gaji pokok (Rp)">
                    <Input
                      type="number"
                      min={0}
                      value={pf.gaji_pokok}
                      onChange={(e) => setPf({ ...pf, gaji_pokok: e.target.value })}
                    />
                  </Field>
                  <Field label="Alamat">
                    <Textarea rows={1} value={pf.alamat} onChange={(e) => setPf({ ...pf, alamat: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={addPegawai.isPending}>
                      <Plus className="mr-1 size-4" /> Simpan pegawai
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Daftar pegawai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Masuk</TableHead>
                      <TableHead className="text-right">Gaji pokok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pegawaiQ.isLoading && (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Memuat...</TableCell></TableRow>
                    )}
                    {!pegawaiQ.isLoading && pegawai.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada data pegawai.</TableCell></TableRow>
                    )}
                    {pegawai.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.nip}</TableCell>
                        <TableCell className="font-medium">{p.nama_lengkap}</TableCell>
                        <TableCell>{labelJabatan(p.jabatan)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "aktif" ? "secondary" : "outline"} className="capitalize">{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(p.tanggal_masuk), "d MMM yyyy", { locale: idLocale })}
                        </TableCell>
                        <TableCell className="text-right">{rupiah(Number(p.gaji_pokok ?? 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABSENSI */}
        <TabsContent value="absensi" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Catat absensi</CardTitle>
                <CardDescription>Satu catatan per pegawai per tanggal</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addKehadiran.mutate();
                  }}
                >
                  <Field label="Pegawai">
                    <Select value={af.pegawai_id} onValueChange={(v) => setAf({ ...af, pegawai_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih pegawai" /></SelectTrigger>
                      <SelectContent>
                        {pegawai.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nama_lengkap}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tanggal">
                    <Input type="date" value={af.tanggal} onChange={(e) => setAf({ ...af, tanggal: e.target.value })} />
                  </Field>
                  <Field label="Status">
                    <Select value={af.status} onValueChange={(v) => setAf({ ...af, status: v as StatusHadir })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_HADIR.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Jam masuk">
                    <Input type="time" value={af.jam_masuk} onChange={(e) => setAf({ ...af, jam_masuk: e.target.value })} />
                  </Field>
                  <Field label="Jam pulang">
                    <Input type="time" value={af.jam_pulang} onChange={(e) => setAf({ ...af, jam_pulang: e.target.value })} />
                  </Field>
                  <Field label="Catatan">
                    <Input value={af.catatan} onChange={(e) => setAf({ ...af, catatan: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={addKehadiran.isPending}>
                      <BadgeCheck className="mr-1 size-4" /> Simpan absensi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Riwayat absensi</CardTitle>
              <CardDescription>50 catatan terbaru</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(kehadiranQ.data ?? []).length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Belum ada absensi tercatat.</p>
              )}
              {(kehadiranQ.data ?? []).map((k) => (
                <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{(k.pegawai as { nama_lengkap: string } | null)?.nama_lengkap ?? "—"}</span>
                    <span className="text-muted-foreground">{format(new Date(k.tanggal), "d MMM yyyy", { locale: idLocale })}</span>
                    {k.jam_masuk && <span className="text-muted-foreground">{k.jam_masuk}–{k.jam_pulang ?? "…"}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={k.status === "hadir" ? "secondary" : k.status === "alpa" ? "destructive" : "outline"}
                      className="capitalize"
                    >
                      {k.status}
                    </Badge>
                    {k.catatan && <span className="text-xs italic text-muted-foreground">"{k.catatan}"</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PENGGAJIAN */}
        <TabsContent value="gaji" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Buat slip gaji</CardTitle>
                <CardDescription>Total dihitung otomatis: gaji pokok + tunjangan − potongan</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addGaji.mutate();
                  }}
                >
                  <Field label="Pegawai">
                    <Select
                      value={gf.pegawai_id}
                      onValueChange={(v) => {
                        const p = pegawai.find((x) => x.id === v);
                        setGf({ ...gf, pegawai_id: v, gaji_pokok: p ? String(p.gaji_pokok ?? 0) : gf.gaji_pokok });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih pegawai" /></SelectTrigger>
                      <SelectContent>
                        {pegawai.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nama_lengkap}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Periode (YYYY-MM)">
                    <Input type="month" value={gf.periode} onChange={(e) => setGf({ ...gf, periode: e.target.value })} />
                  </Field>
                  <Field label="Gaji pokok (Rp)">
                    <Input type="number" min={0} value={gf.gaji_pokok} onChange={(e) => setGf({ ...gf, gaji_pokok: e.target.value })} />
                  </Field>
                  <Field label="Tunjangan (Rp)">
                    <Input type="number" min={0} value={gf.tunjangan} onChange={(e) => setGf({ ...gf, tunjangan: e.target.value })} />
                  </Field>
                  <Field label="Potongan (Rp)">
                    <Input type="number" min={0} value={gf.potongan} onChange={(e) => setGf({ ...gf, potongan: e.target.value })} />
                  </Field>
                  <Field label="Catatan">
                    <Input value={gf.catatan} onChange={(e) => setGf({ ...gf, catatan: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={addGaji.isPending}>
                      <Wallet className="mr-1 size-4" /> Buat slip gaji
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Daftar penggajian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(gajiQ.data ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada data penggajian.</TableCell></TableRow>
                    )}
                    {(gajiQ.data ?? []).map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          {(g.pegawai as { nama_lengkap: string } | null)?.nama_lengkap ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{g.periode}</TableCell>
                        <TableCell className="text-right">{rupiah(Number(g.total ?? 0))}</TableCell>
                        <TableCell>
                          <Badge variant={g.status === "dibayar" ? "secondary" : "outline"} className="capitalize">{g.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {isAdmin && g.status !== "dibayar" && (
                            <Button size="sm" variant="ghost" onClick={() => tandaiDibayar.mutate(g.id)}>
                              Tandai dibayar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
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
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/40 text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate font-display text-xl font-semibold">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}