import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantProductsLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
