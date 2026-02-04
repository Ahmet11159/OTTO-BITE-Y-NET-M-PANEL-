 export default function NotFound() {
   return (
     <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
       <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
         <div className="text-3xl font-bold mb-2">Sayfa Bulunamadı</div>
         <div className="text-sm text-gray-400 mb-4">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</div>
         <a href="/dashboard" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all inline-block">
           Ana Sayfa
         </a>
       </div>
     </div>
   )
 }
