export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      donasi: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string | null
          donatur_id: string | null
          id: string
          jumlah: number
          metode: string
          nama_donatur: string | null
          no_referensi: string | null
          program_id: string | null
          status: Database["public"]["Enums"]["donasi_status"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string | null
          donatur_id?: string | null
          id?: string
          jumlah?: number
          metode?: string
          nama_donatur?: string | null
          no_referensi?: string | null
          program_id?: string | null
          status?: Database["public"]["Enums"]["donasi_status"]
          tanggal?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string | null
          donatur_id?: string | null
          id?: string
          jumlah?: number
          metode?: string
          nama_donatur?: string | null
          no_referensi?: string | null
          program_id?: string | null
          status?: Database["public"]["Enums"]["donasi_status"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donasi_donatur_id_fkey"
            columns: ["donatur_id"]
            isOneToOne: false
            referencedRelation: "donatur"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donasi_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_donasi"
            referencedColumns: ["id"]
          },
        ]
      }
      donatur: {
        Row: {
          alamat: string | null
          anonim: boolean
          created_at: string
          email: string | null
          id: string
          nama: string
          no_hp: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          anonim?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nama: string
          no_hp?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          anonim?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nama?: string
          no_hp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      halaqah: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          nama: string
          ustadz_id: string | null
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama: string
          ustadz_id?: string | null
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama?: string
          ustadz_id?: string | null
        }
        Relationships: []
      }
      jenis_biaya: {
        Row: {
          berulang: boolean
          created_at: string
          deskripsi: string | null
          id: string
          nama: string
          nominal_default: number
          updated_at: string
        }
        Insert: {
          berulang?: boolean
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama: string
          nominal_default?: number
          updated_at?: string
        }
        Update: {
          berulang?: boolean
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama?: string
          nominal_default?: number
          updated_at?: string
        }
        Relationships: []
      }
      kehadiran_pegawai: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jam_masuk: string | null
          jam_pulang: string | null
          pegawai_id: string
          status: Database["public"]["Enums"]["kehadiran_status"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          pegawai_id: string
          status?: Database["public"]["Enums"]["kehadiran_status"]
          tanggal?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          pegawai_id?: string
          status?: Database["public"]["Enums"]["kehadiran_status"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kehadiran_pegawai_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      munaqasyah: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          juz: number
          nilai: number | null
          penguji_id: string | null
          santri_id: string
          tanggal: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          juz: number
          nilai?: number | null
          penguji_id?: string | null
          santri_id: string
          tanggal: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          juz?: number
          nilai?: number | null
          penguji_id?: string | null
          santri_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "munaqasyah_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      pegawai: {
        Row: {
          alamat: string | null
          catatan: string | null
          created_at: string
          gaji_pokok: number
          id: string
          jabatan: Database["public"]["Enums"]["pegawai_jabatan"]
          nama_lengkap: string
          nip: string
          no_hp: string | null
          status: Database["public"]["Enums"]["pegawai_status"]
          tanggal_keluar: string | null
          tanggal_masuk: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          gaji_pokok?: number
          id?: string
          jabatan?: Database["public"]["Enums"]["pegawai_jabatan"]
          nama_lengkap: string
          nip: string
          no_hp?: string | null
          status?: Database["public"]["Enums"]["pegawai_status"]
          tanggal_keluar?: string | null
          tanggal_masuk?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          gaji_pokok?: number
          id?: string
          jabatan?: Database["public"]["Enums"]["pegawai_jabatan"]
          nama_lengkap?: string
          nip?: string
          no_hp?: string | null
          status?: Database["public"]["Enums"]["pegawai_status"]
          tanggal_keluar?: string | null
          tanggal_masuk?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pembayaran: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string | null
          id: string
          jumlah: number
          metode: string
          no_referensi: string | null
          tagihan_id: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          jumlah: number
          metode?: string
          no_referensi?: string | null
          tagihan_id: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          jumlah?: number
          metode?: string
          no_referensi?: string | null
          tagihan_id?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_tagihan_id_fkey"
            columns: ["tagihan_id"]
            isOneToOne: false
            referencedRelation: "tagihan"
            referencedColumns: ["id"]
          },
        ]
      }
      penggajian: {
        Row: {
          catatan: string | null
          created_at: string
          gaji_pokok: number
          id: string
          pegawai_id: string
          periode: string
          potongan: number
          status: Database["public"]["Enums"]["penggajian_status"]
          tanggal_bayar: string | null
          total: number | null
          tunjangan: number
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          gaji_pokok?: number
          id?: string
          pegawai_id: string
          periode: string
          potongan?: number
          status?: Database["public"]["Enums"]["penggajian_status"]
          tanggal_bayar?: string | null
          total?: number | null
          tunjangan?: number
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          gaji_pokok?: number
          id?: string
          pegawai_id?: string
          periode?: string
          potongan?: number
          status?: Database["public"]["Enums"]["penggajian_status"]
          tanggal_bayar?: string | null
          total?: number | null
          tunjangan?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penggajian_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      program_donasi: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          jenis: Database["public"]["Enums"]["program_jenis"]
          nama: string
          status: Database["public"]["Enums"]["program_status"]
          tanggal_mulai: string
          tanggal_selesai: string | null
          target: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["program_jenis"]
          nama: string
          status?: Database["public"]["Enums"]["program_status"]
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          target?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["program_jenis"]
          nama?: string
          status?: Database["public"]["Enums"]["program_status"]
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          target?: number
          updated_at?: string
        }
        Relationships: []
      }
      santri: {
        Row: {
          alamat: string | null
          angkatan: string | null
          created_at: string
          foto_url: string | null
          halaqah_id: string | null
          hubungan_wali: string | null
          id: string
          nama_lengkap: string
          nama_wali: string | null
          nis: string
          no_hp_wali: string | null
          status: Database["public"]["Enums"]["santri_status"]
          tanggal_lahir: string | null
          tanggal_masuk: string
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          angkatan?: string | null
          created_at?: string
          foto_url?: string | null
          halaqah_id?: string | null
          hubungan_wali?: string | null
          id?: string
          nama_lengkap: string
          nama_wali?: string | null
          nis: string
          no_hp_wali?: string | null
          status?: Database["public"]["Enums"]["santri_status"]
          tanggal_lahir?: string | null
          tanggal_masuk?: string
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          angkatan?: string | null
          created_at?: string
          foto_url?: string | null
          halaqah_id?: string | null
          hubungan_wali?: string | null
          id?: string
          nama_lengkap?: string
          nama_wali?: string | null
          nis?: string
          no_hp_wali?: string | null
          status?: Database["public"]["Enums"]["santri_status"]
          tanggal_lahir?: string | null
          tanggal_masuk?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "santri_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqah"
            referencedColumns: ["id"]
          },
        ]
      }
      setoran_hafalan: {
        Row: {
          ayat_dari: number | null
          ayat_sampai: number | null
          catatan: string | null
          created_at: string
          halaman: number | null
          id: string
          juz: number
          kualitas: Database["public"]["Enums"]["setoran_kualitas"]
          santri_id: string
          surah: string | null
          tanggal: string
          ustadz_id: string
        }
        Insert: {
          ayat_dari?: number | null
          ayat_sampai?: number | null
          catatan?: string | null
          created_at?: string
          halaman?: number | null
          id?: string
          juz: number
          kualitas?: Database["public"]["Enums"]["setoran_kualitas"]
          santri_id: string
          surah?: string | null
          tanggal?: string
          ustadz_id: string
        }
        Update: {
          ayat_dari?: number | null
          ayat_sampai?: number | null
          catatan?: string | null
          created_at?: string
          halaman?: number | null
          id?: string
          juz?: number
          kualitas?: Database["public"]["Enums"]["setoran_kualitas"]
          santri_id?: string
          surah?: string | null
          tanggal?: string
          ustadz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setoran_hafalan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      tagihan: {
        Row: {
          created_at: string
          id: string
          jatuh_tempo: string | null
          jenis_biaya_id: string | null
          judul: string
          keterangan: string | null
          nominal: number
          periode: string | null
          santri_id: string
          status: Database["public"]["Enums"]["tagihan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jatuh_tempo?: string | null
          jenis_biaya_id?: string | null
          judul: string
          keterangan?: string | null
          nominal?: number
          periode?: string | null
          santri_id: string
          status?: Database["public"]["Enums"]["tagihan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jatuh_tempo?: string | null
          jenis_biaya_id?: string | null
          judul?: string
          keterangan?: string | null
          nominal?: number
          periode?: string | null
          santri_id?: string
          status?: Database["public"]["Enums"]["tagihan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tagihan_jenis_biaya_id_fkey"
            columns: ["jenis_biaya_id"]
            isOneToOne: false
            referencedRelation: "jenis_biaya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagihan_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_usaha: {
        Row: {
          created_at: string
          dicatat_oleh: string | null
          id: string
          jenis: Database["public"]["Enums"]["transaksi_jenis"]
          jumlah: number
          kategori: string | null
          keterangan: string | null
          tanggal: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["transaksi_jenis"]
          jumlah?: number
          kategori?: string | null
          keterangan?: string | null
          tanggal?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["transaksi_jenis"]
          jumlah?: number
          kategori?: string | null
          keterangan?: string | null
          tanggal?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_usaha_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unit_usaha"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_usaha: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          jenis: string | null
          nama: string
          penanggung_jawab: string | null
          status: Database["public"]["Enums"]["usaha_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenis?: string | null
          nama: string
          penanggung_jawab?: string | null
          status?: Database["public"]["Enums"]["usaha_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenis?: string | null
          nama?: string
          penanggung_jawab?: string | null
          status?: Database["public"]["Enums"]["usaha_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_usaha_penanggung_jawab_fkey"
            columns: ["penanggung_jawab"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wali_santri: {
        Row: {
          created_at: string
          id: string
          santri_id: string
          wali_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          santri_id: string
          wali_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          santri_id?: string
          wali_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wali_santri_santri_id_fkey"
            columns: ["santri_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_wali_of: {
        Args: { _santri_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "ustadz" | "wali" | "santri"
      donasi_status: "menunggu" | "terverifikasi" | "ditolak"
      kehadiran_status: "hadir" | "izin" | "sakit" | "alpa" | "libur"
      pegawai_jabatan:
        | "pengasuh"
        | "ustadz"
        | "admin_tu"
        | "keamanan"
        | "dapur"
        | "kebersihan"
        | "lainnya"
      pegawai_status: "aktif" | "cuti" | "nonaktif"
      penggajian_status: "draft" | "dibayar"
      program_jenis: "donasi" | "wakaf" | "zakat" | "infaq"
      program_status: "aktif" | "selesai" | "ditutup"
      santri_status: "aktif" | "lulus" | "keluar"
      setoran_kualitas: "lancar" | "perlu_ulang" | "kurang"
      tagihan_status: "belum_bayar" | "sebagian" | "lunas" | "dibatalkan"
      transaksi_jenis: "pemasukan" | "pengeluaran"
      usaha_status: "aktif" | "nonaktif"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "ustadz", "wali", "santri"],
      donasi_status: ["menunggu", "terverifikasi", "ditolak"],
      kehadiran_status: ["hadir", "izin", "sakit", "alpa", "libur"],
      pegawai_jabatan: [
        "pengasuh",
        "ustadz",
        "admin_tu",
        "keamanan",
        "dapur",
        "kebersihan",
        "lainnya",
      ],
      pegawai_status: ["aktif", "cuti", "nonaktif"],
      penggajian_status: ["draft", "dibayar"],
      program_jenis: ["donasi", "wakaf", "zakat", "infaq"],
      program_status: ["aktif", "selesai", "ditutup"],
      santri_status: ["aktif", "lulus", "keluar"],
      setoran_kualitas: ["lancar", "perlu_ulang", "kurang"],
      tagihan_status: ["belum_bayar", "sebagian", "lunas", "dibatalkan"],
      transaksi_jenis: ["pemasukan", "pengeluaran"],
      usaha_status: ["aktif", "nonaktif"],
    },
  },
} as const
