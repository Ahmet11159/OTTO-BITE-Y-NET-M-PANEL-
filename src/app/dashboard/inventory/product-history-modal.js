'use client'

import { useState, useEffect } from 'react'
import { getProductHistory } from '@/app/actions/inventory'
import { getSettings } from '@/app/actions/settings'

export default function ProductHistoryModal({ product, onClose }) {
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [locale, setLocale] = useState('tr-TR')

    useEffect(() => {
        if (!product?.id) return
        getSettings().then(res => {
            if (res.success && res.data?.general?.locale) {
                setLocale(String(res.data.general.locale))
            }
        }).catch(() => {})
        getProductHistory({ id: product.id })
            .then(res => {
                if (res.success) {
                    setHistory(res.data)
                } else {
                    console.error(res.error)
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false))
    }, [product?.id])

    if (!product) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl shadow-black/50 overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Stok Geçmişi</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="font-semibold text-white">{product?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>Son işlemler</span>
                        </div>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar pr-2 -mr-2 pl-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-500 animate-pulse">Yükleniyor...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-white/10 rounded-xl bg-white/5">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 text-xl">📂</div>
                            <div className="text-sm text-gray-400 font-medium">Kayıtlı işlem bulunamadı</div>
                        </div>
                    ) : (
                        <div className="space-y-3 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/5 -z-10"></div>

                            {history.map((item, i) => (
                                <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${item.type === 'IN'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5'
                                            }`}>
                                            {item.type === 'IN' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-0.5 group-hover:text-blue-200 transition-colors">
                                                {item.type === 'IN' ? 'Stok Girişi' : 'Stok Çıkışı'}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                                                <span>{item.user}</span>
                                                <span className="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
                                                <span>{new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono text-lg font-bold ${item.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {item.type === 'IN' ? '+' : '-'}{item.amount}
                                        </div>
                                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{product?.unit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
