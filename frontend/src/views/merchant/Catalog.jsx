"use client";
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pencil, Upload, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMerchantProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useMerchants";
import { formatPrice } from "@/lib/constants";

function parseBulkCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((s) => s.trim());
    if (parts.length < 2) continue;
    const [rawName, rawPrice] = parts;
    if (
      rawName.toLowerCase() === "name" &&
      (rawPrice.toLowerCase() === "price" || rawPrice === "")
    )
      continue;
    const price = Number(rawPrice.replace(/[^0-9.]/g, ""));
    if (!rawName || !isFinite(price) || price <= 0) continue;
    rows.push({ name: rawName, price: +price.toFixed(2) });
  }
  return rows;
}

export default function MerchantCatalog() {
  const { merchantMemberships } = useAuth();

  // Derive the merchant ID from the authenticated user's merchant membership.
  const merchantId = merchantMemberships?.[0]?.merchant_id ?? null;

  const { data: products = [], isLoading } = useMerchantProducts(merchantId);
  const createProduct = useCreateProduct(merchantId);
  const updateProduct = useUpdateProduct(merchantId);
  const deleteProduct = useDeleteProduct(merchantId);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const parsedPreview = useMemo(() => parseBulkCsv(bulkText), [bulkText]);

  if (!merchantId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">🏪</div>
        <h2 className="font-extrabold">Mağaza bağlantısı yok</h2>
        <p className="text-sm text-gray-500">
          Hesabınıza bağlı bir mağaza bulunamadı. Lütfen yönetici ile iletişime
          geçin.
        </p>
      </div>
    );
  }

  const handleAdd = () => {
    const price = Number(newPrice);
    if (!newName.trim() || !isFinite(price) || price <= 0) {
      toast.error("Ürün adı ve pozitif fiyat girin");
      return;
    }
    createProduct.mutate(
      {
        merchant_id: merchantId,
        name: newName.trim(),
        price: +price.toFixed(2),
        description: newDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewPrice("");
          setNewDesc("");
          toast.success("Ürün eklendi");
        },
        onError: (e) => toast.error(`Hata: ${e.message}`),
      },
    );
  };

  const handleEditSave = (productId) => {
    const price = Number(editPrice);
    if (!editName.trim() || !isFinite(price) || price <= 0) {
      toast.error("Geçersiz ad veya fiyat");
      return;
    }
    updateProduct.mutate(
      {
        id: productId,
        updates: {
          name: editName.trim(),
          price: +price.toFixed(2),
          description: editDesc.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Ürün güncellendi");
        },
        onError: (e) => toast.error(`Hata: ${e.message}`),
      },
    );
  };

  const handleDelete = (productId) => {
    if (!confirm("Bu ürünü kaldırmak istediğinize emin misiniz?")) return;
    deleteProduct.mutate(productId, {
      onSuccess: () => toast.success("Ürün kaldırıldı"),
      onError: (e) => toast.error(`Hata: ${e.message}`),
    });
  };

  const handleBulkAdd = () => {
    if (!parsedPreview.length) {
      toast.error("Eklenecek geçerli ürün bulunamadı");
      return;
    }
    const promises = parsedPreview.map((row) =>
      createProduct.mutateAsync({
        merchant_id: merchantId,
        name: row.name,
        price: row.price,
      }),
    );
    Promise.all(promises)
      .then(() => {
        toast.success(`${parsedPreview.length} ürün eklendi`);
        setBulkText("");
        setBulkOpen(false);
      })
      .catch((e) => toast.error(`Toplu ekleme hatası: ${e.message}`));
  };

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="merchant-catalog">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Ürün Kataloğu</h1>
          <p className="text-sm text-gray-500">
            {products.length} ürün · mağaza ID: {merchantId?.slice(0, 8)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setBulkOpen(true)}
          className="tap h-9 rounded-full px-4 text-xs font-bold"
        >
          <Layers className="mr-1.5 h-3.5 w-3.5" /> Toplu Ekle
        </Button>
      </div>

      {/* Add product form */}
      <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Yeni Ürün Ekle
        </h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Ürün adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="new-product-name"
            className="flex-1"
          />
          <Input
            placeholder="Fiyat (₺)"
            type="number"
            min="0"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            data-testid="new-product-price"
            className="w-36"
          />
          <Button
            onClick={handleAdd}
            disabled={createProduct.isPending}
            className="tap h-10 rounded-full bg-[#6C3BFF] px-5 font-bold text-white hover:bg-[#582CD6]"
            data-testid="add-product-btn"
          >
            {createProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Plus className="mr-1 h-4 w-4" /> Ekle</>
            )}
          </Button>
        </div>
        <Input
          placeholder="Açıklama (isteğe bağlı)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] p-8 text-center">
          <p className="text-sm text-gray-500">
            Henüz ürün eklenmedi. Yukarıdan başlayın.
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="product-list">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"
              data-testid={`product-row-${p.id}`}
            >
              {editingId === p.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      data-testid="edit-product-name"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-32"
                      data-testid="edit-product-price"
                    />
                  </div>
                  <Input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Açıklama"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(p.id)}
                      disabled={updateProduct.isPending}
                      className="tap rounded-full bg-[#6C3BFF] font-bold text-white"
                      data-testid="save-edit-btn"
                    >
                      {updateProduct.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : "Kaydet"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      className="tap rounded-full"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{p.name}</div>
                    {p.description && (
                      <div className="truncate text-xs text-gray-500">
                        {p.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 font-extrabold text-[#6C3BFF]">
                    {formatPrice(p.price)}
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                      setEditPrice(String(p.price));
                      setEditDesc(p.description || "");
                    }}
                    className="tap grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
                    data-testid={`edit-btn-${p.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="tap grid h-8 w-8 place-items-center rounded-full text-red-400 hover:bg-red-50"
                    data-testid={`delete-btn-${p.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk CSV dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Toplu Ürün Yükle</DialogTitle>
            <DialogDescription>
              Her satıra <code>ad,fiyat</code> formatında girin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={8}
            placeholder={"Ekmek,15\nSüt,20\nYoğurt,25"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="font-mono text-sm"
          />
          {parsedPreview.length > 0 && (
            <p className="rounded-xl bg-[#6C3BFF]/5 p-2 text-xs font-semibold text-[#6C3BFF]">
              {parsedPreview.length} ürün eklenecek
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleBulkAdd}
              disabled={!parsedPreview.length || createProduct.isPending}
              className="bg-[#6C3BFF] font-bold text-white hover:bg-[#582CD6]"
            >
              {createProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Yükle ({parsedPreview.length})</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
