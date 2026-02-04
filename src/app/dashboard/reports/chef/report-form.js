'use client'

import { useState } from 'react'
import { createReport, updateReport } from '@/app/actions/report'
import { useToast } from '@/app/providers/toast-provider'
import { useEffect } from 'react'
import { getSettings } from '@/app/actions/settings'

export default function ReportForm({ initialData, isManagerRole }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addToast } = useToast()
    const [minLen, setMinLen] = useState(5)
    const [personnelStatusLen, setPersonnelStatusLen] = useState(initialData?.personnelStatus?.length || 0)
    const [operationalNotesLen, setOperationalNotesLen] = useState(initialData?.operationalNotes?.length || 0)

    useEffect(() => {
        getSettings().then(res => {
            if (res.success) {
                const v = res.data?.reports?.minTextLength
                if (typeof v === 'number' && v > 0) setMinLen(v)
            }
        }).catch(() => {})
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.target)
        const data = {
            shiftType: formData.get('shiftType') || 'Sabah',
            personnelStatus: formData.get('personnelStatus') || '-',
            operationalNotes: formData.get('operationalNotes') || '-',
            technicalIssues: formData.get('technicalIssues'),
            closingChecklist: formData.get('closingChecklist') === 'on'
        }

        const minTextOk = (v) => !v || String(v).trim().length >= minLen
        if (!minTextOk(data.personnelStatus)) {
            addToast(`Personel durumu en az ${minLen} karakter olmalı`, 'error')
            setIsSubmitting(false)
            return
        }
        if (!minTextOk(data.operationalNotes)) {
            addToast(`Operasyon notları en az ${minLen} karakter olmalı`, 'error')
            setIsSubmitting(false)
            return
        }

        // Manager specific override
        if (isManagerRole) {
            data.shiftType = 'Sabah'
            data.personnelStatus = '-'
            data.operationalNotes = '-'
            data.closingChecklist = true
        }

        try {
            let res
            if (initialData?.id) {
                res = await updateReport({ ...data, id: initialData.id })
            } else {
                res = await createReport(data)
            }

            if (res?.error) {
                addToast(res.error, 'error')
            } else {
                addToast(initialData ? 'Rapor güncellendi' : 'Rapor oluşturuldu', 'success')
            }
        } catch (error) {
            addToast('Bir hata oluştu.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            {/* Ambient Grad */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            {isManagerRole ? (
                <>
                    <div className="bg-yellow-900/10 border border-yellow-700/30 p-4 rounded-xl text-yellow-200 text-sm mb-6 flex items-start gap-3">
                        <span className="text-xl">ℹ️</span>
                        <div>
                            <div className="font-bold mb-1">Yönetici Modu</div>
                            <div className="opacity-80">Basitleştirilmiş form görüntüleniyor. Sadece teknik arıza bildirimi yapabilirsiniz.</div>
                        </div>
                    </div>

                    <input type="hidden" name="shiftType" value="Sabah" />
                    <input type="hidden" name="closingChecklist" value="on" />

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Teknik Aksaklıklar / Arıza Bildirimi</label>
                        <textarea
                            name="technicalIssues"
                            defaultValue={initialData?.technicalIssues || ''}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all min-h-[150px] resize-y"
                            placeholder="Lütfen karşılaştığınız teknik aksaklığı veya arızayı detaylı bir şekilde açıklayınız."
                            required
                        />
                    </div>
                </>
            ) : (
                <div className="space-y-8">
                    {/* Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Vardiya Tipi</label>
                            <div className="relative">
                                <select name="shiftType" defaultValue={initialData?.shiftType || 'Sabah'} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer" required>
                                    <option value="Sabah">☀️ Sabah Vardiyası</option>
                                    <option value="Akşam">🌙 Akşam Vardiyası</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Personel Durumu</label>
                        <textarea
                            name="personnelStatus"
                            defaultValue={initialData?.personnelStatus || ''}
                            onChange={(e) => setPersonnelStatusLen(String(e.target.value).length)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all min-h-[80px]"
                            placeholder="Örn: 2 Eksik (Ali izinli), mutfak tam kadro."
                            required
                        />
                        <div className="text-[11px] text-gray-500 mt-1">{personnelStatusLen} / {minLen} karakter</div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Operasyonel Notlar</label>
                        <textarea
                            name="operationalNotes"
                            defaultValue={initialData?.operationalNotes || ''}
                            onChange={(e) => setOperationalNotesLen(String(e.target.value).length)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all min-h-[120px]"
                            placeholder="Gün içindeki önemli olaylar, misafir şikayetleri, özel durumlar..."
                            required
                        />
                        <div className="text-[11px] text-gray-500 mt-1">{operationalNotesLen} / {minLen} karakter</div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Teknik Aksaklıklar (Opsiyonel)</label>
                        <textarea
                            name="technicalIssues"
                            defaultValue={initialData?.technicalIssues || ''}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#d4af37] transition-all min-h-[80px]"
                            placeholder="Arızalı cihazlar, elektrik kesintisi vb."
                        />
                    </div>

                    <div className="flex items-center gap-4 p-5 border border-white/10 rounded-xl bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                name="closingChecklist"
                                id="closingChecklist"
                                defaultChecked={initialData?.closingChecklist}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-gray-600 bg-black checked:border-[#d4af37] checked:bg-[#d4af37] transition-all"
                            />
                            <svg className="absolute w-4 h-4 text-black pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <label htmlFor="closingChecklist" className="text-gray-300 font-medium cursor-pointer select-none group-hover:text-white transition-colors">
                            Kapanış prosedürleri ve temizlik kontrol listesi eksiksiz tamamlandı
                        </label>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#b49225] hover:to-[#d4af37] text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            İşleniyor...
                        </>
                    ) : (
                        initialData ? 'Değişiklikleri Kaydet' : 'Raporu Gönder →'
                    )}
                </button>
            </div>
        </form>
    )
}
