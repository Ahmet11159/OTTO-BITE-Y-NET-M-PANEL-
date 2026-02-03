'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProduct, deleteProduct, getFilterOptions } from '@/app/actions/inventory'

export default function EditProductModal({ product, onClose, onUpdate }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [options, setOptions] = useState({ categories: [], units: [] })
    const router = useRouter()

    useEffect(() => {
        getFilterOptions().then(res => {
            if (res.success) setOptions(res.data)
        })
    }, [])

    const handleUpdate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const formData = new FormData(e.target)
            const data = {
                id: product.id,
                name: formData.get('name'),
                unit: formData.get('unit'),
                category: formData.get('category'),
                startStock: formData.get('startStock')
            }

            const res = await updateProduct(data)

            if (res.success) {
                if (onUpdate) await onUpdate()
                else router.refresh()
                onClose()
            } else {
                alert('Hata: ' + res.error)
                setIsLoading(false)
            }
        } catch (error) {
            alert('Beklenmedik bir hata oluştu.')
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return

        setIsDeleting(true)
        try {
            const res = await deleteProduct({ id: product.id })

            if (res.success) {
                if (onUpdate) await onUpdate()
                else router.refresh()
                onClose()
            } else {
                alert('Hata: ' + res.error)
                setIsDeleting(false)
            }
        } catch (error) {
            alert('Beklenmedik bir hata oluştu.')
            setIsDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl shadow-black/50">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                    ✕
                </button>

                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Ürün Düzenle</h2>
                        <p className="text-sm text-gray-400">Ürün bilgilerini güncelleyin veya silin</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Ürün Adı</label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={product.name}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-gray-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Kategori</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    defaultValue={product.category}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-zinc-900 text-gray-500">Seçiniz...</option>
                                    {options.categories.map(c => (
                                        <option key={c.id} value={c.name} className="bg-zinc-900">{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Birim</label>
                            <div className="relative">
                                <select
                                    name="unit"
                                    defaultValue={product.unit}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-zinc-900 text-gray-500">Seçiniz...</option>
                                    {options.units.map(u => (
                                        <option key={u.id} value={u.name} className="bg-zinc-900">{u.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Başlangıç Stoğu</label>
                        <input
                            name="startStock"
                            type="number"
                            step="any"
                            defaultValue={product.startStock}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-gray-700"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading || isDeleting}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? '...' : 'Güncelle'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isLoading || isDeleting}
                            className="px-6 bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isDeleting ? '...' : 'Sil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
