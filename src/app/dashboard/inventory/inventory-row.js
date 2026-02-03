'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStock, deleteProduct } from '@/app/actions/inventory'
import EditProductModal from './edit-product-modal'
import ProductHistoryModal from './product-history-modal'

export default function InventoryRow({ product, isSelected, onSelect, onTransaction }) {
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState(null)
    const [amount, setAmount] = useState('')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const router = useRouter()

    const handleTransaction = async (e) => {
        e.preventDefault()
        if (!amount || isLoading) return

        setIsLoading(true)
        try {
            const res = await updateStock({
                productId: product.id,
                type: mode,
                amount: parseFloat(amount)
            })

            if (res.success) {
                if (onTransaction) await onTransaction()
                else router.refresh()
                setMode(null)
                setAmount('')
            } else {
                alert('Hata: ' + res.error)
            }
        } catch (error) {
            alert('Hata: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteProduct({ id: product.id })
            
            if (res.success) {
                setShowConfirm(false)
                if (onTransaction) {
                    await onTransaction()
                } else {
                    router.refresh()
                }
            } else {
                alert('Silinemedi: ' + res.error)
            }
        } catch (error) {
            alert('Silinemedi: ' + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    // Low stock warning
    const criticalStock = 10
    const isLowStock = product.currentStock < criticalStock

    // Transaction mode view
    if (mode) {
        return (
            <div className="p-4 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 animate-fade-in">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'IN' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {mode === 'IN' ? (
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            )}
                        </div>
                        <div>
                            <span className="text-white font-semibold">{product.name}</span>
                            <p className={`text-xs font-medium ${mode === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                {mode === 'IN' ? 'Stok Girişi' : 'Stok Çıkışı'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleTransaction} className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="number"
                                step="any"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-32 bg-black/50 border-2 rounded-xl px-4 py-3 text-white text-center font-mono text-lg focus:outline-none transition-all ${mode === 'IN' ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/50 focus:border-red-500'}`}
                                placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{product.unit}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !amount}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 ${mode === 'IN'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-600/20'
                                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20'
                                }`}
                        >
                            {isLoading ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                            Onayla
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode(null); setAmount('') }}
                            className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all"
                        >
                            İptal
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Desktop View */}
            <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center group transition-all duration-200 hover:bg-white/[0.02] ${isSelected ? 'bg-blue-500/5' : ''} ${isLowStock ? 'border-l-2 border-amber-500' : ''}`}>
                {/* Checkbox */}
                <div className="col-span-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                    />
                </div>

                {/* Product Name */}
                <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                        {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="text-white font-medium">{product.name}</span>
                        <p className="text-xs text-gray-500">{product.unit}</p>
                    </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                    {product.category ? (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-lg border border-purple-500/20">
                            {product.category}
                        </span>
                    ) : (
                        <span className="text-gray-600 text-sm">-</span>
                    )}
                </div>

                {/* Start Stock */}
                <div className="col-span-1 text-center">
                    <span className="text-gray-400 font-mono">{product.startStock}</span>
                </div>

                {/* Added */}
                <div className="col-span-1 text-center">
                    <span className="text-green-400 font-bold font-mono">+{product.addedThisMonth}</span>
                </div>

                {/* Removed */}
                <div className="col-span-1 text-center">
                    <span className="text-red-400 font-bold font-mono">-{product.removedThisMonth}</span>
                </div>

                {/* Current Stock */}
                <div className="col-span-1 text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold ${isLowStock
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-amber-500/10 text-amber-400'
                        }`}>
                        <span className="text-lg">{product.currentStock}</span>
                        <span className="text-xs text-gray-500">{product.unit}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                    {showConfirm ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <span className="text-xs font-bold text-red-400">Sil?</span>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50"
                            >
                                {isDeleting ? '...' : 'Evet'}
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-3 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all"
                            >
                                Hayır
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center border border-blue-500/20"
                                title="Geçmiş"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                                title="Sil"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="w-9 h-9 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/10"
                                title="Düzenle"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={() => setMode('IN')}
                                className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center font-bold border border-green-500/20"
                                title="Stok Ekle"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                            <button
                                onClick={() => setMode('OUT')}
                                className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center font-bold border border-red-500/20"
                                title="Stok Düş"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View */}
            <div className={`md:hidden p-4 ${isSelected ? 'bg-blue-500/5' : ''} ${isLowStock ? 'border-l-2 border-amber-500' : ''}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                            {product.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="text-white font-medium">{product.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                {product.category && (
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-medium rounded border border-purple-500/20">
                                        {product.category}
                                    </span>
                                )}
                                <span className="text-gray-500 text-xs">{product.unit}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl font-bold ${isLowStock ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {product.currentStock}
                    </div>
                </div>

                {/* Mobile Stats Row */}
                <div className="flex items-center justify-between mt-3 px-8 py-2 bg-black/30 rounded-xl">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Başlangıç</p>
                        <p className="text-gray-400 font-mono">{product.startStock}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Giren</p>
                        <p className="text-green-400 font-bold font-mono">+{product.addedThisMonth}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Çıkan</p>
                        <p className="text-red-400 font-bold font-mono">-{product.removedThisMonth}</p>
                    </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex justify-end gap-2 mt-3">
                    {showConfirm ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-400">Sil?</span>
                            <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl">
                                {isDeleting ? '...' : 'Evet'}
                            </button>
                            <button onClick={() => setShowConfirm(false)} className="px-3 py-2 bg-white/10 text-white text-xs font-bold rounded-xl">
                                Hayır
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setIsHistoryModalOpen(true)} className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => setShowConfirm(true)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button onClick={() => setIsEditModalOpen(true)} className="w-9 h-9 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center border border-white/10">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setMode('IN')} className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                            <button onClick={() => setMode('OUT')} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditProductModal
                    product={product}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={onTransaction}
                />
            )}

            {/* History Modal */}
            {isHistoryModalOpen && (
                <ProductHistoryModal
                    product={product}
                    onClose={() => setIsHistoryModalOpen(false)}
                />
            )}
        </>
    )
}
