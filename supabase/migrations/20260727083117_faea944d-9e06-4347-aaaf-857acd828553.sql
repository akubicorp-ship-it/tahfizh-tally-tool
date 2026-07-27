CREATE TYPE public.tagihan_status AS ENUM ('belum_bayar','sebagian','lunas','dibatalkan');

CREATE TABLE public.jenis_biaya (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  nominal_default numeric NOT NULL DEFAULT 0,
  berulang boolean NOT NULL DEFAULT true,
  deskripsi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jenis_biaya TO authenticated;
GRANT ALL ON public.jenis_biaya TO service_role;
ALTER TABLE public.jenis_biaya ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jenis_biaya select authenticated" ON public.jenis_biaya FOR SELECT TO authenticated USING (true);
CREATE POLICY "jenis_biaya admin manage" ON public.jenis_biaya FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tagihan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  jenis_biaya_id uuid REFERENCES public.jenis_biaya(id) ON DELETE SET NULL,
  judul text NOT NULL,
  periode text,
  nominal numeric NOT NULL DEFAULT 0,
  jatuh_tempo date,
  status public.tagihan_status NOT NULL DEFAULT 'belum_bayar',
  keterangan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tagihan_santri ON public.tagihan(santri_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tagihan TO authenticated;
GRANT ALL ON public.tagihan TO service_role;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tagihan admin manage" ON public.tagihan FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "tagihan ustadz view" ON public.tagihan FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ustadz'));
CREATE POLICY "tagihan santri view" ON public.tagihan FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.santri s WHERE s.id = tagihan.santri_id AND s.user_id = auth.uid()));
CREATE POLICY "tagihan wali view" ON public.tagihan FOR SELECT TO authenticated USING (public.is_wali_of(auth.uid(), santri_id));

CREATE TABLE public.pembayaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tagihan_id uuid NOT NULL REFERENCES public.tagihan(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jumlah numeric NOT NULL,
  metode text NOT NULL DEFAULT 'tunai',
  no_referensi text,
  catatan text,
  dicatat_oleh uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pembayaran_tagihan ON public.pembayaran(tagihan_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pembayaran TO authenticated;
GRANT ALL ON public.pembayaran TO service_role;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pembayaran admin manage" ON public.pembayaran FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "pembayaran ustadz view" ON public.pembayaran FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ustadz'));
CREATE POLICY "pembayaran santri view" ON public.pembayaran FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tagihan t JOIN public.santri s ON s.id = t.santri_id WHERE t.id = pembayaran.tagihan_id AND s.user_id = auth.uid()));
CREATE POLICY "pembayaran wali view" ON public.pembayaran FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tagihan t WHERE t.id = pembayaran.tagihan_id AND public.is_wali_of(auth.uid(), t.santri_id)));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_jenis_biaya_updated BEFORE UPDATE ON public.jenis_biaya FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tagihan_updated BEFORE UPDATE ON public.tagihan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pembayaran_updated BEFORE UPDATE ON public.pembayaran FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.refresh_tagihan_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tagihan uuid; v_total numeric; v_nominal numeric; v_status public.tagihan_status;
BEGIN
  v_tagihan := COALESCE(NEW.tagihan_id, OLD.tagihan_id);
  SELECT COALESCE(SUM(jumlah),0) INTO v_total FROM public.pembayaran WHERE tagihan_id = v_tagihan;
  SELECT nominal, status INTO v_nominal, v_status FROM public.tagihan WHERE id = v_tagihan;
  IF v_status = 'dibatalkan' THEN RETURN NULL; END IF;
  UPDATE public.tagihan SET status = CASE
    WHEN v_total <= 0 THEN 'belum_bayar'::public.tagihan_status
    WHEN v_total >= v_nominal THEN 'lunas'::public.tagihan_status
    ELSE 'sebagian'::public.tagihan_status END
  WHERE id = v_tagihan;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_pembayaran_status AFTER INSERT OR UPDATE OR DELETE ON public.pembayaran FOR EACH ROW EXECUTE FUNCTION public.refresh_tagihan_status();

INSERT INTO public.jenis_biaya (nama, nominal_default, berulang, deskripsi) VALUES
  ('SPP Bulanan', 500000, true, 'Iuran bulanan santri'),
  ('Uang Pangkal', 3000000, false, 'Dibayar sekali saat masuk'),
  ('Seragam & Kitab', 750000, false, 'Perlengkapan awal santri');