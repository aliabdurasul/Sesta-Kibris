export default function MerchantLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] px-4 pt-4 pb-8">
      <div className="mb-4 h-8 w-56 animate-pulse rounded-xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
