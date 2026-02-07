import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LostFoundDashboard from './lost-found-dashboard'
import { getLostItems, getLostItemStats } from '@/app/actions/lost-found'
import { getSettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Kayıp Eşya Yönetimi | OTTOBITE ShiftLog',
    description: 'Kayıp eşya takibi ve yönetimi'
}

export default async function LostFoundPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    const itemsRes = await getLostItems()
    const statsRes = await getLostItemStats()
    const settingsRes = await getSettings()
    const items = itemsRes.success ? itemsRes.data : []
    const stats = statsRes.success ? statsRes.data : {
        total: items.length,
        found: items.filter(i => i.status === 'FOUND').length,
        returned: items.filter(i => i.status === 'RETURNED').length,
        disposed: items.filter(i => i.status === 'DISPOSED').length,
        recentItems: 0,
        byCategory: []
    }
    const initialLocale = settingsRes?.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'

    return (
        <LostFoundDashboard
            initialItems={items}
            stats={stats}
            user={session}
            initialLocale={initialLocale}
        />
    )
}
