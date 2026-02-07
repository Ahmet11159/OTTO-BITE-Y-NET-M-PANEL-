'use client'

import { useState, useEffect } from 'react'
import { createProduct, getFilterOptions } from '@/app/actions/inventory'
import { useToast } from '@/app/providers/toast-provider'

export default function NewProductModal({ onClose, onUpdate }) {
    const [isLoading, setIsLoading] = useState(false)
    const [options, setOptions] = useState({ categories: [], units: [] })
    const [unitStep, setUnitStep] = useState(1)
    const [selectedUnit, setSelectedUnit] = useState('ADET')
    const [selectedDept, setSelectedDept] = useState('all')
    const { addToast } = useToast()

    useEffect(() => {
        getFilterOptions().then(res => {
            if (res.success) {
                setOptions(res.data)
            }
        })
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(e.target)
            const data = {
                name: formData.get('name'),
                unit: formData.get('unit'),
                category: formData.get('category'),
                startStock: formData.get('startStock')
            }

            const q = parseFloat(data.startStock)
            if (!data.name || !data.unit || !data.category) {
                addToast('Tüm alanlar gerekli', 'error'); setIsLoading(false); return
            }
            if (Number.isNaN(q) || q < 0) {
                addToast('Başlangıç stoğu 0 veya daha büyük olmalı', 'error'); setIsLoading(false); return
            }

            const res = await createProduct(data)

            if (res.success) {
                addToast('Ürün eklendi', 'success')
                if (onUpdate) await onUpdate()
                onClose()
            } else {
                addToast(res.error || 'Hata oluştu', 'error')
            }
        } catch (error) {
            addToast('Beklenmedik bir hata oluştu', 'error')
        } finally {
            setIsLoading(false)
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Yeni Ürün Ekle</h2>
                        <p className="text-sm text-gray-400">Depoya yeni bir stok kalemi ekleyin</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Ürün Adı</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none transition-all placeholder:text-gray-700"
                            placeholder="Örn: Efes Pilsen Fıçı"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Departman</label>
                            <div className="relative">
                                <select
                                    value={selectedDept}
                                    onChange={(e) => { setSelectedDept(e.target.value); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all" className="bg-zinc-900 text-gray-500">Seçiniz...</option>
                                    {[...new Set(options.categories.map(c => (c.name || '').split(' / ')[0]).filter(Boolean))]
                                        .filter(d => d !== 'Yiyecek' && d !== 'İçecek' && d !== 'Sarf Malzeme')
                                        .map(d => (
                                            <option key={d} value={d} className="bg-zinc-900">{d}</option>
                                        ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5 tracking-widest pl-1">Kategori</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-zinc-900 text-gray-500">Seçiniz...</option>
                                    {options.categories
                                        .filter(c => selectedDept === 'all' ? true : (c.name || '').startsWith(`${selectedDept} /`))
                                        .map(c => (
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
                                    onChange={(e) => {
                                        const val = e.target.value
                                        const u = (val || '').toLowerCase()
                                        setUnitStep(['kg', 'kilogram', 'litre', 'liter'].includes(u) ? 0.5 : 1)
                                        setSelectedUnit(val || 'ADET')
                                    }}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none transition-all appearance-none cursor-pointer"
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
                        <div className="relative">
                            <input
                                name="startStock"
                                type="number"
                                step={unitStep}
                                min={0}
                                inputMode="decimal"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none transition-all placeholder:text-gray-700"
                                placeholder="0.00"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 text-xs font-bold">{String(selectedUnit || '').toUpperCase()}</div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 pl-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Bu değer mevcut ayın başındaki devir stoğu olarak kaydedilir.
                        </p>
                        <div className="text-[10px] text-gray-500 mt-1 pl-1">Min 0 • Adım {unitStep}</div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Ekleniyor...
                            </>
                        ) : (
                            'Ürünü Kaydet'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
