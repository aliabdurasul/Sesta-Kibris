"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Store } from "lucide-react";
import { approveMerchant, suspendMerchant } from "@/services/admin.service";
import { MERCHANT_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminMerchants({ initialMerchants }) {
  const [merchants, setMerchants] = useState(initialMerchants);
  const qc = useQueryClient();

  const approveMut = useMutation({
    mutationFn: approveMerchant,
    onSuccess: (updated) => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      qc.invalidateQueries({ queryKey: ["admin", "merchants"] });
      toast.success("Mağaza onaylandı");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const suspendMut = useMutation({
    mutationFn: suspendMerchant,
    onSuccess: (updated) => {
      setMerchants((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      qc.invalidateQueries({ queryKey: ["admin", "merchants"] });
      toast.success("Mağaza askıya alındı");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6C3BFF] text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mağazalar</h1>
          <p className="text-sm text-muted-foreground">
            Tüm mağazaları yönetin — onay ve askıya alma işlemleri
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {merchants.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Henüz kayıtlı mağaza yok.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mağaza Adı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    {MERCHANT_TYPE_LABELS[m.type] || m.type || "—"}
                  </TableCell>
                  <TableCell>
                    {m.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">
                        Onay Bekliyor
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!m.is_active && (
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
                          onClick={() => approveMut.mutate(m.id)}
                          disabled={approveMut.isPending}
                        >
                          {approveMut.isPending ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          Onayla
                        </Button>
                      )}
                      {m.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full border-red-300 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                          onClick={() => suspendMut.mutate(m.id)}
                          disabled={suspendMut.isPending}
                        >
                          {suspendMut.isPending ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          Askıya Al
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
