import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantOrdersLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
