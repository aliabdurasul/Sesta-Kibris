export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] p-6">
      <div className="mb-4 h-9 w-64 animate-pulse rounded-xl bg-gray-200" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
    </div>
  );
}
