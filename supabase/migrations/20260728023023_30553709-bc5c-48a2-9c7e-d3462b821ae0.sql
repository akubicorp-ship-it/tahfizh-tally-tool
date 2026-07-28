CREATE TYPE public.pegawai_jabatan AS ENUM ('pengasuh','ustadz','admin_tu','keamanan','dapur','kebersihan','lainnya');
CREATE TYPE public.pegawai_status AS ENUM ('aktif','cuti','nonaktif');
CREATE TYPE public.kehadiran_status AS ENUM ('hadir','izin','sakit','alpa','libur');
CREATE TYPE public.penggajian_status AS ENUM ('draft','dibayar');

CREATE TABLE public.pegawai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nip text NOT NULL UNIQUE,
  nama_lengkap text NOT NULL,
  jabatan public.pegawai_jabatan NOT NULL DEFAULT 'lainnya',
  status public.pegawai_status NOT NULL DEFAULT 'aktif',
  no_hp text,
  alamat text,
  tanggal_masuk date NOT NULL DEFAULT CURRENT_DATE,
  tanggal_keluar date,
  gaji_pokok numeric NOT NULL DEFAULT 0,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pegawai TO authenticated;
GRANT ALL ON public.pegawai TO service_role;
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pegawai admin manage" ON public.pegawai FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "pegawai self view" ON public.pegawai FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.kehadiran_pegawai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id uuid NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  status public.kehadiran_status NOT NULL DEFAULT 'hadir',
  jam_masuk time,
  jam_pulang time,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pegawai_id, tanggal)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kehadiran_pegawai TO authenticated;
GRANT ALL ON public.kehadiran_pegawai TO service_role;
ALTER TABLE public.kehadiran_pegawai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kehadiran admin manage" ON public.kehadiran_pegawai FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "kehadiran self view" ON public.kehadiran_pegawai FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pegawai p WHERE p.id = kehadiran_pegawai.pegawai_id AND p.user_id = auth.uid()));

CREATE TABLE public.penggajian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id uuid NOT NULL REFERENCES public.pegawai(id) ON DELETE CASCADE,
  periode text NOT NULL,
  gaji_pokok numeric NOT NULL DEFAULT 0,
  tunjangan numeric NOT NULL DEFAULT 0,
  potongan numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (gaji_pokok + tunjangan - potongan) STORED,
  status public.penggajian_status NOT NULL DEFAULT 'draft',
  tanggal_bayar date,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pegawai_id, periode)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.penggajian TO authenticated;
GRANT ALL ON public.penggajian TO service_role;
ALTER TABLE public.penggajian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "penggajian admin manage" ON public.penggajian FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "penggajian self view" ON public.penggajian FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pegawai p WHERE p.id = penggajian.pegawai_id AND p.user_id = auth.uid()));

CREATE TRIGGER update_pegawai_updated_at BEFORE UPDATE ON public.pegawai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kehadiran_pegawai_updated_at BEFORE UPDATE ON public.kehadiran_pegawai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_penggajian_updated_at BEFORE UPDATE ON public.penggajian
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();