export default function CustomerLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] px-4 pt-4 pb-24">
      <div className="mb-4 h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
