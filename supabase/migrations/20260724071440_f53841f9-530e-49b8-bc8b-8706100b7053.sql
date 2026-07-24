
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'ustadz', 'wali', 'santri');
CREATE TYPE public.santri_status AS ENUM ('aktif', 'lulus', 'keluar');
CREATE TYPE public.setoran_kualitas AS ENUM ('lancar', 'perlu_ulang', 'kurang');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles view own or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- halaqah
CREATE TABLE public.halaqah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  ustadz_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deskripsi text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.halaqah TO authenticated;
GRANT ALL ON public.halaqah TO service_role;
ALTER TABLE public.halaqah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "halaqah select authenticated" ON public.halaqah FOR SELECT TO authenticated USING (true);
CREATE POLICY "halaqah admin manage" ON public.halaqah FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- santri
CREATE TABLE public.santri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nis text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  tanggal_lahir date,
  alamat text,
  halaqah_id uuid REFERENCES public.halaqah(id) ON DELETE SET NULL,
  angkatan text,
  status public.santri_status NOT NULL DEFAULT 'aktif',
  foto_url text,
  nama_wali text,
  no_hp_wali text,
  hubungan_wali text,
  tanggal_masuk date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX santri_halaqah_idx ON public.santri(halaqah_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.santri TO authenticated;
GRANT ALL ON public.santri TO service_role;
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;

-- wali_santri
CREATE TABLE public.wali_santri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wali_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wali_user_id, santri_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wali_santri TO authenticated;
GRANT ALL ON public.wali_santri TO service_role;
ALTER TABLE public.wali_santri ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_wali_of(_user_id uuid, _santri_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.wali_santri WHERE wali_user_id = _user_id AND santri_id = _santri_id);
$$;

CREATE POLICY "wali_santri admin manage" ON public.wali_santri FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "wali_santri view own" ON public.wali_santri FOR SELECT TO authenticated
  USING (wali_user_id = auth.uid());

-- santri policies
CREATE POLICY "santri admin manage" ON public.santri FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "santri ustadz view all" ON public.santri FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ustadz'));
CREATE POLICY "santri wali view linked" ON public.santri FOR SELECT TO authenticated
  USING (public.is_wali_of(auth.uid(), id));
CREATE POLICY "santri self view" ON public.santri FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- setoran_hafalan
CREATE TABLE public.setoran_hafalan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  ustadz_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT current_date,
  juz int NOT NULL CHECK (juz BETWEEN 1 AND 30),
  surah text,
  halaman int,
  ayat_dari int,
  ayat_sampai int,
  kualitas public.setoran_kualitas NOT NULL DEFAULT 'lancar',
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX setoran_santri_idx ON public.setoran_hafalan(santri_id);
CREATE INDEX setoran_tanggal_idx ON public.setoran_hafalan(tanggal DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setoran_hafalan TO authenticated;
GRANT ALL ON public.setoran_hafalan TO service_role;
ALTER TABLE public.setoran_hafalan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setoran admin manage" ON public.setoran_hafalan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "setoran ustadz view" ON public.setoran_hafalan FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ustadz'));
CREATE POLICY "setoran ustadz insert" ON public.setoran_hafalan FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ustadz') AND ustadz_id = auth.uid());
CREATE POLICY "setoran ustadz update own" ON public.setoran_hafalan FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ustadz') AND ustadz_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'ustadz') AND ustadz_id = auth.uid());
CREATE POLICY "setoran ustadz delete own" ON public.setoran_hafalan FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ustadz') AND ustadz_id = auth.uid());
CREATE POLICY "setoran wali view linked" ON public.setoran_hafalan FOR SELECT TO authenticated
  USING (public.is_wali_of(auth.uid(), santri_id));
CREATE POLICY "setoran santri self view" ON public.setoran_hafalan FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.santri s WHERE s.id = santri_id AND s.user_id = auth.uid()));

-- munaqasyah
CREATE TABLE public.munaqasyah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.santri(id) ON DELETE CASCADE,
  juz int NOT NULL CHECK (juz BETWEEN 1 AND 30),
  tanggal date NOT NULL,
  nilai numeric(5,2),
  penguji_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.munaqasyah TO authenticated;
GRANT ALL ON public.munaqasyah TO service_role;
ALTER TABLE public.munaqasyah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "munaqasyah admin manage" ON public.munaqasyah FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "munaqasyah ustadz view" ON public.munaqasyah FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ustadz'));
CREATE POLICY "munaqasyah ustadz insert" ON public.munaqasyah FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ustadz'));
CREATE POLICY "munaqasyah wali view" ON public.munaqasyah FOR SELECT TO authenticated
  USING (public.is_wali_of(auth.uid(), santri_id));
CREATE POLICY "munaqasyah santri view" ON public.munaqasyah FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.santri s WHERE s.id = santri_id AND s.user_id = auth.uid()));
