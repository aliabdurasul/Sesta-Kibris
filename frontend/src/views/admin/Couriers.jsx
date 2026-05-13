"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Bike } from "lucide-react";
import { approveCourier } from "@/services/admin.service";
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

const VEHICLE_LABELS = {
  bicycle: "Bisiklet",
  scooter: "Scooter",
  motorcycle: "Motosiklet",
  car: "Araba",
  foot: "Yaya",
};

export default function AdminCouriers({ initialCouriers }) {
  const [couriers, setCouriers] = useState(initialCouriers);
  const qc = useQueryClient();

  const approveMut = useMutation({
    mutationFn: approveCourier,
    onSuccess: (updated) => {
      setCouriers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      qc.invalidateQueries({ queryKey: ["admin", "couriers"] });
      toast.success("Kurye onaylandı");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6C3BFF] text-white">
          <Bike className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Kuryeler</h1>
          <p className="text-sm text-muted-foreground">
            Tüm kuryeleri görüntüleyin ve onay işlemlerini yönetin
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {couriers.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Henüz kayıtlı kurye yok.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kurye ID</TableHead>
                <TableHead>Araç Tipi</TableHead>
                <TableHead>Onay Durumu</TableHead>
                <TableHead>Çevrimiçi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">
                    {c.user_id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    {VEHICLE_LABELS[c.vehicle_type] || c.vehicle_type}
                  </TableCell>
                  <TableCell>
                    {c.is_approved ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Onaylı
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">
                        Onay Bekliyor
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.is_online ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Çevrimiçi
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Çevrimdışı</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.is_approved && (
                      <Button
                        size="sm"
                        className="h-8 rounded-full bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
                        onClick={() => approveMut.mutate(c.id)}
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
                    {c.is_approved && (
                      <span className="text-xs text-muted-foreground">
                        Aktif kurye
                      </span>
                    )}
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
