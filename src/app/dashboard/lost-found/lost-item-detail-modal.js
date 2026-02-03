'use client'

import { ITEM_CATEGORIES, STATUS_CONFIG, getCategoryIcon } from './constants'

export default function LostItemDetailModal({ item, isAdmin, canEdit, onClose, onEdit, onReturn, onDispose, onDelete }) {
    // Tarih formatla
    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/10 w-full max-w-2xl my-8 shadow-2xl">
                {/* Başlık */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{getCategoryIcon(item.itemCategory)}</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{item.itemName}</h2>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border mt-1 ${STATUS_CONFIG[item.status].color}`}>
                                {STATUS_CONFIG[item.status].icon} {STATUS_CONFIG[item.status].label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* İçerik */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Eşya Bilgileri */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>📦</span> Eşya Bilgileri
                        </h3>
                        {item.photoUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                <img
                                    src={item.photoUrl}
                                    alt={item.itemName}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                    }}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-white/40">Kategori</p>
                                <p className="text-white">{item.itemCategory}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/40">Kayıt No</p>
                                <p className="text-white">#{item.id}</p>
                            </div>
                        </div>
                        {item.itemDescription && (
                            <div className="mt-4">
                                <p className="text-xs text-white/40">Açıklama</p>
                                <p className="text-white">{item.itemDescription}</p>
                            </div>
                        )}
                    </div>

                    {/* Konum ve Zaman */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>📍</span> Konum ve Zaman
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {item.tableNumber && (
                                <div>
                                    <p className="text-xs text-white/40">Masa Numarası</p>
                                    <p className="text-white flex items-center gap-2">
                                        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        {item.tableNumber}
                                    </p>
                                </div>
                            )}
                            {item.foundLocation && (
                                <div>
                                    <p className="text-xs text-white/40">Bulunduğu Yer</p>
                                    <p className="text-white flex items-center gap-2">
                                        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {item.foundLocation}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-white/40">Bulunma Tarihi</p>
                                <p className="text-white flex items-center gap-2">
                                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(item.foundAt)}
                                </p>
                            </div>
                            {item.sittingTime && (
                                <div>
                                    <p className="text-xs text-white/40">Müşteri Oturma Saati</p>
                                    <p className="text-white">
                                        {formatDate(item.sittingTime)}
                                        {item.sittingEndTime && ` - ${new Date(item.sittingEndTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Müşteri Bilgileri */}
                    {(item.customerName || item.customerPhone || item.customerEmail) && (
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span>👤</span> Müşteri Bilgileri
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {item.customerName && (
                                    <div>
                                        <p className="text-xs text-white/40">Ad Soyad</p>
                                        <p className="text-white">{item.customerName}</p>
                                    </div>
                                )}
                                {item.customerPhone && (
                                    <div>
                                        <p className="text-xs text-white/40">Telefon</p>
                                        <a href={`tel:${item.customerPhone}`} className="text-blue-400 hover:underline">
                                            {item.customerPhone}
                                        </a>
                                    </div>
                                )}
                                {item.customerEmail && (
                                    <div>
                                        <p className="text-xs text-white/40">E-posta</p>
                                        <a href={`mailto:${item.customerEmail}`} className="text-blue-400 hover:underline">
                                            {item.customerEmail}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Teslim Bilgileri */}
                    {item.status === 'RETURNED' && (
                        <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span>✅</span> Teslim Bilgileri
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-white/40">Teslim Alan</p>
                                    <p className="text-white">{item.returnedTo}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40">Teslim Tarihi</p>
                                    <p className="text-white">{formatDate(item.returnedAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notlar */}
                    {item.notes && (
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span>📝</span> Notlar
                            </h3>
                            <p className="text-white/80">{item.notes}</p>
                        </div>
                    )}

                    {/* Sistem Bilgileri */}
                    <div className="text-xs text-white/40 flex flex-wrap gap-4">
                        <span>Bildiren: {item.reportedBy?.fullName || 'Bilinmiyor'}</span>
                        <span>Kayıt: {formatDate(item.createdAt)}</span>
                        <span>Güncelleme: {formatDate(item.updatedAt)}</span>
                    </div>
                </div>

                {/* Footer - Aksiyonlar */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        Kapat
                    </button>

                    {canEdit && (
                        <button
                            onClick={onEdit}
                            className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Düzenle
                        </button>
                    )}

                    {isAdmin && item.status === 'FOUND' && (
                        <>
                            <button
                                onClick={onReturn}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Teslim Et
                            </button>
                            <button
                                onClick={onDispose}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                İmha
                            </button>
                        </>
                    )}

                    {isAdmin && (
                        <button
                            onClick={onDelete}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                            title="Kaydı Sil"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
