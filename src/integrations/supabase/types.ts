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
      santri_status: "aktif" | "lulus" | "keluar"
      setoran_kualitas: "lancar" | "perlu_ulang" | "kurang"
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
      santri_status: ["aktif", "lulus", "keluar"],
      setoran_kualitas: ["lancar", "perlu_ulang", "kurang"],
    },
  },
} as const
