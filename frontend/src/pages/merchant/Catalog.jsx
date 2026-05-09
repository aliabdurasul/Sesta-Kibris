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
import { Plus, Trash2, Pencil, Upload, Layers } from "lucide-react";
import { toast } from "sonner";
import { useMarketplace } from "@/store/GapGelContext";

function parseBulkCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    // Accept "name,price" or "name;price" — ignore header line if first col is "name" literal
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
  const {
    state,
    findMerchant,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkAddProducts,
  } = useMarketplace();

  const merchant = findMerchant(state.currentMerchantId);
  const products = merchant?.products || [];

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const parsedPreview = useMemo(() => parseBulkCsv(bulkText), [bulkText]);

  const handleAdd = () => {
    const price = Number(newPrice);
    if (!newName.trim() || !isFinite(price) || price <= 0) {
      toast.error("Ürün adı ve pozitif fiyat girin");
      return;
    }
    addProduct(merchant.id, { name: newName.trim(), price: +price.toFixed(2) });
    setNewName("");
    setNewPrice("");
    toast.success("Ürün eklendi");
  };

  const handleEditSave = (pid) => {
    const price = Number(editPrice);
    if (!editName.trim() || !isFinite(price) || price <= 0) {
      toast.error("Geçersiz ad veya fiyat");
      return;
    }
    updateProduct(merchant.id, pid, {
      name: editName.trim(),
      price: +price.toFixed(2),
    });
    setEditingId(null);
    toast.success("Ürün güncellendi");
  };

  const handleBulkImport = () => {
    if (parsedPreview.length === 0) {
      toast.error("Geçerli satır bulunamadı");
      return;
    }
    bulkAddProducts(merchant.id, parsedPreview);
    toast.success(`${parsedPreview.length} ürün yüklendi`);
    setBulkText("");
    setBulkOpen(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBulkText(String(ev.target?.result || ""));
    reader.readAsText(file);
  };

  return (
    <div className="mt-5 gg-rise" data-testid="merchant-catalog">
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Product name
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Organic Tomatoes (1kg)"
            className="mt-1 h-10 rounded-xl border-[#E5E7EB]"
            data-testid="catalog-new-name"
          />
        </div>
        <div className="md:w-32">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Price ($)
          </label>
          <Input
            type="number"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="0.00"
            className="mt-1 h-10 rounded-xl border-[#E5E7EB]"
            data-testid="catalog-new-price"
          />
        </div>
        <Button
          onClick={handleAdd}
          className="tap h-11 rounded-full bg-[#6C3BFF] px-5 font-bold hover:bg-[#582CD6]"
          data-testid="catalog-add-button"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
        <Button
          onClick={() => setBulkOpen(true)}
          variant="outline"
          className="tap h-11 rounded-full border-[#6C3BFF]/30 font-bold text-[#6C3BFF]"
          data-testid="catalog-bulk-button"
        >
          <Layers className="mr-1.5 h-4 w-4" /> Bulk import
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F7FB] text-xs uppercase text-gray-500">
              <tr>
                <th className="w-16 px-4 py-3"></th>
                <th className="px-4 py-3">Name</th>
                <th className="w-28 px-4 py-3">Price</th>
                <th className="w-44 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No products yet. Add one above or use Bulk import.
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const isEdit = editingId === p.id;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F7F7FB]"
                    data-testid={`catalog-row-${p.id}`}
                  >
                    <td className="px-4 py-2">
                      <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {isEdit ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 rounded-lg border-[#E5E7EB]"
                          data-testid={`catalog-edit-name-${p.id}`}
                        />
                      ) : (
                        <span className="font-semibold">{p.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEdit ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="h-9 w-24 rounded-lg border-[#E5E7EB]"
                          data-testid={`catalog-edit-price-${p.id}`}
                        />
                      ) : (
                        <span>${p.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEdit ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(p.id)}
                            className="rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
                            data-testid={`catalog-save-${p.id}`}
                          >
                            Kaydet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="rounded-full"
                          >
                            Vazgeç
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(p.id);
                              setEditName(p.name);
                              setEditPrice(String(p.price));
                            }}
                            className="rounded-full border-[#E5E7EB]"
                            data-testid={`catalog-edit-${p.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              deleteProduct(merchant.id, p.id);
                              toast.success("Ürün silindi");
                            }}
                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            data-testid={`catalog-delete-${p.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Toplu ürün yükle
            </DialogTitle>
            <DialogDescription>
              CSV yapıştırarak veya dosya yükleyerek aynı anda çok sayıda ürün
              ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Her satır <code>ad,fiyat</code> şeklinde olsun (her satıra bir
              ürün) ya da CSV dosyası yükleyin. Başlık satırı opsiyoneldir.
            </p>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={handleFile}
              className="block w-full text-sm"
              data-testid="catalog-bulk-file"
            />
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Pirinç (5kg), 12.50\nSüt 1L, 2.2\nYumurta 12'li, 5.5"}
              className="h-48 rounded-xl border-[#E5E7EB] font-mono text-xs"
              data-testid="catalog-bulk-textarea"
            />
            <div className="rounded-xl bg-[#F7F7FB] p-3 text-xs text-gray-600">
              <strong>{parsedPreview.length}</strong> geçerli satır bulundu.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkOpen(false)}
              className="rounded-full"
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleBulkImport}
              className="rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
              data-testid="catalog-bulk-confirm"
            >
              {parsedPreview.length} ürün yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
