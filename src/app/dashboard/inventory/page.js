import Link from 'next/link'
import { getInventory } from '@/app/actions/inventory'
import { getSession } from '@/lib/auth'
import InventoryList from './inventory-list'

// Force dynamic rendering to always show fresh data
export const dynamic = 'force-dynamic'

export default async function InventoryPage({ searchParams }) {
    const res = await getInventory({
        startDate: searchParams?.startDate,
        endDate: searchParams?.endDate
    })
    const products = res.success ? res.data : []
    const session = await getSession()

    return (
        <div>
            {/* Premium Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Depo Stok Kontrol</h1>
                            <p className="text-gray-400 text-sm">Anlık stok takibi ve hareket dökümü</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium rounded-xl border border-white/10 transition-all"
                        >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Panele Dön
                    </Link>
                </div>
            </div>

            <InventoryList initialProducts={products} userRole={session?.role} />
        </div>
    )
}
