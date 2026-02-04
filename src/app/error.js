 'use client'
 
 export default function Error({ error, reset }) {
   return (
     <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
       <div className="glass-panel rounded-3xl p-8 max-w-xl text-center">
         <div className="text-2xl font-bold mb-3">Bir şeyler ters gitti</div>
         <div className="text-sm text-gray-400 mb-6">{error?.message || 'Beklenmeyen bir hata oluştu.'}</div>
         <button onClick={() => reset()} className="btn btn-secondary">Tekrar Dene</button>
       </div>
     </div>
   )
 }
