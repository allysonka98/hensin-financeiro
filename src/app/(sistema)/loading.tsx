export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-800/60 h-28" />
        ))}
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-800/60 h-80" />
      <div className="rounded-xl border border-gray-800 bg-gray-800/60 h-64" />
    </div>
  )
}
