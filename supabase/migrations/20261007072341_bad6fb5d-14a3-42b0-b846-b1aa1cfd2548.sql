-- 1) Bukti transfer & verifikasi pembayaran
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS bukti_url text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pembayaran' AND column_name='status_verifikasi') THEN
    ALTER TABLE public.pembayaran ADD COLUMN status_verifikasi text NOT NULL DEFAULT 'terverifikasi' CHECK (status_verifikasi IN ('menunggu','terverifikasi','ditolak'));
  END IF;
END $$;

-- Hanya pembayaran terverifikasi yang mengubah status tagihan
CREATE OR REPLACE FUNCTION public.refresh_tagihan_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tagihan uuid; v_total numeric; v_nominal numeric; v_status public.tagihan_status;
BEGIN
  v_tagihan := COALESCE(NEW.tagihan_id, OLD.tagihan_id);
  SELECT COALESCE(SUM(jumlah),0) INTO v_total FROM public.pembayaran WHERE tagihan_id = v_tagihan AND status_verifikasi = 'terverifikasi';
  SELECT nominal, status INTO v_nominal, v_status FROM public.tagihan WHERE id = v_tagihan;
  IF v_status = 'dibatalkan' THEN RETURN NULL; END IF;
  UPDATE public.tagihan SET status = CASE
    WHEN v_total <= 0 THEN 'belum_bayar'::public.tagihan_status
    WHEN v_total >= v_nominal THEN 'lunas'::public.tagihan_status
    ELSE 'sebagian'::public.tagihan_status END
  WHERE id = v_tagihan;
  RETURN NULL;
END; $$;

-- Wali/santri boleh mengunggah bukti untuk tagihan anaknya sendiri (status menunggu)
CREATE POLICY "pembayaran keluarga upload bukti" ON public.pembayaran FOR INSERT TO authenticated
WITH CHECK (
  status_verifikasi = 'menunggu'
  AND EXISTS (
    SELECT 1 FROM public.tagihan t JOIN public.santri s ON s.id = t.santri_id
    WHERE t.id = tagihan_id AND (s.user_id = auth.uid() OR public.is_wali_of(auth.uid(), s.id))
  )
);

-- 2) Kebijakan akses file bukti transfer pada storage.objects
DROP POLICY IF EXISTS "bukti upload authenticated" ON storage.objects;
CREATE POLICY "bukti upload authenticated" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bukti-pembayaran');
DROP POLICY IF EXISTS "bukti read own or admin" ON storage.objects;
CREATE POLICY "bukti read own or admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bukti-pembayaran' AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

-- 3) Transparansi publik
CREATE OR REPLACE VIEW public.transparansi_publik AS
SELECT
  (SELECT COALESCE(SUM(jumlah),0) FROM public.donasi WHERE status = 'terverifikasi') AS total_donasi,
  (SELECT COUNT(*) FROM public.donasi WHERE status = 'terverifikasi') AS jumlah_donasi,
  (SELECT COUNT(DISTINCT donatur_id) FROM public.donasi WHERE status = 'terverifikasi' AND donatur_id IS NOT NULL) AS jumlah_donatur,
  (SELECT COALESCE(SUM(target),0) FROM public.program_donasi WHERE status = 'aktif') AS total_target_aktif,
  (SELECT COALESCE(SUM(jumlah),0) FROM public.transaksi_usaha WHERE jenis = 'pemasukan') AS total_pemasukan_usaha;
GRANT SELECT ON public.transparansi_publik TO anon, authenticated;
GRANT ALL ON public.transparansi_publik TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='program_donasi' AND policyname='program donasi publik aktif') THEN
    CREATE POLICY "program donasi publik aktif" ON public.program_donasi FOR SELECT TO anon USING (status = 'aktif');
  END IF;
END $$;
GRANT SELECT ON public.program_donasi TO anon;

-- 4) Rapor: catatan akhlak
ALTER TABLE public.santri ADD COLUMN IF NOT EXISTS catatan_akhlak text;
CREATE POLICY "santri ustadz update" ON public.santri FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'ustadz'))
WITH CHECK (public.has_role(auth.uid(),'ustadz'));

-- 5) Jadwal munaqasyah
CREATE TYPE public.jadwal_status AS ENUM ('terjadwal','selesai','dibatalkan');
CREATE TABLE public.jadwal_munaqasyah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  juz int NOT NULL CHECK (juz BETWEEN 1 AND 30),
  tanggal date NOT NULL,
  status public.jadwal_status NOT NULL DEFAULT 'terjadwal',
  catatan text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_jadwal_munaqasyah_santri ON public.jadwal_munaqasyah(santri_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jadwal_munaqasyah TO authenticated;
GRANT ALL ON public.jadwal_munaqasyah TO service_role;
ALTER TABLE public.jadwal_munaqasyah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jadwal admin manage" ON public.jadwal_munaqasyah FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "jadwal ustadz manage" ON public.jadwal_munaqasyah FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ustadz')) WITH CHECK (public.has_role(auth.uid(),'ustadz'));
CREATE POLICY "jadwal wali view" ON public.jadwal_munaqasyah FOR SELECT TO authenticated USING (public.is_wali_of(auth.uid(), santri_id));
CREATE POLICY "jadwal santri view" ON public.jadwal_munaqasyah FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.santri s WHERE s.id = jadwal_munaqasyah.santri_id AND s.user_id = auth.uid()));
CREATE TRIGGER trg_jadwal_munaqasyah_updated BEFORE UPDATE ON public.jadwal_munaqasyah FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();