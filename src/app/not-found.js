export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="glass-panel rounded-3xl p-8 max-w-xl text-center">
        <div className="text-2xl font-bold mb-3">Sayfa bulunamadı</div>
        <div className="text-sm text-gray-400 mb-6">Aradığınız sayfa kaldırılmış olabilir veya URL’yi yanlış girdiniz.</div>
        <a href="/" className="btn btn-primary">Ana sayfaya dön</a>
      </div>
    </div>
  )
}
