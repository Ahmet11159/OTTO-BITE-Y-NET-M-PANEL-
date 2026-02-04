'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { addManagerNote, toggleReviewStatus, deleteReport } from '@/app/actions/report'
import { getSettings } from '@/app/actions/settings'

export default function ReportCard({ report, isManager = false, isOwnReport = false, forceExpanded = false, onViewDetail }) {
    const [expanded, setExpanded] = useState(false)
    const [toast, setToast] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [locale, setLocale] = useState('tr-TR')

    useEffect(() => {
        getSettings()
            .then(res => {
                if (res.success && res.data?.general?.locale) {
                    setLocale(String(res.data.general.locale))
                }
            })
            .catch(() => {})
    }, [])

    // If forced expanded, always true. Else local state.
    const isExpanded = forceExpanded || expanded

    // Check if this is a manager-type report
    const isManagerReport = ['Müdür', 'Müdür Yardımcısı', 'Müşteri İlişkileri Yöneticisi'].includes(report.department)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleReviewToggle = async () => {
        try {
            const res = await toggleReviewStatus({ id: report.id, isReviewed: !report.isReviewed })
            if (res?.success) {
                showToast(report.isReviewed ? 'İnceleme iptal edildi' : 'Rapor incelendi olarak işaretlendi')
            } else {
                showToast(res?.error || 'Hata oluştu', 'error')
            }
        } catch (error) {
            showToast('Hata oluştu', 'error')
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true)
            return
        }
        try {
            const res = await deleteReport({ id: report.id })
            if (res?.success) {
                showToast('Rapor silindi')
            } else {
                showToast(res?.error || 'Silme işlemi başarısız', 'error')
            }
        } catch (error) {
            showToast('Silme işlemi başarısız', 'error')
        }
        setDeleteConfirm(false)
    }

    const deptColors = {
        'Bar': 'shadow-[inset_4px_0_0_0_#a855f7] hover:shadow-[inset_6px_0_0_0_#a855f7,_0_0_20px_rgba(168,85,247,0.1)]',
        'Salon': 'shadow-[inset_4px_0_0_0_#d4af37] hover:shadow-[inset_6px_0_0_0_#d4af37,_0_0_20px_rgba(212,175,55,0.1)]',
        'Mutfak': 'shadow-[inset_4px_0_0_0_#ef4444] hover:shadow-[inset_6px_0_0_0_#ef4444,_0_0_20px_rgba(239,68,68,0.1)]',
        'Müdür': 'shadow-[inset_4px_0_0_0_#3b82f6] hover:shadow-[inset_6px_0_0_0_#3b82f6,_0_0_20px_rgba(59,130,246,0.1)]',
        'Müdür Yardımcısı': 'shadow-[inset_4px_0_0_0_#06b6d4] hover:shadow-[inset_6px_0_0_0_#06b6d4,_0_0_20px_rgba(6,182,212,0.1)]',
        'Müşteri İlişkileri Yöneticisi': 'shadow-[inset_4px_0_0_0_#ec4899] hover:shadow-[inset_6px_0_0_0_#ec4899,_0_0_20px_rgba(236,72,153,0.1)]',
    }

    const glowClass = deptColors[report.department] || 'shadow-[inset_4px_0_0_0_#6b7280]'

    // ... (rest of logic)

    return (
        <div className={`relative group transition-all duration-500 ease-out mb-4 rounded-xl overflow-hidden ${report.isReviewed ? 'bg-black/40 border border-white/5 opacity-80' : `bg-[#111] border border-white/10 ${glowClass}`}`}>

            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-2 right-2 z-20 bg-white text-black text-xs px-3 py-1 rounded shadow-lg animate-fade-in-down">
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ${report.shiftType === 'Akşam' ? 'bg-blue-900/30 text-blue-400 shadow-blue-900/20' : 'bg-yellow-900/30 text-yellow-400 shadow-yellow-900/20'}`}>
                            {report.shiftType === 'Akşam' ? '🌙' : '☀️'}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl tracking-tight mb-0.5">{report.department}</h3>
                            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                                <span className="text-gray-300">{report.author.fullName}</span>
                                <span className="text-gray-600">•</span>
                                <span suppressHydrationWarning>{new Date(report.createdAt).toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        {!report.isReviewed ? (
                            <span className="bg-[#d4af37] text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse">
                                YENİ
                            </span>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="bg-green-900/30 text-green-400 border border-green-500/20 text-[10px] font-bold px-3 py-1.5 rounded-full mb-1">
                                    ✓ İNCELENDİ
                                </span>
                                {report.reviewer && (
                                    <span className="text-[9px] text-gray-500 font-medium tracking-wide">
                                        BY <span className="text-gray-300">{report.reviewer.fullName.toUpperCase()}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {!forceExpanded && (
                            <button
                                onClick={() => onViewDetail ? onViewDetail(report) : setExpanded(!expanded)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-white/10 text-white rotate-180' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                ▼
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content - Only visible when expanded */}
            {/* Content - Only visible when expanded */}
            {isExpanded && (
                <div className="px-6 pb-6 animate-fade-in">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Info Column */}
                        <div className="md:col-span-1 space-y-3">
                            {/* Only show Personnel Status if it has content (skips for Directors) */}
                            {report.personnelStatus && report.personnelStatus !== '-' && (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                                        <span>👥 Personel Durumu</span>
                                    </div>
                                    <div className="text-gray-300 text-sm leading-relaxed">{report.personnelStatus}</div>
                                </div>
                            )}

                            {report.technicalIssues && (
                                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                    <div className="text-red-400 text-[10px] uppercase font-bold tracking-widest mb-2 animate-pulse">⚠️ Teknik Sorun</div>
                                    <div className="text-red-200 text-sm font-medium">{report.technicalIssues}</div>
                                </div>
                            )}

                            {/* Closing Check */}
                            {report.operationalNotes !== '-' && (
                                <div className="mt-4 flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                                    <span className="text-gray-500 text-xs font-medium">Kapanış Kontrolü</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${report.closingChecklist ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                                        {report.closingChecklist ? "TAMAMLANDI" : "EKSİK"}
                                    </span>
                                </div>
                            )}

                            {/* Actions Row */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                {isManager && !isOwnReport && (
                                    <button
                                        onClick={handleReviewToggle}
                                        className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${report.isReviewed
                                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-green-500/30'
                                            }`}
                                    >
                                        {report.isReviewed ? 'İncelemeyi İptal Et' : 'İncelendi Olarak İşaretle'}
                                    </button>
                                )}

                                {isOwnReport && (
                                    <>
                                        <Link href={`/dashboard/reports/chef/edit/${report.id}`} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg text-center transition-all border border-white/10">
                                            Düzenle
                                        </Link>
                                        <button
                                            onClick={handleDelete}
                                            onMouseLeave={() => setDeleteConfirm(false)}
                                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all border ${deleteConfirm ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-transparent border-white/10 text-gray-400 hover:text-red-400 hover:border-red-900'}`}
                                        >
                                            {deleteConfirm ? 'Emin misin?' : 'Sil'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notes Column */}
                        <div className="md:col-span-2 flex flex-col gap-6">
                            <div>
                                {/* Only show Operational Notes if content exists */}
                                {report.operationalNotes && report.operationalNotes !== '-' && (
                                    <div className="bg-black/20 p-5 rounded-xl border border-white/5 h-full">
                                        <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                                            <span>📝 Operasyonel Notlar</span>
                                        </div>
                                        <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-light">
                                            {report.operationalNotes}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Manager Note Section */}
                            {(() => {
                                const noteExists = !!report.managerNote
                                const canEditNote = isManager && (!isManagerReport || !isOwnReport)

                                if (noteExists || canEditNote) {
                                    return (
                                        <ManagerNoteSection
                                            report={report}
                                            canEdit={canEditNote}
                                            showToast={showToast}
                                        />
                                    )
                                }
                                return null
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ManagerNoteSection({ report, canEdit, showToast }) {
    const [isEditing, setIsEditing] = useState(false)
    const [note, setNote] = useState(report.managerNote || '')

    const handleUpdate = async (e) => {
        e.preventDefault()
        try {
            const res = await addManagerNote({ reportId: report.id, managerNote: note })
            if (res?.success) {
                showToast("Yönetici notu güncellendi")
                setIsEditing(false)
            } else {
                showToast(res?.error || "Hata oluştu", "error")
            }
        } catch (error) {
            showToast("Hata oluştu", "error")
        }
    }

    if (isEditing) {
        return (
            <div className="mt-6 bg-black/60 p-4 rounded border border-gray-800">
                <div className="text-xs text-gold uppercase tracking-widest mb-2">Notu Düzenle</div>
                <form onSubmit={handleUpdate} className="flex flex-col gap-2">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-zinc-900 border border-gray-700 rounded p-2 text-white text-sm focus:outline-none focus:border-gold min-h-[80px]"
                        placeholder="Yönetici notunuzu buraya yazın..."
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false)
                                setNote(report.managerNote || '')
                            }}
                            className="text-xs text-gray-400 hover:text-white px-3 py-1"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="text-xs bg-gold text-black font-bold px-4 py-2 rounded hover:bg-yellow-400"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    // Display Mode
    return (
        <div className="mt-6 bg-black/60 p-4 rounded border border-gray-800 group/note">
            {report.managerNote ? (
                <div>
                    <div className="text-xs text-gold uppercase tracking-widest mb-1 flex justify-between items-center">
                        <span>Yönetici Notu</span>
                        {canEdit && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover/note:opacity-100 transition-opacity text-gray-400 hover:text-white p-1"
                                title="Notu Düzenle"
                            >
                                ✏️
                            </button>
                        )}
                    </div>
                    <p className="text-white text-sm">{report.managerNote}</p>
                </div>
            ) : (
                canEdit && (
                    <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target)
                        const noteVal = formData.get('managerNote')
                        const res = await addManagerNote({ reportId: report.id, managerNote: noteVal })
                        if (res?.success) {
                            showToast("Not eklendi ve rapor onaylandı")
                            e.target.reset()
                        } else {
                            showToast(res?.error || "Hata oluştu", "error")
                        }
                    }} className="flex gap-2">
                        <input type="hidden" name="reportId" value={report.id} />
                        <input
                            type="text"
                            name="managerNote"
                            placeholder="Yönetici notu ekle..."
                            className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm py-2 focus:outline-none focus:border-gold placeholder:text-gray-600"
                            required
                        />
                        <button type="submit" className="text-xs bg-gray-800 hover:bg-gold hover:text-black text-white px-4 py-2 rounded transition-colors text-nowrap">
                            Not Ekle
                        </button>
                    </form>
                )
            )}
        </div>
    )
}
