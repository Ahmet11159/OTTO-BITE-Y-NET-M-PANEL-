 'use client'
 
 import { createContext, useContext, useState, useCallback, useEffect } from 'react'
 
 const ToastCtx = createContext({ addToast: () => {} })
 
 export function useToast() {
   return useContext(ToastCtx)
 }
 
 export default function ToastProvider({ children }) {
   const [toasts, setToasts] = useState([])
 
   const addToast = useCallback((message, type = 'info') => {
     const id = Math.random().toString(36).slice(2)
     setToasts(prev => [{ id, message, type }, ...prev].slice(0, 4))
     setTimeout(() => {
       setToasts(prev => prev.filter(t => t.id !== id))
     }, 3500)
   }, [])
 
   useEffect(() => {
     const handler = (e) => {
       if (e.detail && e.detail.message) addToast(e.detail.message, e.detail.type)
     }
     window.addEventListener('app:toast', handler)
     return () => window.removeEventListener('app:toast', handler)
   }, [addToast])
 
   return (
     <ToastCtx.Provider value={{ addToast }}>
       {children}
       <div className="fixed bottom-4 right-4 z-[1000] space-y-3 w-[92vw] max-w-sm">
         {toasts.map(t => (
           <div
             key={t.id}
             className={`px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${t.type === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-200' : t.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' : 'bg-white/10 border-white/20 text-white'}`}
           >
             {t.message}
           </div>
         ))}
       </div>
     </ToastCtx.Provider>
   )
 }
