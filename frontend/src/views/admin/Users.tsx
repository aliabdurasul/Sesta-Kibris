"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Shield, Store, Bike, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function getRoleBadge(role: string) {
  const map: Record<string, { label: string; className: string }> = {
    admin: { label: "Yönetici", className: "bg-purple-100 text-purple-700" },
    merchant_owner: { label: "Mağaza Sahibi", className: "bg-blue-100 text-blue-700" },
    merchant_staff: { label: "Mağaza Personeli", className: "bg-sky-100 text-sky-700" },
    courier: { label: "Kurye", className: "bg-green-100 text-green-700" },
    customer: { label: "Müşteri", className: "bg-gray-100 text-gray-700" },
  };
  return map[role] || { label: role, className: "bg-gray-100 text-gray-600" };
}

function RoleIcon({ role }: { role: string }) {
  if (role === "admin") return <Shield className="h-4 w-4" />;
  if (role.startsWith("merchant")) return <Store className="h-4 w-4" />;
  if (role === "courier") return <Bike className="h-4 w-4" />;
  return <User className="h-4 w-4" />;
}

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
};

async function fetchUsers(): Promise<UserRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, created_at, user_roles(role)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const { data: authUsers } = await supabase.auth.admin?.listUsers?.() || { data: null };

  return (profiles || []).map((p) => {
    const userRoles = ((p as any).user_roles || []).map((r: { role: string }) => r.role);
    return {
      id: p.id,
      email: (authUsers?.users?.find?.((u) => u.id === p.id)?.email) || p.id,
      full_name: p.full_name,
      created_at: p.created_at,
      roles: userRoles.length ? userRoles : ["customer"],
    };
  });
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
    staleTime: 2 * 60 * 1000,
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-[#6C3BFF]" />
          <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Kullanıcılar</h1>
        </div>
        <Badge variant="secondary" className="bg-[#F3F0FF] text-[#6C3BFF] font-bold">
          {users.length} kullanıcı
        </Badge>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="E-posta veya isim ara..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Kullanıcılar yüklenemedi.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kullanıcı</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Rol(ler)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF]">
                        <span className="text-xs font-extrabold">
                          {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.full_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => {
                        const badge = getRoleBadge(role);
                        return (
                          <span
                            key={role}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                          >
                            <RoleIcon role={role} />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
