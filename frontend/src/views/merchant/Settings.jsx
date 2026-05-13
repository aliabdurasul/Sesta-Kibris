"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useMerchant } from "@/hooks/useMerchants";
import * as merchantsService from "@/services/merchants.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { merchantKeys } from "@/hooks/useMerchants";
import { DELIVERY_MODE_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const settingsSchema = z.object({
  name: z.string().min(2, "Mağaza adı en az 2 karakter olmalıdır"),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin"),
  address: z.string().min(5, "Adres en az 5 karakter olmalıdır"),
  delivery_mode: z.enum(["platform_only", "merchant_only", "hybrid"]),
  is_accepting_orders: z.boolean(),
});

export default function MerchantSettings() {
  const { merchantMemberships } = useAuth();
  const merchantId = merchantMemberships?.[0]?.merchant_id ?? null;
  const queryClient = useQueryClient();

  const { data: merchant, isLoading, isError, error } = useMerchant(merchantId);

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    values: merchant
      ? {
          name: merchant.name ?? "",
          phone: merchant.phone ?? "",
          address: merchant.address ?? "",
          delivery_mode: merchant.delivery_mode ?? "platform_only",
          is_accepting_orders: merchant.is_accepting_orders ?? true,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => merchantsService.updateMerchant(merchantId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(merchantKeys.detail(merchantId), updated);
      queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      toast.success("Ayarlar kaydedildi");
    },
    onError: (err) => {
      toast.error(`Hata: ${err.message}`);
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (!merchantId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Mağaza hesabınız bulunamadı. Yönetici onayı bekleniyor olabilir.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-destructive">
        Ayarlar yüklenemedi: {error?.message ?? "Bilinmeyen hata"}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-24 pt-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mağaza Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          İşletme bilgilerinizi buradan güncelleyebilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mağaza Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Mağaza adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="0533 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input placeholder="Tam adres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teslimat Modu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Teslimat modu seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DELIVERY_MODE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_accepting_orders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sipariş Kabul</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Kapalıyken müşteriler sipariş veremez.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={updateMutation.isPending || !form.formState.isDirty}
                className="w-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6] sm:w-auto"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Kaydet
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
