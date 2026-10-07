DROP FUNCTION IF EXISTS public.transparansi_publik();

CREATE OR REPLACE FUNCTION public.transparansi_publik()
RETURNS TABLE (
  total_donasi numeric,
  jumlah_donasi bigint,
  jumlah_donatur bigint,
  total_target_aktif numeric,
  total_pemasukan_usaha numeric,
  program_aktif jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COALESCE(SUM(jumlah),0) FROM public.donasi WHERE status = 'terverifikasi'),
    (SELECT COUNT(*) FROM public.donasi WHERE status = 'terverifikasi'),
    (SELECT COUNT(DISTINCT donatur_id) FROM public.donasi WHERE status = 'terverifikasi' AND donatur_id IS NOT NULL),
    (SELECT COALESCE(SUM(target),0) FROM public.program_donasi WHERE status = 'aktif'),
    (SELECT COALESCE(SUM(jumlah),0) FROM public.transaksi_usaha WHERE jenis = 'pemasukan'),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', p.id, 'nama', p.nama, 'jenis', p.jenis, 'target', p.target, 'terkumpul', COALESCE(d.total,0), 'deskripsi', p.deskripsi) ORDER BY p.created_at)
       FROM public.program_donasi p
       LEFT JOIN (SELECT program_id, SUM(jumlah) AS total FROM public.donasi WHERE status = 'terverifikasi' AND program_id IS NOT NULL GROUP BY program_id) d ON d.program_id = p.id
       WHERE p.status = 'aktif'),
      '[]'::jsonb
    );
$$;

GRANT EXECUTE ON FUNCTION public.transparansi_publik() TO anon, authenticated;