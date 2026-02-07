'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { returnItem, disposeItem, deleteLostItem } from '@/app/actions/lost-found'
import { ITEM_CATEGORIES, STATUS_CONFIG, getCategoryIcon } from './constants'
import LostItemForm from './lost-item-form'
import LostItemDetailModal from './lost-item-detail-modal'
import LostItemEditModal from './lost-item-edit-modal'
import { useToast } from '@/app/providers/toast-provider'
import ConfirmModal from '@/app/components/confirm-modal'

export default function LostFoundDashboard({ initialItems, stats, user, initialLocale = 'tr-TR' }) {
    const router = useRouter()
    const [items, setItems] = useState(initialItems)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [showNewForm, setShowNewForm] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [returnToName, setReturnToName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addToast } = useToast()
    const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null })
    const [locale, setLocale] = useState(initialLocale || 'tr-TR')

    const isAdmin = user?.role === 'ADMIN'

    const showToast = (message, type = 'success') => addToast(message, type)

    useEffect(() => {
        setLocale(initialLocale || 'tr-TR')
    }, [initialLocale])

    // Filtreleme
    const filteredItems = items.filter(item => {
        // Durum filtresi
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false

        // Kategori filtresi
        if (categoryFilter !== 'ALL' && item.itemCategory !== categoryFilter) return false

        // Arama filtresi
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                item.itemName.toLowerCase().includes(query) ||
                item.itemDescription?.toLowerCase().includes(query) ||
                item.tableNumber?.toLowerCase().includes(query) ||
                item.customerName?.toLowerCase().includes(query) ||
                item.foundLocation?.toLowerCase().includes(query)
            )
        }

        return true
    })

    // Yeni kayıt oluşturuldu
    const handleItemCreated = () => {
        setShowNewForm(false)
        showToast('Kayıp eşya kaydedildi!')
        router.refresh()
    }

    // Kayıt güncellendi
    const handleItemUpdated = () => {
        setShowEditModal(false)
        setSelectedItem(null)
        showToast('Kayıt güncellendi!')
        router.refresh()
    }

    // Teslim et
    const handleReturn = async () => {
        if (!selectedItem || !returnToName.trim()) return
        setIsSubmitting(true)

        try {
            const res = await returnItem({ id: selectedItem.id, returnedTo: returnToName })
            if (!res.success) throw new Error(res.error)

            showToast(`"${selectedItem.itemName}" teslim edildi!`)
            setShowReturnModal(false)
            setSelectedItem(null)
            setReturnToName('')
            router.refresh()
        } catch (error) {
            showToast(error.message, 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    // İmha et
    const handleDispose = async (item) => {
        setConfirmState({
            open: true,
            message: `"${item.itemName}" eşyasını imha edildi olarak işaretlemek istiyor musunuz?`,
            onConfirm: async () => {
                setIsSubmitting(true)
                try {
                    const res = await disposeItem({ id: item.id })
                    if (!res.success) throw new Error(res.error)
                    showToast(`"${item.itemName}" imha edildi olarak işaretlendi.`, 'success')
                    router.refresh()
                } catch (error) {
                    showToast(error.message, 'error')
                } finally {
                    setIsSubmitting(false)
                    setConfirmState({ open: false, message: '', onConfirm: null })
                }
            }
        })
    }

    // Reminders Logic
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const longWaitingItems = items.filter(item => item.status === 'FOUND' && new Date(item.foundAt) < sevenDaysAgo && new Date(item.foundAt) >= thirtyDaysAgo)
    const toDisposeItems = items.filter(item => item.status === 'FOUND' && new Date(item.foundAt) < thirtyDaysAgo)

    // Sil
    const handleDelete = async (item) => {
        setConfirmState({
            open: true,
            message: `"${item.itemName}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            onConfirm: async () => {
                setIsSubmitting(true)
                try {
                    const res = await deleteLostItem({ id: item.id })
                    if (!res.success) throw new Error(res.error)
                    showToast('Kayıt silindi.', 'success')
                    setSelectedItem(null)
                    router.refresh()
                } catch (error) {
                    showToast(error.message, 'error')
                } finally {
                    setIsSubmitting(false)
                    setConfirmState({ open: false, message: '', onConfirm: null })
                }
            }
        })
    }

    // Tarih formatla
    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Kısa tarih formatı
    const formatShortDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            

            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">🔍</span>
                        Kayıp Eşya Yönetimi
                    </h1>
                    <p className="text-white/60 mt-1">
                        Bulunan eşyaları kaydedin ve takip edin
                    </p>
                </div>
                <button
                    onClick={() => setShowNewForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Kayıt
                </button>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Toplam</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🟡</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Bekleyen</p>
                            <p className="text-2xl font-bold text-amber-400">{stats.found}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Teslim Edildi</p>
                            <p className="text-2xl font-bold text-emerald-400">{stats.returned}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl rounded-2xl p-5 border border-red-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">İmha Edildi</p>
                            <p className="text-2xl font-bold text-red-400">{stats.disposed}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtreler */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Arama */}
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Eşya, masa, müşteri ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    {/* Durum Filtresi */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                    >
                        <option value="ALL" className="bg-gray-900">Tüm Durumlar</option>
                        <option value="FOUND" className="bg-gray-900">🟡 Bekleyen</option>
                        <option value="RETURNED" className="bg-gray-900">🟢 Teslim Edildi</option>
                        <option value="DISPOSED" className="bg-gray-900">🔴 İmha Edildi</option>
                    </select>

                    {/* Kategori Filtresi */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                    >
                        <option value="ALL" className="bg-gray-900">Tüm Kategoriler</option>
                        {ITEM_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value} className="bg-gray-900">
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Eşya Listesi */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
                        <span className="text-6xl">🔍</span>
                        <p className="text-white/60 mt-4">
                            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                                ? 'Arama kriterlerine uygun kayıt bulunamadı.'
                                : 'Henüz kayıp eşya kaydı bulunmuyor.'}
                        </p>
                        {!searchQuery && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
                            <button
                                onClick={() => setShowNewForm(true)}
                                className="mt-4 px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all"
                            >
                                İlk kaydı oluştur
                            </button>
                        )}
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Eşya Bilgileri */}
                                <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                        <span className="text-3xl">{getCategoryIcon(item.itemCategory)}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-semibold text-white">{item.itemName}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[item.status].color}`}>
                                                    {STATUS_CONFIG[item.status].icon} {STATUS_CONFIG[item.status].label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/60">
                                                {item.tableNumber && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                        </svg>
                                                        Masa: {item.tableNumber}
                                                    </span>
                                                )}
                                                {item.foundLocation && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {item.foundLocation}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatShortDate(item.foundAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {item.reportedBy?.fullName || 'Bilinmiyor'}
                                                </span>
                                            </div>

                                            {item.itemDescription && (
                                                <p className="text-sm text-white/50 mt-2 line-clamp-1">{item.itemDescription}</p>
                                            )}

                                            {item.status === 'RETURNED' && item.returnedTo && (
                                                <p className="text-sm text-emerald-400 mt-2">
                                                    ✓ {formatShortDate(item.returnedAt)} tarihinde <strong>{item.returnedTo}</strong>'a teslim edildi
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Aksiyonlar */}
                                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Detay
                                    </button>

                                    {isAdmin && item.status === 'FOUND' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setShowReturnModal(true)
                                                }}
                                                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Teslim Et
                                            </button>
                                            <button
                                                onClick={() => handleDispose(item)}
                                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                İmha
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Yeni Kayıt Modal */}
            {showNewForm && (
                <LostItemForm
                    onClose={() => setShowNewForm(false)}
                    onSuccess={handleItemCreated}
                />
            )}

            {/* Detay Modal */}
            {selectedItem && !showReturnModal && !showEditModal && (
                <LostItemDetailModal
                    item={selectedItem}
                    isAdmin={isAdmin}
                    canEdit={isAdmin || selectedItem.reportedById === parseInt(user?.id)}
                    onClose={() => setSelectedItem(null)}
                    onEdit={() => setShowEditModal(true)}
                    onReturn={() => setShowReturnModal(true)}
                    onDispose={() => handleDispose(selectedItem)}
                    onDelete={() => handleDelete(selectedItem)}
                    locale={locale}
                />
            )}

            {/* Düzenleme Modal */}
            {showEditModal && selectedItem && (
                <LostItemEditModal
                    item={selectedItem}
                    onClose={() => {
                        setShowEditModal(false)
                    }}
                    onSuccess={handleItemUpdated}
                />
            )}

            {/* Teslim Modal */}
            {showReturnModal && selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            Eşyayı Teslim Et
                        </h2>

                        <p className="text-white/60 mb-4">
                            <strong className="text-white">{selectedItem.itemName}</strong> eşyasını teslim ediyorsunuz.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Teslim Alan Kişinin Adı *
                            </label>
                            <input
                                type="text"
                                value={returnToName}
                                onChange={(e) => setReturnToName(e.target.value)}
                                placeholder="Örn: Ahmet Yılmaz"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowReturnModal(false)
                                    setReturnToName('')
                                }}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleReturn}
                                disabled={!returnToName.trim() || isSubmitting}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Kaydediliyor...' : 'Teslim Et'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={confirmState.open}
                title="Onay"
                message={confirmState.message}
                confirmText="Onayla"
                cancelText="Vazgeç"
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
            />
        </div>
    )
}
