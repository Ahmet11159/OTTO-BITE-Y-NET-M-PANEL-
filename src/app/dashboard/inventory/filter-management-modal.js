'use client'

import { useState, useEffect } from 'react'
import { getFilterOptions, addCategory, addUnit, deleteCategory, deleteUnit, purgeDepartment, updateCategoryMeta, updateUnitMeta } from '@/app/actions/inventory'
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
    const [selectedDept, setSelectedDept] = useState('all')
    const [editingCategoryId, setEditingCategoryId] = useState(null)
    const [editingCategoryName, setEditingCategoryName] = useState('')
    const [editingUnitId, setEditingUnitId] = useState(null)
    const [editingUnitName, setEditingUnitName] = useState('')

    useEffect(() => {
        fetchOptions()
    }, [])

    const fetchOptions = async () => {
        const res = await getFilterOptions()
        if (res.success) setOptions(res.data)
    }

    const departments = Array.from(
        new Set(
            options.categories
                .map(c => (c.name || '').split(' / ')[0])
                .filter(Boolean)
        )
    ).sort()

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategory.trim()) return
        setIsLoading(true)
        setError('')
        try {
            let fullName = newCategory.trim()
            if (selectedDept !== 'all' && selectedDept && !fullName.includes('/')) {
                fullName = `${selectedDept} / ${fullName}`
            }
            const res = await addCategory({ name: fullName })
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

    const handleUpdateCategory = async (id) => {
        if (!editingCategoryName.trim()) return
        setIsLoading(true)
        setError('')
        try {
            const res = await updateCategoryMeta({ id, name: editingCategoryName.trim() })
            if (res.success) {
                setEditingCategoryId(null)
                setEditingCategoryName('')
                await fetchOptions()
                onUpdate()
                addToast('Kategori güncellendi', 'success')
            } else {
                addToast(res.error || 'Kategori güncellenemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Kategori güncellenemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateUnit = async (id) => {
        if (!editingUnitName.trim()) return
        setIsLoading(true)
        setError('')
        try {
            const res = await updateUnitMeta({ id, name: editingUnitName.trim() })
            if (res.success) {
                setEditingUnitId(null)
                setEditingUnitName('')
                await fetchOptions()
                onUpdate()
                addToast('Birim güncellendi', 'success')
            } else {
                addToast(res.error || 'Birim güncellenemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Birim güncellenemedi', 'error')
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteDepartment = async (name) => {
        setIsLoading(true)
        setError('')
        try {
            if (typeof purgeDepartment !== 'function') {
                throw new Error('Departman temizleme fonksiyonu yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.')
            }
            const res = await purgeDepartment({ dept: name })
            if (res.success) {
                await fetchOptions()
                onUpdate()
                addToast(`"${name}" departmanı temizlendi`, 'success')
            } else {
                addToast(res.error || 'Departman silinemedi', 'error')
                setError(res.error)
            }
        } catch (err) {
            addToast(err.message || 'Departman silinemedi', 'error')
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

    const getConfirmTitle = () => {
        if (confirmDelete.type === 'category') return 'Kategori Sil'
        if (confirmDelete.type === 'unit') return 'Birim Sil'
        if (confirmDelete.type === 'department') return 'Departman Sil'
        return ''
    }

    const getConfirmMessage = () => {
        if (!confirmDelete.name) return ''
        if (confirmDelete.type === 'department') {
            return `"${confirmDelete.name}" departmanını ve altındaki kategorileri temizlemek istiyor musunuz? Uygun ürünler silinecek, aktif siparişe bağlı olanların kategori bağlantısı kaldırılacaktır.`
        }
        if (confirmDelete.type === 'category') {
            return `"${confirmDelete.name}" kategorisini silmek istiyor musunuz?`
        }
        if (confirmDelete.type === 'unit') {
            return `"${confirmDelete.name}" birimini silmek istiyor musunuz?`
        }
        return ''
    }

    const handleConfirm = async () => {
        if (confirmDelete.type === 'category') await handleDeleteCategory(confirmDelete.id)
        else if (confirmDelete.type === 'unit') await handleDeleteUnit(confirmDelete.id)
        else if (confirmDelete.type === 'department') await handleDeleteDepartment(confirmDelete.name)
        setConfirmDelete({ open: false, type: null, id: null, name: '' })
    }

    const handleCancel = () => {
        setConfirmDelete({ open: false, type: null, id: null, name: '' })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-800 bg-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-800 bg-black/20 p-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gold">
                        <span>⚙️</span>
                        Filtre Yönetimi
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl text-gray-500 transition-colors hover:text-white"
                    >
                        &times;
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-6 overflow-y-auto p-4">
                    {error && (
                        <div className="mb-2 rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-500">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <h3 className="flex items-center gap-2 border-b border-gray-800 pb-2 text-sm font-bold uppercase tracking-widest text-purple-300">
                            Departmanlar
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedDept('all')}
                                className={`rounded-full border px-3 py-1.5 text-xs ${selectedDept === 'all' ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-700 bg-black/40 text-gray-300 hover:border-purple-500/60'}`}
                            >
                                Tüm Departmanlar
                            </button>
                            {departments.map((dept) => {
                                const catCount = options.categories.filter((c) => (c.name || '').startsWith(`${dept} /`)).length
                                return (
                                    <div key={dept} className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDept(dept)}
                                            className={`rounded-full border px-3 py-1.5 text-xs ${selectedDept === dept ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-700 bg-black/40 text-gray-300 hover:border-purple-500/60'}`}
                                        >
                                            {dept} <span className="ml-1 opacity-70">({catCount})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete({ open: true, type: 'department', id: null, name: dept })}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border border-red-900/40 bg-red-900/30 text-xs text-red-400 hover:bg-red-600/50 hover:text-white"
                                            title="Departmanı kaldır"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                )
                            })}
                            {departments.length === 0 && (
                                <span className="text-xs text-gray-500">
                                    Henüz departman yok. Yeni kategoriler eklediğinizde otomatik oluşur.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 border-b border-gray-800 pb-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                                📁 Kategoriler
                            </h3>
                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="w-40 rounded-lg border border-gray-700 bg-black px-3 py-2 text-xs text-gray-200 focus:border-gold focus:outline-none"
                                    disabled={isLoading}
                                >
                                    <option value="all">Departman seç</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder={selectedDept !== 'all' ? 'Kategori adı...' : 'Departman / Kategori veya isim...'}
                                    className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !newCategory.trim()}
                                    className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black transition-all hover:bg-yellow-400 disabled:opacity-50"
                                >
                                    Ekle
                                </button>
                            </form>
                            <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-2">
                                {options.categories.filter((cat) =>
                                    selectedDept === 'all' ? true : (cat.name || '').startsWith(`${selectedDept} /`)
                                ).length > 0 ? (
                                    options.categories
                                        .filter((cat) =>
                                            selectedDept === 'all' ? true : (cat.name || '').startsWith(`${selectedDept} /`)
                                        )
                                        .map((cat) => (
                                            <div
                                                key={cat.id}
                                                className="group flex items-center justify-between rounded-lg border border-gray-800 bg-zinc-800/40 p-3 transition-all hover:border-gold/30 hover:bg-zinc-800/60"
                                            >
                                                {editingCategoryId === cat.id ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editingCategoryName}
                                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                                            className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
                                                            disabled={isLoading}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateCategory(cat.id)}
                                                                disabled={isLoading || !editingCategoryName.trim()}
                                                                className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                                            >
                                                                Kaydet
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingCategoryId(null)
                                                                    setEditingCategoryName('')
                                                                }}
                                                                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10"
                                                            >
                                                                İptal
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-medium text-white">{cat.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingCategoryId(cat.id)
                                                                    setEditingCategoryName(cat.name || '')
                                                                }}
                                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-900/40 bg-blue-900/30 text-xs text-blue-400 hover:bg-blue-500 hover:text-white"
                                                                title="Düzenle"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConfirmDelete({
                                                                        open: true,
                                                                        type: 'category',
                                                                        id: cat.id,
                                                                        name: cat.name
                                                                    })
                                                                }
                                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-900/30 bg-red-900/20 text-xs text-red-500 shadow-lg transition-all hover:bg-red-500 hover:text-white"
                                                                title="Sil"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-800 bg-black/20 py-6 text-center text-xs italic text-gray-500">
                                        Kategori bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 border-b border-gray-800 pb-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                                ⚖️ Birimler
                            </h3>
                            <form onSubmit={handleAddUnit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    placeholder="Yeni birim..."
                                    className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !newUnit.trim()}
                                    className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black transition-all hover:bg-yellow-400 disabled:opacity-50"
                                >
                                    Ekle
                                </button>
                            </form>
                            <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-2">
                                {options.units.length > 0 ? (
                                    options.units.map((unit) => (
                                        <div
                                            key={unit.id}
                                            className="group flex items-center justify-between rounded-lg border border-gray-800 bg-zinc-800/40 p-3 transition-all hover:border-gold/30 hover:bg-zinc-800/60"
                                        >
                                            {editingUnitId === unit.id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingUnitName}
                                                        onChange={(e) => setEditingUnitName(e.target.value)}
                                                        className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
                                                        disabled={isLoading}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateUnit(unit.id)}
                                                            disabled={isLoading || !editingUnitName.trim()}
                                                            className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingUnitId(null)
                                                                setEditingUnitName('')
                                                            }}
                                                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10"
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-medium text-white">{unit.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingUnitId(unit.id)
                                                                setEditingUnitName(unit.name || '')
                                                            }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-900/40 bg-blue-900/30 text-xs text-blue-400 hover:bg-blue-500 hover:text-white"
                                                            title="Düzenle"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setConfirmDelete({
                                                                    open: true,
                                                                    type: 'unit',
                                                                    id: unit.id,
                                                                    name: unit.name
                                                                })
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-red-900/30 bg-red-900/20 text-xs text-red-500 shadow-lg transition-all hover:bg-red-500 hover:text-white"
                                                            title="Sil"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-800 bg-black/20 py-6 text-center text-xs italic text-gray-500">
                                        Birim bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 bg-black/40 p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Departman, kategori ve birimleri buradan yönetebilirsiniz. Değişiklikler depodaki ürünlere otomatik yansır.
                    </p>
                </div>
            </div>

            <ConfirmModal
                open={confirmDelete.open}
                title={getConfirmTitle()}
                message={getConfirmMessage()}
                confirmText="Sil"
                cancelText="Vazgeç"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    )
}
