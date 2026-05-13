export default function CourierLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] px-4 pt-4 pb-24">
      <div className="mb-4 h-8 w-40 animate-pulse rounded-xl bg-gray-200" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
