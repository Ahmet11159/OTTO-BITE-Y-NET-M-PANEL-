'use client'

import { useState, useEffect } from 'react'
import { getInventoryLogs } from '@/app/actions/inventory'
import { useToast } from '@/app/providers/toast-provider'
import { getSettings } from '@/app/actions/settings'

export default function InventoryLogModal({ onClose }) {
    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 10
    const { addToast } = useToast()
    const [locale, setLocale] = useState('tr-TR')

    useEffect(() => {
        getSettings().then(res => {
            if (res.success && res.data?.general?.locale) {
                setLocale(String(res.data.general.locale))
            }
        }).catch(() => {})
        getInventoryLogs()
            .then(res => {
                if (res.success) {
                    setLogs(res.data)
                } else {
                    addToast(res.error || 'İşlem geçmişi alınamadı', 'error')
                }
            })
            .catch(err => addToast(err.message || 'İşlem geçmişi alınamadı', 'error'))
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-gray-800 rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl flex flex-col max-h-[85vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">İşlem Geçmişi</h2>
                        <p className="text-sm text-gray-400">Sistemdeki son stok hareketleri ve işlemler</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Ürün adı, detay veya kullanıcı ile ara..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                        <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={() => { setSearch(''); setPage(1) }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-gray-300">Temizle</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            Kayıtlı işlem bulunamadı.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logs.filter((log) => {
                                if (!search) return true
                                const q = search.toLowerCase()
                                return (
                                    (log.productName || '').toLowerCase().includes(q) ||
                                    (log.details || '').toLowerCase().includes(q) ||
                                    (log.userName || '').toLowerCase().includes(q) ||
                                    (log.actionType || '').toLowerCase().includes(q)
                                )
                            }).slice((page - 1) * pageSize, page * pageSize).map((log) => (
                                <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        log.actionType === 'STOCK_IN' ? 'bg-green-500/20 text-green-400' :
                                        log.actionType === 'STOCK_OUT' ? 'bg-red-500/20 text-red-400' :
                                        log.actionType === 'DELETE' ? 'bg-gray-500/20 text-gray-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {log.actionType === 'STOCK_IN' ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        ) : log.actionType === 'STOCK_OUT' ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        ) : log.actionType === 'DELETE' ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-white font-medium truncate">{log.productName}</h3>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {new Date(log.createdAt).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">{log.details}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-gray-500">İşlem Yapan</div>
                                        <div className="text-sm text-gray-300">{log.userName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {!isLoading && logs.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Sayfa {page} / {Math.max(1, Math.ceil(logs.filter((log) => {
                                if (!search) return true
                                const q = search.toLowerCase()
                                return (
                                    (log.productName || '').toLowerCase().includes(q) ||
                                    (log.details || '').toLowerCase().includes(q) ||
                                    (log.userName || '').toLowerCase().includes(q) ||
                                    (log.actionType || '').toLowerCase().includes(q)
                                )
                            }).length / pageSize))}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 disabled:opacity-50"
                                disabled={page <= 1}
                            >Önceki</button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs hover:bg-white/20 disabled:opacity-50"
                                disabled={page >= Math.ceil(logs.filter((log) => {
                                    if (!search) return true
                                    const q = search.toLowerCase()
                                    return (
                                        (log.productName || '').toLowerCase().includes(q) ||
                                        (log.details || '').toLowerCase().includes(q) ||
                                        (log.userName || '').toLowerCase().includes(q) ||
                                        (log.actionType || '').toLowerCase().includes(q)
                                    )
                                }).length / pageSize)}
                            >Sonraki</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
