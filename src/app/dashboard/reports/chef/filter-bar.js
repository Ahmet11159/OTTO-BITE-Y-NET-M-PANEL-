'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ChefFilterBar() {
    return (
        <form className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md flex flex-wrap gap-6 items-end shadow-xl shadow-black/20">
            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Başlangıç</label>
                <input name="startDate" type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all" />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Bitiş</label>
                <input name="endDate" type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all" />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 block">Vardiya Tipi</label>
                <div className="relative">
                    <select name="shiftType" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] appearance-none transition-all">
                        <option value="all">Tümü</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Akşam">Akşam</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
                <button type="submit" className="flex-1 sm:flex-none bg-[#d4af37] text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#b0902c] hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    Filtrele
                </button>
                <a href="/dashboard/reports/chef" className="flex-1 sm:flex-none border border-white/10 bg-white/5 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all text-center">
                    Temizle
                </a>
            </div>
        </form>
    )
}
