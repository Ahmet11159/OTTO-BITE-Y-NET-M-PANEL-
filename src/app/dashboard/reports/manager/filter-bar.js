'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentDept = searchParams.get('department') || 'all'
    const currentShift = searchParams.get('shiftType') || 'all'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const handleFilterChange = (key, value) => {
        const params = new URLSearchParams(searchParams)
        if (value === 'all' || value === '') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`?${params.toString()}`)
    }

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0]
        const params = new URLSearchParams(searchParams)
        params.set('startDate', today)
        params.set('endDate', today)
        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        router.push('/dashboard/reports/manager')
    }

    return (
        <div className="sticky top-[72px] z-30 transition-all duration-300 mb-8">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl shadow-black/20 flex flex-wrap gap-6 items-end justify-between">

                {/* Inputs */}
                <div className="flex flex-wrap gap-4 items-end flex-1">
                    {/* Date Range */}
                    <div className="flex-col min-w-[240px]">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-widest pl-1">Tarih Aralığı</span>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 hover:border-[#d4af37]/50 transition-colors">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="bg-transparent text-white text-sm outline-none w-[110px] focus:text-[#d4af37]"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="bg-transparent text-white text-sm outline-none w-[110px] focus:text-[#d4af37]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={setToday}
                        className="h-[42px] px-5 rounded-xl bg-white/5 hover:bg-[#d4af37] hover:text-black border border-white/10 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        Bugün
                    </button>

                    <div className="w-px h-10 bg-white/10 hidden md:block mx-2"></div>

                    {/* Department */}
                    <div className="flex-col min-w-[180px]">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-widest pl-1">Departman</span>
                        <div className="relative">
                            <select
                                value={currentDept}
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
                            >
                                <option value="all">Tümü</option>
                                <option value="Salon">Salon</option>
                                <option value="Bar">Bar</option>
                                <option value="Mutfak">Mutfak</option>
                                <option value="Belirtilmemiş">Belirtilmemiş</option>
                                <option value="Müdür">Müdür</option>
                                <option value="Müdür Yardımcısı">Müdür Yrd.</option>
                                <option value="Müşteri İlişkileri Yöneticisi">CRM</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                        </div>
                    </div>

                    {/* Shift */}
                    <div className="flex-col min-w-[140px]">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-widest pl-1">Vardiya</span>
                        <div className="relative">
                            <select
                                value={currentShift}
                                onChange={(e) => handleFilterChange('shiftType', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
                            >
                                <option value="all">Tümü</option>
                                <option value="Sabah">Sabah</option>
                                <option value="Akşam">Akşam</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                        </div>
                    </div>
                </div>

                {/* Clear */}
                {(currentDept !== 'all' || currentShift !== 'all' || startDate || endDate) && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider underline decoration-red-400/30 hover:decoration-red-400 ml-auto"
                    >
                        Filtreleri Temizle
                    </button>
                )}
            </div>
        </div>
    )
}
