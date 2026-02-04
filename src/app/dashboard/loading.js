export default function Loading() {
  return (
    <div className="container py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-md mb-4" />
          <div className="h-4 bg-white/10 rounded-md mb-2" />
          <div className="h-4 bg-white/10 rounded-md mb-2" />
          <div className="h-4 bg-white/10 rounded-md" />
        </div>
        <div className="glass-panel rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-md mb-4" />
          <div className="h-4 bg-white/10 rounded-md mb-2" />
          <div className="h-4 bg-white/10 rounded-md mb-2" />
          <div className="h-4 bg-white/10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
