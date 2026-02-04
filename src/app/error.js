 'use client'
 
 export default function Error({ error, reset }) {
   return (
     <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
       <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
         <div className="text-2xl font-bold mb-2">Bir şeyler yanlış gitti</div>
         <div className="text-sm text-gray-400 mb-4">{String(error?.message || 'Beklenmeyen bir hata oluştu')}</div>
         <div className="flex gap-3">
           <button onClick={() => reset()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all">
             Yeniden Dene
           </button>
           <a href="/dashboard" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-all">
             Ana Sayfa
           </a>
         </div>
       </div>
     </div>
   )
 }
