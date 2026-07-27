import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Users,
  GraduationCap,
  ClipboardCheck,
  Shield,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { primaryRole, roleLabel, type AppRole, type CurrentUser } from "@/hooks/use-auth";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const NAV: Record<AppRole, NavItem[]> = {
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Data Santri", url: "/santri", icon: GraduationCap },
    { title: "Halaqah", url: "/halaqah", icon: BookOpen },
    { title: "Setoran Hafalan", url: "/setoran", icon: ClipboardCheck },
    { title: "Keuangan & SPP", url: "/keuangan", icon: Wallet },
    { title: "Manajemen Pengguna", url: "/users", icon: Shield },
  ],
  ustadz: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Data Santri", url: "/santri", icon: GraduationCap },
    { title: "Input Setoran", url: "/setoran", icon: ClipboardCheck },
    { title: "Halaqah", url: "/halaqah", icon: BookOpen },
  ],
  wali: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Progres Anak", url: "/santri", icon: GraduationCap },
    { title: "Tagihan & SPP", url: "/keuangan", icon: Wallet },
  ],
  santri: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Progres Saya", url: "/santri", icon: GraduationCap },
    { title: "Tagihan Saya", url: "/keuangan", icon: Wallet },
  ],
};

export function AppSidebar({ me }: { me: CurrentUser }) {
  const role = primaryRole(me.roles);
  const items = NAV[role];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate font-display text-sm font-semibold text-sidebar-foreground">MSQ</div>
            <div className="truncate text-[11px] text-sidebar-foreground/70">Ma'had Sabilul Qur'an</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{roleLabel(role)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = currentPath === item.url || currentPath.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-1 border-t border-sidebar-border/40 p-2">
          <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-sidebar-foreground">{me.fullName}</div>
            <div className="truncate text-xs text-sidebar-foreground/70">{me.user.email}</div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Keluar">
                <LogOut className="size-4" />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { Users as _Users };