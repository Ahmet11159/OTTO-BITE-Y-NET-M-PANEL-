'use client'

import { useState, useEffect } from 'react'
import { updateLostItem } from '@/app/actions/lost-found'
import { ITEM_CATEGORIES } from './constants'

export default function LostItemEditModal({ item, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        itemName: '',
        itemDescription: '',
        itemCategory: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        tableNumber: '',
        foundLocation: '',
        sittingTimeDate: '',
        sittingTimeHour: '',
        sittingEndTimeHour: '',
        foundAtDate: '',
        foundAtHour: '',
        notes: ''
    })

    // Form verilerini item'dan doldur
    useEffect(() => {
        if (item) {
            const foundAt = item.foundAt ? new Date(item.foundAt) : null
            const sittingTime = item.sittingTime ? new Date(item.sittingTime) : null
            const sittingEndTime = item.sittingEndTime ? new Date(item.sittingEndTime) : null

            setFormData({
                itemName: item.itemName || '',
                itemDescription: item.itemDescription || '',
                itemCategory: item.itemCategory || '',
                customerName: item.customerName || '',
                customerPhone: item.customerPhone || '',
                customerEmail: item.customerEmail || '',
                tableNumber: item.tableNumber || '',
                foundLocation: item.foundLocation || '',
                sittingTimeDate: sittingTime ? sittingTime.toISOString().split('T')[0] : '',
                sittingTimeHour: sittingTime ? sittingTime.toTimeString().slice(0, 5) : '',
                sittingEndTimeHour: sittingEndTime ? sittingEndTime.toTimeString().slice(0, 5) : '',
                foundAtDate: foundAt ? foundAt.toISOString().split('T')[0] : '',
                foundAtHour: foundAt ? foundAt.toTimeString().slice(0, 5) : '',
                photoUrl: item.photoUrl || '',
                notes: item.notes || ''
            })
        }
    }, [item])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            // Tarih ve saati birleştir
            let sittingTime = null
            if (formData.sittingTimeDate && formData.sittingTimeHour) {
                sittingTime = `${formData.sittingTimeDate}T${formData.sittingTimeHour}:00`
            } else if (formData.sittingTimeDate) {
                sittingTime = `${formData.sittingTimeDate}T00:00:00`
            }

            let sittingEndTime = null
            if (formData.sittingTimeDate && formData.sittingEndTimeHour) {
                sittingEndTime = `${formData.sittingTimeDate}T${formData.sittingEndTimeHour}:00`
            }

            if (sittingTime && sittingEndTime) {
                const startTime = new Date(sittingTime)
                const endTime = new Date(sittingEndTime)
                if (endTime < startTime) {
                    setError('Oturma bitiş saati başlangıçtan önce olamaz.')
                    setIsSubmitting(false)
                    return
                }
            }

            let foundAt = null
            if (formData.foundAtDate && formData.foundAtHour) {
                foundAt = `${formData.foundAtDate}T${formData.foundAtHour}:00`
            } else if (formData.foundAtDate) {
                foundAt = `${formData.foundAtDate}T00:00:00`
            }

            const res = await updateLostItem({
                id: item.id,
                itemName: formData.itemName,
                itemDescription: formData.itemDescription,
                itemCategory: formData.itemCategory,
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
                tableNumber: formData.tableNumber,
                foundLocation: formData.foundLocation,
                sittingTime,
                sittingEndTime,
                foundAt,
                notes: formData.notes,
                photoUrl: formData.photoUrl
            })

            if (!res.success) throw new Error(res.error)
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/10 w-full max-w-2xl my-8 shadow-2xl">
                {/* Başlık */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">✏️</span>
                        Kayıp Eşya Düzenle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Eşya Bilgileri */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <span>📦</span> Eşya Bilgileri
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Eşya Adı *
                                </label>
                                <input
                                    type="text"
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    placeholder="Örn: iPhone 14, Siyah Cüzdan..."
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Kategori *
                                </label>
                                <select
                                    name="itemCategory"
                                    value={formData.itemCategory}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                >
                                    <option value="" className="bg-gray-900">Kategori Seçin</option>
                                    {ITEM_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value} className="bg-gray-900">
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Fotoğraf Linki (Opsiyonel)
                            </label>
                            <input
                                type="url"
                                name="photoUrl"
                                value={formData.photoUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Açıklama (Renk, marka, özellikler)
                            </label>
                            <textarea
                                name="itemDescription"
                                value={formData.itemDescription}
                                onChange={handleChange}
                                placeholder="Örn: Mavi kılıflı, ekranında küçük çizik var..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Konum ve Zaman */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <span>📍</span> Konum ve Zaman
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Masa Numarası
                                </label>
                                <input
                                    type="text"
                                    name="tableNumber"
                                    value={formData.tableNumber}
                                    onChange={handleChange}
                                    placeholder="Örn: 12, VIP-3..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Bulunduğu Yer
                                </label>
                                <input
                                    type="text"
                                    name="foundLocation"
                                    value={formData.foundLocation}
                                    onChange={handleChange}
                                    placeholder="Örn: Tuvalet, Giriş, Bahçe..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Bulunma Tarihi ve Saati */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Bulunma Tarihi ve Saati
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    name="foundAtDate"
                                    value={formData.foundAtDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <input
                                    type="time"
                                    name="foundAtHour"
                                    value={formData.foundAtHour}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Müşteri Oturma Saati */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Müşteri Oturma Tarihi ve Saati
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="date"
                                    name="sittingTimeDate"
                                    value={formData.sittingTimeDate}
                                    onChange={handleChange}
                                    placeholder="Tarih"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <input
                                    type="time"
                                    name="sittingTimeHour"
                                    value={formData.sittingTimeHour}
                                    onChange={handleChange}
                                    placeholder="Başlangıç"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <input
                                    type="time"
                                    name="sittingEndTimeHour"
                                    value={formData.sittingEndTimeHour}
                                    onChange={handleChange}
                                    placeholder="Bitiş"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Müşteri Bilgileri */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                            <span>👤</span> Müşteri Bilgileri (Opsiyonel)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Müşteri Adı
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="Biliniyorsa..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    placeholder="05XX XXX XX XX"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">
                                    E-posta
                                </label>
                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={formData.customerEmail}
                                    onChange={handleChange}
                                    placeholder="ornek@email.com"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notlar */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Ek Notlar
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Varsa ek bilgiler..."
                            rows={2}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.itemName || !formData.itemCategory || isSubmitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Kaydet
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
