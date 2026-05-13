import { Suspense } from "react";
import AdminUsers from "@/views/admin/Users";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-9 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <AdminUsers />
    </Suspense>
  );
}
