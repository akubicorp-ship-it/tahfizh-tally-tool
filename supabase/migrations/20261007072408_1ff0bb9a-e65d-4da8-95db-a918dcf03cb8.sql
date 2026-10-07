DROP VIEW IF EXISTS public.transparansi_publik;

CREATE OR REPLACE FUNCTION public.transparansi_publik()
RETURNS TABLE (
  total_donasi numeric,
  jumlah_donasi bigint,
  jumlah_donatur bigint,
  total_target_aktif numeric,
  total_pemasukan_usaha numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COALESCE(SUM(jumlah),0) FROM public.donasi WHERE status = 'terverifikasi'),
    (SELECT COUNT(*) FROM public.donasi WHERE status = 'terverifikasi'),
    (SELECT COUNT(DISTINCT donatur_id) FROM public.donasi WHERE status = 'terverifikasi' AND donatur_id IS NOT NULL),
    (SELECT COALESCE(SUM(target),0) FROM public.program_donasi WHERE status = 'aktif'),
    (SELECT COALESCE(SUM(jumlah),0) FROM public.transaksi_usaha WHERE jenis = 'pemasukan');
$$;

GRANT EXECUTE ON FUNCTION public.transparansi_publik() TO anon, authenticated;