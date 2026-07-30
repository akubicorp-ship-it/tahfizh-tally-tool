CREATE TYPE public.program_jenis AS ENUM ('donasi','wakaf','zakat','infaq');
CREATE TYPE public.program_status AS ENUM ('aktif','selesai','ditutup');
CREATE TYPE public.donasi_status AS ENUM ('menunggu','terverifikasi','ditolak');
CREATE TYPE public.usaha_status AS ENUM ('aktif','nonaktif');
CREATE TYPE public.transaksi_jenis AS ENUM ('pemasukan','pengeluaran');

CREATE TABLE public.program_donasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  jenis public.program_jenis NOT NULL DEFAULT 'donasi',
  target numeric NOT NULL DEFAULT 0,
  tanggal_mulai date NOT NULL DEFAULT CURRENT_DATE,
  tanggal_selesai date,
  status public.program_status NOT NULL DEFAULT 'aktif',
  deskripsi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_donasi TO authenticated;
GRANT ALL ON public.program_donasi TO service_role;
ALTER TABLE public.program_donasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program admin manage" ON public.program_donasi FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "program select authenticated" ON public.program_donasi FOR SELECT TO authenticated USING (true);

CREATE TABLE public.donatur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  no_hp text,
  email text,
  alamat text,
  anonim boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donatur TO authenticated;
GRANT ALL ON public.donatur TO service_role;
ALTER TABLE public.donatur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donatur admin manage" ON public.donatur FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.donasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.program_donasi(id) ON DELETE SET NULL,
  donatur_id uuid REFERENCES public.donatur(id) ON DELETE SET NULL,
  nama_donatur text,
  jumlah numeric NOT NULL DEFAULT 0,
  metode text NOT NULL DEFAULT 'tunai',
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  no_referensi text,
  status public.donasi_status NOT NULL DEFAULT 'terverifikasi',
  catatan text,
  dicatat_oleh uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donasi TO authenticated;
GRANT ALL ON public.donasi TO service_role;
ALTER TABLE public.donasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donasi admin manage" ON public.donasi FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "donasi select authenticated" ON public.donasi FOR SELECT TO authenticated USING (true);

CREATE TABLE public.unit_usaha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  jenis text,
  penanggung_jawab uuid REFERENCES public.pegawai(id) ON DELETE SET NULL,
  status public.usaha_status NOT NULL DEFAULT 'aktif',
  deskripsi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_usaha TO authenticated;
GRANT ALL ON public.unit_usaha TO service_role;
ALTER TABLE public.unit_usaha ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unit usaha admin manage" ON public.unit_usaha FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "unit usaha select authenticated" ON public.unit_usaha FOR SELECT TO authenticated USING (true);

CREATE TABLE public.transaksi_usaha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.unit_usaha(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jenis public.transaksi_jenis NOT NULL DEFAULT 'pemasukan',
  kategori text,
  jumlah numeric NOT NULL DEFAULT 0,
  keterangan text,
  dicatat_oleh uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi_usaha TO authenticated;
GRANT ALL ON public.transaksi_usaha TO service_role;
ALTER TABLE public.transaksi_usaha ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaksi usaha admin manage" ON public.transaksi_usaha FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_program_donasi_updated_at BEFORE UPDATE ON public.program_donasi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_donatur_updated_at BEFORE UPDATE ON public.donatur FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_donasi_updated_at BEFORE UPDATE ON public.donasi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_unit_usaha_updated_at BEFORE UPDATE ON public.unit_usaha FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transaksi_usaha_updated_at BEFORE UPDATE ON public.transaksi_usaha FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.program_donasi (nama, jenis, target, deskripsi) VALUES
  ('Pembangunan Asrama Tahfizh', 'wakaf', 500000000, 'Wakaf pembangunan asrama santri tahap 1'),
  ('Beasiswa Santri Yatim', 'donasi', 150000000, 'Beasiswa penuh untuk santri yatim dan dhuafa'),
  ('Infaq Operasional Harian', 'infaq', 60000000, 'Dukungan operasional dapur dan kebutuhan harian ma''had');

INSERT INTO public.unit_usaha (nama, jenis, deskripsi) VALUES
  ('Koperasi Santri', 'retail', 'Penjualan kebutuhan harian santri'),
  ('Air Minum MSQ', 'produksi', 'Unit produksi air minum kemasan');