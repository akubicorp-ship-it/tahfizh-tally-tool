import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, FileDown } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan & Rekap · MSQ" },
      { name: "description", content: "Rekap setoran hafalan per santri dan rekap keuangan per periode di Ma'had Sabilul Qur'an." },
      { property: "og:title", content: "Laporan & Rekap · MSQ" },
      { property: "og:description", content: "Rekap setoran hafalan dan keuangan pesantren per periode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: LaporanPage,
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LaporanPage() {
  const [dari, setDari] = useState(firstOfMonth());
  const [sampai, setSampai] = useState(today());

  const setoran = useQuery({
    queryKey: ["lap-setoran", dari, sampai],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setoran_hafalan")
        .select("id, tanggal, juz, surah, kualitas, santri:santri_id(nama_lengkap, nis, halaqah:halaqah_id(nama))")
        .gte("tanggal", dari)
        .lte("tanggal", sampai)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const keuangan = useQuery({
    queryKey: ["lap-keuangan", dari, sampai],
    queryFn: async () => {
      const [tagihan, pembayaran, donasi, transaksi] = await Promise.all([
        supabase.from("tagihan").select("id, judul, nominal, status, periode, jatuh_tempo, santri:santri_id(nama_lengkap, nis)").gte("created_at", dari).lte("created_at", sampai + "T23:59:59"),
        supabase.from("pembayaran").select("id, tanggal, jumlah, metode, tagihan:tagihan_id(judul, santri:santri_id(nama_lengkap))").gte("tanggal", dari).lte("tanggal", sampai),
        supabase.from("donasi").select("id, tanggal, jumlah, nama_donatur, metode").gte("tanggal", dari).lte("tanggal", sampai),
        supabase.from("transaksi_usaha").select("id, tanggal, jenis, jumlah, kategori, keterangan").gte("tanggal", dari).lte("tanggal", sampai),
      ]);
      return {
        tagihan: tagihan.data ?? [],
        pembayaran: pembayaran.data ?? [],
        donasi: donasi.data ?? [],
        transaksi: transaksi.data ?? [],
      };
    },
  });

  const rekapSantri = useMemo(() => {
    const map = new Map<string, { nama: string; nis: string; halaqah: string; jumlah: number; juzSet: Set<number> }>();
    for (const s of setoran.data ?? []) {
      const st = s.santri as { nama_lengkap: string; nis: string; halaqah: { nama: string } | null } | null;
      const key = st?.nis ?? "—";
      const cur = map.get(key) ?? { nama: st?.nama_lengkap ?? "—", nis: key, halaqah: st?.halaqah?.nama ?? "—", jumlah: 0, juzSet: new Set<number>() };
      cur.jumlah += 1;
      cur.juzSet.add(s.juz);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.jumlah - a.jumlah);
  }, [setoran.data]);

  const k = keuangan.data;
  const totalTagihan = (k?.tagihan ?? []).reduce((a, t) => a + Number(t.nominal), 0);
  const totalMasuk = (k?.pembayaran ?? []).reduce((a, p) => a + Number(p.jumlah), 0);
  const totalDonasi = (k?.donasi ?? []).reduce((a, d) => a + Number(d.jumlah), 0);
  const usahaMasuk = (k?.transaksi ?? []).filter((t) => t.jenis === "pemasukan").reduce((a, t) => a + Number(t.jumlah), 0);
  const usahaKeluar = (k?.transaksi ?? []).filter((t) => t.jenis === "pengeluaran").reduce((a, t) => a + Number(t.jumlah), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Laporan &amp; Rekap</h1>
          <p className="text-muted-foreground">Rekap setoran hafalan dan keuangan per periode.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 size-4" /> Cetak
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg">Periode laporan</CardTitle>
          <CardDescription>Pilih rentang tanggal</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="dari">Dari</Label>
            <Input id="dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sampai">Sampai</Label>
            <Input id="sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tahfizh">
        <TabsList className="print:hidden">
          <TabsTrigger value="tahfizh">Rekap Tahfizh</TabsTrigger>
          <TabsTrigger value="keuangan">Rekap Keuangan</TabsTrigger>
        </TabsList>

        <TabsContent value="tahfizh" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat label="Total setoran" value={(setoran.data ?? []).length} />
            <MiniStat label="Santri menyetor" value={rekapSantri.length} />
            <MiniStat label="Rata-rata setoran" value={rekapSantri.length ? Math.round(((setoran.data ?? []).length / rekapSantri.length) * 10) / 10 : 0} />
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-display text-lg">Rekap setoran per santri</CardTitle>
                <CardDescription>{dari} s/d {sampai}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() =>
                  downloadCsv(`rekap-tahfizh-${dari}-${sampai}.csv`, [
                    ["NIS", "Nama", "Halaqah", "Jumlah setoran", "Juz disetor"],
                    ...rekapSantri.map((r) => [r.nis, r.nama, r.halaqah, r.jumlah, [...r.juzSet].sort((a, b) => a - b).join(" ")]),
                  ])
                }
              >
                <FileDown className="mr-2 size-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Halaqah</TableHead>
                    <TableHead className="text-right">Setoran</TableHead>
                    <TableHead>Juz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rekapSantri.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Belum ada setoran pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                  {rekapSantri.map((r) => (
                    <TableRow key={r.nis}>
                      <TableCell className="font-mono text-xs">{r.nis}</TableCell>
                      <TableCell className="font-medium">{r.nama}</TableCell>
                      <TableCell>{r.halaqah}</TableCell>
                      <TableCell className="text-right">{r.jumlah}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[...r.juzSet].sort((a, b) => a - b).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keuangan" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Tagihan terbit" value={rupiah(totalTagihan)} />
            <MiniStat label="Pembayaran masuk" value={rupiah(totalMasuk)} />
            <MiniStat label="Donasi &amp; wakaf" value={rupiah(totalDonasi)} />
            <MiniStat label="Laba unit usaha" value={rupiah(usahaMasuk - usahaKeluar)} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-display text-lg">Arus kas masuk</CardTitle>
                <CardDescription>Pembayaran SPP, donasi, dan unit usaha</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() =>
                  downloadCsv(`rekap-keuangan-${dari}-${sampai}.csv`, [
                    ["Sumber", "Nominal"],
                    ["Pembayaran SPP", totalMasuk],
                    ["Donasi & wakaf", totalDonasi],
                    ["Pemasukan unit usaha", usahaMasuk],
                    ["Pengeluaran unit usaha", -usahaKeluar],
                    ["Total bersih", totalMasuk + totalDonasi + usahaMasuk - usahaKeluar],
                  ])
                }
              >
                <FileDown className="mr-2 size-4" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sumber</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Pembayaran SPP ({(k?.pembayaran ?? []).length} transaksi)</TableCell>
                    <TableCell className="text-right">{rupiah(totalMasuk)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Donasi &amp; wakaf ({(k?.donasi ?? []).length} transaksi)</TableCell>
                    <TableCell className="text-right">{rupiah(totalDonasi)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pemasukan unit usaha</TableCell>
                    <TableCell className="text-right">{rupiah(usahaMasuk)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pengeluaran unit usaha</TableCell>
                    <TableCell className="text-right text-destructive">-{rupiah(usahaKeluar)}</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Total bersih</TableCell>
                    <TableCell className="text-right">{rupiah(totalMasuk + totalDonasi + usahaMasuk - usahaKeluar)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Tagihan pada periode</CardTitle>
              <CardDescription>{(k?.tagihan ?? []).length} tagihan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(k?.tagihan ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada tagihan pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                  {(k?.tagihan ?? []).map((t) => {
                    const st = t.santri as { nama_lengkap: string; nis: string } | null;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{st?.nama_lengkap ?? "—"}</TableCell>
                        <TableCell>{t.judul}</TableCell>
                        <TableCell>{t.periode ?? "—"}</TableCell>
                        <TableCell className="text-right">{rupiah(Number(t.nominal))}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "lunas" ? "secondary" : "outline"}>{t.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-display text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
