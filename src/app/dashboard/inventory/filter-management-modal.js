'use client'

import { useState, useEffect } from 'react'
import { getFilterOptions, addCategory, addUnit, deleteCategory, deleteUnit } from '@/app/actions/inventory'
import { useToast } from '@/app/providers/toast-provider'
import ConfirmModal from '@/app/components/confirm-modal'

export default function FilterManagementModal({ onClose, onUpdate }) {
    const [options, setOptions] = useState({ categories: [], units: [] })
    const [newCategory, setNewCategory] = useState('')
    const [newUnit, setNewUnit] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const { addToast } = useToast()
    const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, id: null, name: '' })

    useEffect(() => {
        fetchOptions()
    }, [])

    const fetchOptions = async () => {
        const res = await getFilterOptions()
        if (res.success) setOptions(res.data)
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategory.trim()) return
        setIsLoading(true)
        setError('')
        try {
            const res = await addCategory({ name: newCategory.trim() })
            if (res.success) {
                setNewCategory('')
                await fetchOptions()
                onUpdate()
                addToast('Kategori eklendi', 'success')
            } else {
                addToast(res.error || 'Kategori eklenemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Kategori eklenemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddUnit = async (e) => {
        e.preventDefault()
        if (!newUnit.trim()) return
        setIsLoading(true)
        setError('')
        try {
            const res = await addUnit({ name: newUnit.trim() })
            if (res.success) {
                setNewUnit('')
                await fetchOptions()
                onUpdate()
                addToast('Birim eklendi', 'success')
            } else {
                addToast(res.error || 'Birim eklenemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Birim eklenemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteCategory = async (id) => {
        setIsLoading(true)
        setError('')
        try {
            const res = await deleteCategory({ id })
            if (res?.success === false) throw new Error(res.error)
            await fetchOptions()
            onUpdate()
            addToast('Kategori silindi', 'success')
        } catch (err) {
            addToast(err.message || 'Kategori silinemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUnit = async (id) => {
        setIsLoading(true)
        setError('')
        try {
            const res = await deleteUnit({ id })
            if (res.success) {
                await fetchOptions()
                onUpdate()
                addToast('Birim silindi', 'success')
            } else {
                addToast(res.error || 'Birim silinemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Birim silinemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold text-gold flex items-center gap-2">
                        <span>⚙️</span> Filtre Yönetimi
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-3 rounded-lg text-sm mb-4 animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Categories Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-800 pb-2">
                                📁 Kategoriler
                            </h3>

                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Yeni kategori..."
                                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !newCategory.trim()}
                                    className="bg-gold text-black px-3 py-2 rounded-lg font-bold text-xs hover:bg-yellow-400 disabled:opacity-50 transition-all"
                                >
                                    Ekle
                                </button>
                            </form>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {options.categories.length > 0 ? (
                                    options.categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-lg border border-gray-800 hover:border-gold/30 hover:bg-zinc-800/60 transition-all group">
                                            <>
                                                <span className="text-white text-sm font-medium">{cat.name}</span>
                                                <button
                                                    onClick={() => setConfirmDelete({ open: true, type: 'category', id: cat.id, name: cat.name })}
                                                    className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-900/30 shadow-lg"
                                                    title="Sil"
                                                >
                                                    <span className="text-lg">🗑️</span>
                                                </button>
                                            </>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500 text-xs italic bg-black/20 rounded-lg border border-dashed border-gray-800">
                                        Kategori bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Units Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-800 pb-2">
                                ⚖️ Birimler
                            </h3>

                            <form onSubmit={handleAddUnit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    placeholder="Yeni birim..."
                                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !newUnit.trim()}
                                    className="bg-gold text-black px-3 py-2 rounded-lg font-bold text-xs hover:bg-yellow-400 disabled:opacity-50 transition-all"
                                >
                                    Ekle
                                </button>
                            </form>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {options.units.length > 0 ? (
                                    options.units.map(unit => (
                                        <div key={unit.id} className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-lg border border-gray-800 hover:border-gold/30 hover:bg-zinc-800/60 transition-all group">
                                            <>
                                                <span className="text-white text-sm font-medium">{unit.name}</span>
                                                <button
                                                    onClick={() => setConfirmDelete({ open: true, type: 'unit', id: unit.id, name: unit.name })}
                                                    className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-900/30 shadow-lg"
                                                    title="Sil"
                                                >
                                                    <span className="text-lg">🗑️</span>
                                                </button>
                                            </>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500 text-xs italic bg-black/20 rounded-lg border border-dashed border-gray-800">
                                        Birim bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-gray-800 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Kategorileri ve birimleri buradan yönetebilirsiniz. Kullanılmayanları silebilir, yenilerini ekleyebilirsiniz.
                    </p>
                </div>
            </div>
            <ConfirmModal
                open={confirmDelete.open}
                title={confirmDelete.type === 'category' ? 'Kategori Sil' : 'Birim Sil'}
                message={`"${confirmDelete.name}" ${confirmDelete.type === 'category' ? 'kategorisini' : 'birimini'} silmek istiyor musunuz?`}
                confirmText="Sil"
                cancelText="Vazgeç"
                onConfirm={async () => {
                    if (confirmDelete.type === 'category') await handleDeleteCategory(confirmDelete.id)
                    else await handleDeleteUnit(confirmDelete.id)
                    setConfirmDelete({ open: false, type: null, id: null, name: '' })
                }}
                onCancel={() => setConfirmDelete({ open: false, type: null, id: null, name: '' })}
            />
        </div>
    )
}
